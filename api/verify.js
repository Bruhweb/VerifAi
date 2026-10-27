export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Mengizinkan unggahan gambar beresolusi tinggi hingga 10MB
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metode tidak diizinkan (Gunakan POST)' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Kunci API (GEMINI_API_KEY) belum terbaca di server Vercel. Pastikan sudah disimpan di Environment Variables dan di-Redeploy.'
    });
  }

  try {
    const { prompt, imageBase64, mimeType, mode } = req.body;

    // Instruksi Sistem Forensik agar AI menjawab dengan struktur JSON yang rapi untuk orang awam
    const systemInstruction = `Kamu adalah VerifAI, sistem pakar forensik digital, detektor konten AI, dan pemeriksa fakta berita.
Tugasmu adalah menganalisis input pengguna (teks dan/atau gambar) secara objektif, tajam, dan mudah dipahami oleh masyarakat awam.

WAJIB kembalikan respons HANYA dalam format JSON murni dengan struktur persis seperti ini (tanpa markdown \`\`\`json):
{
  "verdict": "Pilih satu: ASLI / FAKTA | INDIKASI AI | HOAKS / MANIPULASI | PERLU VERIFIKASI LANJUT",
  "riskLevel": "Pilih satu: Rendah | Sedang | Tinggi",
  "aiProbability": angka_0_sampai_100,
  "credibilityScore": angka_0_sampai_100,
  "summary": "Ringkasan kesimpulan 1-2 kalimat yang sangat jelas dan tegas untuk orang awam.",
  "keyFindings": [
    "Temuan 1 (contoh: tekstur visual, pencahayaan, atau kejanggalan klaim teks)",
    "Temuan 2",
    "Temuan 3"
  ],
  "recommendation": "Saran praktis dan langkah bijak bagi pengguna terkait informasi/media ini."
}`;

    const userPrompt = `${systemInstruction}\n\n[MODE ANALISIS: ${mode || 'Umum'}]\n[INPUT PENGGUNA]: ${prompt || 'Tolong analisis keaslian dan validitas data pada media ini secara menyeluruh.'}`;

    // Menyusun payload standar REST API Google
    const parts = [{ text: userPrompt }];
    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: mimeType || 'image/png',
          data: imageBase64
        }
      });
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
      }
    };

    // 1. Daftar kandidat model prioritas lintas generasi & versi API (v1beta & v1)
    let candidates = [
      { version: 'v1beta', model: 'gemini-3.0-flash' },
      { version: 'v1beta', model: 'gemini-3.0-pro' },
      { version: 'v1beta', model: 'gemini-2.0-flash' },
      { version: 'v1', model: 'gemini-2.0-flash' },
      { version: 'v1beta', model: 'gemini-2.5-flash' },
      { version: 'v1beta', model: 'gemini-1.5-pro-latest' }
    ];

    // 2. FITUR AUTO-DISCOVERY: Bertanya langsung ke Google model apa yang aktif untuk API Key ini
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listRes = await fetch(listUrl);
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.models && Array.isArray(listData.models)) {
          const supportedModels = listData.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => ({
              version: 'v1beta',
              model: m.name.replace('models/', '')
            }))
            // Mengutamakan keluarga model flash atau pro generasi terbaru (3.0 / 2.5 / 2.0)
            .sort((a, b) => b.model.localeCompare(a.model));

          if (supportedModels.length > 0) {
            // Gabungkan hasil temuan otomatis ke barisan paling depan!
            const uniqueModels = new Map();
            [...supportedModels, ...candidates].forEach(item => {
              uniqueModels.set(`${item.version}/${item.model}`, item);
            });
            candidates = Array.from(uniqueModels.values());
          }
        }
      }
    } catch (discoveryErr) {
      console.warn('Auto-discovery dilewati, menggunakan daftar model cadangan:', discoveryErr.message);
    }

    let successData = null;
    let usedModel = '';
    const errorLogs = [];

    // 3. Eksekusi berantai (Fallback Loop) sampai menemukan model yang merespons 200 OK
    for (const candidate of candidates) {
      // Lewati model khusus embedding/audio murni jika ada di daftar auto-discovery
      if (candidate.model.includes('embedding') || candidate.model.includes('aqa') || candidate.model.includes('tts')) {
        continue;
      }

      const endpoint = `https://generativelanguage.googleapis.com/${candidate.version}/models/${candidate.model}:generateContent?key=${apiKey}`;
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          successData = data.candidates[0].content.parts[0].text;
          usedModel = `${candidate.model} (${candidate.version})`;
          break; // BERHASIL! Langsung keluar dari perulangan
        } else {
          const errMsg = data.error?.message || `Status ${response.status}`;
          errorLogs.push(`[${candidate.model}]: ${errMsg}`);
        }
      } catch (fetchErr) {
        errorLogs.push(`[${candidate.model}]: ${fetchErr.message}`);
      }
    }

    if (!successData) {
      throw new Error(`Seluruh jalur model gagal diakses. Riwayat percobaan: ${errorLogs.slice(0, 3).join(' | ')}`);
    }

    // 4. Parsing hasil agar menjadi JSON terstruktur untuk tampilan UI
    let parsedResult = null;
    try {
      const cleanJson = successData.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (parseErr) {
      // Jika AI menjawab dengan teks biasa, bungkus otomatis ke format standar
      parsedResult = {
        verdict: "ANALISIS SELESAI",
        riskLevel: "Sedang",
        aiProbability: 50,
        credibilityScore: 75,
        summary: "Berikut adalah hasil penelusuran lengkap dari mesin analisis VerifAI.",
        keyFindings: [successData],
        recommendation: "Gunakan hasil penelusuran di atas sebagai referensi silang dengan sumber informasi resmi."
      };
    }

    return res.status(200).json({
      success: true,
      modelUsed: usedModel,
      result: parsedResult,
      rawText: successData
    });

  } catch (error) {
    console.error('Error Backend VerifAI:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}