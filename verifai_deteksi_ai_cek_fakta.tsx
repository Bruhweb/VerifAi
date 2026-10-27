import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Film,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Cpu,
  UserCheck,
  Search,
  ExternalLink,
  Clock,
  Sparkles,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Info,
  Newspaper,
  Eye,
  Trash2,
  Layers
} from 'lucide-react';

// ==========================================
// DATA CONTOH CEPAT (QUICK PRESETS)
// ==========================================
const QUICK_PRESETS = [
  {
    id: 'preset-1',
    mode: 'text',
    label: 'Klaim Hoaks Kesehatan & AI',
    badge: 'Hoaks & Teks AI',
    text: 'Berdasarkan laporan eksklusif yang baru saja dirilis oleh Organisasi Kesehatan Dunia (WHO) pada pagi hari ini, mengonsumsi air rebusan kulit durian yang dicampur dengan garam Himalaya setiap pukul 03.00 pagi terbukti secara klinis mampu memperbaiki struktur DNA yang rusak dan memperpanjang usia harapan hidup manusia hingga 140 tahun tanpa efek samping sedikit pun. Dalam lanskap medis yang terus berkembang, penemuan revolusioner ini menjadi bukti nyata betapa pentingnya kembali ke alam.',
    context: 'Pesan berantai yang sering dibagikan di grup keluarga.'
  },
  {
    id: 'preset-2',
    mode: 'text',
    label: 'Berita Ekonomi & Kebijakan',
    badge: 'Cek Fakta Berita',
    text: 'Bank Indonesia terus mendorong perluasan penggunaan QRIS lintas negara (cross-border) di kawasan ASEAN seperti Thailand, Malaysia, dan Singapura guna memudahkan transaksi ritel wisatawan serta mendukung digitalisasi UMKM di Indonesia tanpa harus menukar uang fisik.',
    context: 'Artikel berita ekonomi nasional.'
  },
  {
    id: 'preset-3',
    mode: 'video',
    label: 'Klaim Video Viral Deepfake',
    badge: 'Klaim Video',
    text: 'Beredar video berdurasi 45 detik di TikTok dan X yang memperlihatkan Elon Musk sedang berbicara menggunakan bahasa Indonesia yang sangat fasih di sebuah panggung konferensi, mengumumkan pembagian 1.000 unit mobil Tesla gratis khusus bagi warga negara Indonesia yang mendaftarkan KTP mereka melalui tautan di bio akun tersebut.',
    context: 'Gerakan bibir terlihat sedikit kaku dan intonasi suara terdengar datar seperti robot.'
  }
];

// ==========================================
// FUNGSI PEMBUAT SAMPEL GAMBAR (CANVAS)
// ==========================================
const createSampleImage = (type) => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');

  if (type === 'ai-sample') {
    // Membuat visual bergaya sintetis / poster klaim sensasional
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#31102f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Grid futuristik
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 500);
      ctx.stroke();
    }
    for (let y = 0; y < 500; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // Lingkaran neon
    const radGrad = ctx.createRadialGradient(400, 220, 20, 400, 220, 180);
    radGrad.addColorStop(0, 'rgba(244, 63, 94, 0.45)');
    radGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(400, 220, 180, 0, Math.PI * 2);
    ctx.fill();

    // Teks klaim di dalam gambar
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BREAKING NEWS • EKSKLUSIF', 400, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('MENARA EIFFEL RESMI DIPINDAHKAN', 400, 200);
    ctx.fillText('KE GURUN SAHARA MULAI TAHUN 2026', 400, 245);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.fillText('Foto udara memperlihatkan proses pemindahan struktur baja menggunakan 500 helikopter', 400, 310);

    // Watermark artefak AI
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '13px monospace';
    ctx.fillText('SYNTHETIC RENDER // HANDS: 6_FINGERS // TEXTURE_SMOOTH_99%', 400, 450);
  }

  return canvas.toDataURL('image/png');
};

export default function App() {
  // State Mode & Input
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'image' | 'video'
  const [inputText, setInputText] = useState('');
  const [inputContext, setInputContext] = useState('');
  const [mediaFile, setMediaFile] = useState(null); // { name, base64, mimeType, previewUrl, isVideo }
  const [isDragging, setIsDragging] = useState(false);

  // State Proses & Hasil Analisis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [result, setResult] = useState(null);

  // State Riwayat Pemeriksaan
  const [history, setHistory] = useState([]);

  const fileInputRef = useRef(null);
  const resultSectionRef = useRef(null);

  // Efek animasi tahapan loading
  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Penanganan unggah file (Gambar atau Video->Ekstrak Frame)
  const handleFileProcess = (file) => {
    if (!file) return;
    setErrorMsg(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64 = dataUrl.split(',')[1];
        setMediaFile({
          name: file.name,
          base64,
          mimeType: file.type,
          previewUrl: dataUrl,
          isVideo: false
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      // Ekstrak frame pertama dari video secara otomatis untuk dianalisis multimodal
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.5;

      video.onloadeddata = () => {
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64 = dataUrl.split(',')[1];
          setMediaFile({
            name: `${file.name} (Frame Ekstraksi)`,
            base64,
            mimeType: 'image/jpeg',
            previewUrl: dataUrl,
            isVideo: true
          });
          URL.revokeObjectURL(url);
        }, 250);
      };

      video.onerror = () => {
        setErrorMsg('Gagal mengekstrak frame dari video. Silakan unggah tangkapan layar (screenshot) video tersebut.');
      };
    } else {
      setErrorMsg('Format file tidak didukung. Gunakan file gambar (JPG, PNG, WEBP) atau video (MP4, WEBM).');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileProcess(file);
  };

  // Muat preset contoh cepat
  const applyPreset = (preset) => {
    setErrorMsg(null);
    setActiveTab(preset.mode);
    setInputText(preset.text);
    setInputContext(preset.context || '');
    setMediaFile(null);
  };

  // Muat sampel gambar poster klaim untuk tab Gambar
  const applySampleImage = () => {
    setErrorMsg(null);
    setActiveTab('image');
    const dataUrl = createSampleImage('ai-sample');
    const base64 = dataUrl.split(',')[1];
    setMediaFile({
      name: 'poster-klaim-menara-eiffel-2026.png',
      base64,
      mimeType: 'image/png',
      previewUrl: dataUrl,
      isVideo: false
    });
    setInputText('Beredar gambar poster berita yang mengklaim Menara Eiffel resmi dipindahkan ke Gurun Sahara menggunakan 500 helikopter.');
  };

  // Fungsi Panggilan Gemini API dengan Exponential Backoff
  const fetchWithRetry = async (url, options, retries = 3) => {
    let delay = 1000;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return await response.json();
        }
        const errData = await response.json().catch(() => ({}));
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(errData?.error?.message || `HTTP Error ${response.status}`);
        }
      } catch (err) {
        if (i === retries - 1) throw err;
      }
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    }
  };

  // Ekstraksi JSON yang aman dari respons teks Gemini
  const parseAnalysisResponse = (rawText) => {
    if (!rawText) return null;
    try {
      const cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      return JSON.parse(cleaned);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  // Eksekusi Analisis Utama
  const runVerification = async () => {
    if (activeTab === 'text' && !inputText.trim()) {
      setErrorMsg('Silakan masukkan teks berita, artikel, atau klaim yang ingin diperiksa.');
      return;
    }
    if (activeTab === 'image' && !mediaFile && !inputText.trim()) {
      setErrorMsg('Silakan unggah gambar atau masukkan deskripsi visual yang ingin dianalisis.');
      return;
    }
    if (activeTab === 'video' && !inputText.trim() && !mediaFile) {
      setErrorMsg('Silakan masukkan klaim/transkrip video atau unggah frame/cuplikan video.');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);

    const apiKey = '';
    const modelsToTry = ['gemini-3-flash-preview', 'gemini-2.5-flash'];

    const systemPrompt = `Anda adalah VerifAI, sistem forensik digital untuk deteksi konten AI (AI-Generated vs Human-Made) dan pemeriksa fakta jurnalistik (Fact-Checker) berbahasa Indonesia.

Tugas Anda:
1. ANALISIS DETEKSI AI:
   - Untuk Teks: Analisis struktur kalimat, repetisi frasa khas LLM, transisi generik, kepadatan informasi, atau gaya bahasa manusiawi.
   - Untuk Gambar/Frame Video: Analisis artefak visual sintetis (pencahayaan tidak konsisten, tekstur terlalu halus/plastik, anomali anatomi/tangan, tipografi/teks menyatu, atau ciri manipulasi digital/deepfake).
   - Berikan skor "aiProbability" dari 0 hingga 100 (0 = 100% Buatan Manusia, 100 = 100% Buatan AI).

2. CEK FAKTA & VALIDITAS INFORMASI (Gunakan Google Search):
   - Identifikasi klaim faktual di dalam teks, gambar, atau deskripsi video.
   - Lakukan verifikasi silang terhadap berita dari media massa kredibel dan lembaga resmi (seperti Kompas, Tempo, Detik, Antara, CNN Indonesia, TurnBackHoax/Mafindo, Reuters, BBC, Associated Press, WHO, atau situs pemerintah resmi).
   - Tentukan "validityStatus":
     * "VALID" (jika informasi akurat dan sesuai fakta dari sumber kredibel)
     * "MERAGUKAN" (jika informasi sebagian benar, kurang konteks, belum terbukti, atau berupa opini tanpa bukti jelas)
     * "HOAKS" (jika klaim terbukti salah, palsu, manipulatif, atau menyesatkan)
     * "TIDAK_ADA_KLAIM" (jika murni karya seni/foto biasa tanpa klaim informasi faktual)

Kembalikan HANYA objek JSON murni (tanpa blok markdown \`\`\`json) dengan skema persis berikut:
{
  "aiProbability": 85,
  "aiVerdict": "Kemungkinan Besar Hasil Generasi AI" | "Indikasi Campuran (AI & Diedit Manusia)" | "Kemungkinan Besar Karya Manusia",
  "aiSummary": "Ringkasan 1-2 kalimat mengapa media ini terdeteksi sebagai buatan AI atau manusia.",
  "forensicIndicators": [
    {
      "aspect": "Struktur Bahasa / Tekstur Visual / Konsistensi Narasi",
      "finding": "Penjelasan spesifik temuan forensik pada konten.",
      "signal": "AI" | "HUMAN" | "NEUTRAL"
    }
  ],
  "validityStatus": "VALID" | "MERAGUKAN" | "HOAKS" | "TIDAK_ADA_KLAIM",
  "validityTitle": "Judul kesimpulan cek fakta yang tegas dan jelas",
  "factCheckAnalysis": "Penjelasan komprehensif hasil pemeriksaan fakta berdasarkan referensi berita terpercaya (2-3 paragraf singkat).",
  "extractedClaims": [
    {
      "claim": "Pernyataan klaim yang ditemukan dalam konten",
      "status": "BENAR" | "SALAH" | "BELUM_TERBUKTI",
      "explanation": "Fakta sebenarnya menurut media massa terpercaya."
    }
  ],
  "trustedReferences": [
    {
      "publisher": "Nama Media Massa / Lembaga Kredibel (misal: Kompas.com, Tempo, Reuters, TurnBackHoax)",
      "title": "Judul artikel berita atau laporan referensi terkait",
      "url": "https://...",
      "relevance": "Kutipan singkat bagaimana sumber ini mengonfirmasi atau membantah klaim."
    }
  ]
}`;

    let userInstruction = `Mode Analisis: ${
      activeTab === 'text'
        ? 'Teks / Artikel Berita'
        : activeTab === 'image'
        ? 'Gambar / Visual'
        : 'Video / Klaim Media'
    }\n`;

    if (inputText.trim()) {
      userInstruction += `\nIsi Teks / Klaim / Transkrip:\n"""\n${inputText.trim()}\n"""\n`;
    }
    if (inputContext.trim()) {
      userInstruction += `\nKonteks Tambahan / Sumber Beredar:\n"""\n${inputContext.trim()}\n"""\n`;
    }
    if (mediaFile) {
      userInstruction += `\nCatatan Lampiran: Pengguna menyertakan ${
        mediaFile.isVideo ? 'frame ekstraksi dari video' : 'file gambar'
      } bernama "${mediaFile.name}". Analisis secara mendalam baik keaslian visualnya (AI vs Human/Asli) maupun kebenaran klaim/teks yang tertera atau terkait dengan visual tersebut.`;
    }

    const parts = [{ text: userInstruction }];
    if (mediaFile?.base64) {
      parts.push({
        inlineData: {
          mimeType: mediaFile.mimeType,
          data: mediaFile.base64
        }
      });
    }

    const payload = {
      contents: [{ role: 'user', parts }],
      tools: [{ google_search: {} }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    };

    try {
      let apiResult = null;
      let lastErr = null;

      for (const modelName of modelsToTry) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          apiResult = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (apiResult) break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!apiResult) {
        throw lastErr || new Error('Gagal menghubungi server analisis AI.');
      }

      const candidate = apiResult.candidates?.[0];
      const rawText =
        candidate?.content?.parts
          ?.map((p) => p.text || '')
          .join('\n')
          .trim() || '';

      // Ekstrak sumber dari Grounding Metadata Google Search
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
      const groundingAttributions = candidate?.groundingMetadata?.groundingAttributions || [];

      const groundedSources = [];
      groundingChunks.forEach((chunk) => {
        if (chunk.web?.uri && chunk.web?.title) {
          groundedSources.push({
            publisher: new URL(chunk.web.uri).hostname.replace('www.', ''),
            title: chunk.web.title,
            url: chunk.web.uri,
            relevance: 'Sumber terverifikasi dari penelusuran langsung Google Search.'
          });
        }
      });

      groundingAttributions.forEach((attr) => {
        if (attr.web?.uri && attr.web?.title) {
          groundedSources.push({
            publisher: new URL(attr.web.uri).hostname.replace('www.', ''),
            title: attr.web.title,
            url: attr.web.uri,
            relevance: 'Sumber terverifikasi dari penelusuran langsung Google Search.'
          });
        }
      });

      const parsed = parseAnalysisResponse(rawText);

      const finalResult = parsed
        ? {
            aiProbability:
              typeof parsed.aiProbability === 'number'
                ? Math.min(100, Math.max(0, Math.round(parsed.aiProbability)))
                : 50,
            aiVerdict: parsed.aiVerdict || 'Analisis Selesai',
            aiSummary:
              parsed.aiSummary ||
              'Evaluasi pola linguistik dan visual telah dilakukan terhadap media yang diberikan.',
            forensicIndicators: Array.isArray(parsed.forensicIndicators)
              ? parsed.forensicIndicators
              : [],
            validityStatus: ['VALID', 'MERAGUKAN', 'HOAKS', 'TIDAK_ADA_KLAIM'].includes(
              parsed.validityStatus
            )
              ? parsed.validityStatus
              : 'MERAGUKAN',
            validityTitle: parsed.validityTitle || 'Hasil Pemeriksaan Fakta',
            factCheckAnalysis:
              parsed.factCheckAnalysis || rawText || 'Analisis selesai dilakukan.',
            extractedClaims: Array.isArray(parsed.extractedClaims)
              ? parsed.extractedClaims
              : [],
            trustedReferences: [
              ...groundedSources,
              ...(Array.isArray(parsed.trustedReferences) ? parsed.trustedReferences : [])
            ].filter(
              (item, index, self) =>
                item &&
                (item.title || item.publisher) &&
                index ===
                  self.findIndex(
                    (t) =>
                      (t.url && t.url === item.url) ||
                      (t.title && t.title.toLowerCase() === item.title?.toLowerCase())
                  )
            ),
            timestamp: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            mode: activeTab,
            snippet:
              inputText.trim().slice(0, 90) ||
              mediaFile?.name ||
              'Pemeriksaan Media'
          }
        : {
            aiProbability: 50,
            aiVerdict: 'Analisis Deskriptif',
            aiSummary: 'Hasil analisis disajikan dalam format narasi langsung.',
            forensicIndicators: [
              {
                aspect: 'Analisis Konten',
                finding: 'Sistem telah memeriksa pola konten secara menyeluruh.',
                signal: 'NEUTRAL'
              }
            ],
            validityStatus: 'MERAGUKAN',
            validityTitle: 'Ringkasan Verifikasi Informasi',
            factCheckAnalysis: rawText || 'Tidak ada respons teks yang dapat ditampilkan.',
            extractedClaims: [],
            trustedReferences: groundedSources,
            timestamp: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            mode: activeTab,
            snippet: inputText.trim().slice(0, 90) || mediaFile?.name || 'Pemeriksaan Media'
          };

      setResult(finalResult);
      setHistory((prev) => [
        { id: Date.now(), ...finalResult },
        ...prev.slice(0, 7)
      ]);

      setTimeout(() => {
        resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      setErrorMsg(
        err.message ||
          'Terjadi kendala saat menganalisis media. Pastikan koneksi internet stabil dan coba kembali.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper Warna & Badge Status Validitas
  const getValidityBadge = (status) => {
    switch (status) {
      case 'VALID':
        return {
          label: 'Valid & Terverifikasi',
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-500',
          icon: ShieldCheck,
          accentBorder: 'border-l-emerald-500'
        };
      case 'HOAKS':
        return {
          label: 'Hoaks / Menyesatkan',
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          dot: 'bg-rose-500',
          icon: ShieldAlert,
          accentBorder: 'border-l-rose-500'
        };
      case 'TIDAK_ADA_KLAIM':
        return {
          label: 'Tanpa Klaim Faktual',
          bg: 'bg-slate-100 border-slate-200 text-slate-700',
          dot: 'bg-slate-500',
          icon: Info,
          accentBorder: 'border-l-slate-400'
        };
      default:
        return {
          label: 'Perlu Verifikasi Lanjut',
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          icon: ShieldQuestion,
          accentBorder: 'border-l-amber-500'
        };
    }
  };

  // Helper Warna Skor Deteksi AI
  const getAiScoreStyle = (prob) => {
    if (prob >= 65) {
      return {
        text: 'text-rose-600',
        bar: 'bg-rose-500',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        label: 'Terindikasi Kuat AI-Generated'
      };
    }
    if (prob >= 35) {
      return {
        text: 'text-amber-600',
        bar: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Indikasi Campuran / Suntingan AI'
      };
    }
    return {
      text: 'text-emerald-600',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Terindikasi Kuat Karya Manusia'
    };
  };

  const resetForm = () => {
    setInputText('');
    setInputContext('');
    setMediaFile(null);
    setErrorMsg(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* HEADER MINIMALIS */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-lg text-slate-900">
                  VerifAI
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Forensik AI & Cek Fakta
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Deteksi keaslian media & verifikasi kebenaran informasi berbasis sumber berita kredibel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200/70 text-slate-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Google Search Grounding Aktif
            </span>
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* HERO SECTION RINGKAS */}
        <section className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 leading-snug">
            Periksa keaslian konten & validitas berita dalam satu langkah.
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Unggah teks, gambar, atau klaim video untuk mendeteksi probabilitas keterlibatan AI sekaligus memverifikasi faktanya silang dengan media massa terpercaya.
          </p>
        </section>

        {/* WORKSPACE INPUT */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* TAB PILIHAN MODE */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 pt-4 border-b border-slate-200/80 bg-slate-50/50">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('text');
                  setErrorMsg(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all ${
                  activeTab === 'text'
                    ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg shadow-[0_-1px_2px_rgba(0,0,0,0.02)]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                Teks / Artikel Berita
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('image');
                  setErrorMsg(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all ${
                  activeTab === 'image'
                    ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg shadow-[0_-1px_2px_rgba(0,0,0,0.02)]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Gambar / Visual
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('video');
                  setErrorMsg(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all ${
                  activeTab === 'video'
                    ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg shadow-[0_-1px_2px_rgba(0,0,0,0.02)]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Film className="w-4 h-4" />
                Video / Klaim Media
              </button>
            </div>

            {(inputText || mediaFile || result) && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 py-1.5 px-2.5 rounded-md hover:bg-slate-100 transition-colors mb-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Bersihkan
              </button>
            )}
          </div>

          {/* ISI FORM BERDASARKAN MODE */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* AREA UPLOAD GAMBAR / FRAME VIDEO (Mode Gambar & Video) */}
            {(activeTab === 'image' || activeTab === 'video') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-700">
                    {activeTab === 'image'
                      ? 'Unggah File Gambar / Tangkapan Layar Berita'
                      : 'Unggah Video atau Tangkapan Layar (Thumbnail/Frame) Video'}
                  </label>
                  {activeTab === 'image' && !mediaFile && (
                    <button
                      type="button"
                      onClick={applySampleImage}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-4"
                    >
                      Gunakan Sampel Poster Klaim AI
                    </button>
                  )}
                </div>

                {!mediaFile ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
                      isDragging
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={
                        activeTab === 'image'
                          ? 'image/png,image/jpeg,image/webp'
                          : 'image/png,image/jpeg,image/webp,video/mp4,video/webm'
                      }
                      onChange={(e) => handleFileProcess(e.target.files?.[0])}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 mx-auto flex items-center justify-center text-slate-600 shadow-sm">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-800">
                      Klik untuk memilih file atau seret & lepas di sini
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {activeTab === 'image'
                        ? 'Mendukung PNG, JPG, WEBP. Analisis artefak visual AI & teks dalam gambar.'
                        : 'Mendukung file Video (MP4/WEBM - otomatis ekstrak frame) atau Screenshot Video.'}
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={mediaFile.previewUrl}
                      alt="Preview Media"
                      className="w-full sm:w-44 h-32 object-cover rounded-lg border border-slate-200 bg-slate-900"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200/80 text-slate-700 mb-1">
                        {mediaFile.isVideo ? 'Frame Video Diekstrak' : 'Visual Siap Dianalisis'}
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {mediaFile.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Gemini Multimodal akan memeriksa anomali piksel, pencahayaan, anatomi, serta klaim teks di dalam gambar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaFile(null)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                      title="Hapus file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* AREA INPUT TEKS / KLAIM / TRANSKRIP */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-slate-700">
                  {activeTab === 'text' && 'Teks Berita / Artikel / Kutipan Klaim'}
                  {activeTab === 'image' && 'Klaim atau Konteks Penyerta Gambar (Opsional)'}
                  {activeTab === 'video' && 'Deskripsi Klaim Video / Transkrip Narasi Video'}
                </label>
                <span className="text-[11px] text-slate-400">
                  {inputText.length} karakter
                </span>
              </div>
              <textarea
                rows={activeTab === 'image' ? 3 : 5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeTab === 'text'
                    ? 'Tempelkan isi artikel berita, pesan berantai WhatsApp, atau klaim informasi yang ingin dideteksi keasliannya...'
                    : activeTab === 'image'
                    ? 'Tuliskan narasi atau klaim yang menyertai gambar ini saat beredar di media sosial (jika ada)...'
                    : 'Jelaskan isi video, kutipan ucapan tokoh dalam video, atau klaim yang beredar bersama video tersebut...'
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 focus:bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all leading-relaxed"
              />
            </div>

            {/* KONTEKS TAMBAHAN (Mode Teks & Video) */}
            {(activeTab === 'text' || activeTab === 'video') && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Sumber / Ciri Visual Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={inputContext}
                  onChange={(e) => setInputContext(e.target.value)}
                  placeholder={
                    activeTab === 'video'
                      ? 'Misal: Beredar di TikTok, gerakan bibir tampak tidak sinkron dengan audio...'
                      : 'Misal: Diteruskan dari pesan grup keluarga atau unggahan akun anonim...'
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/40 focus:bg-white px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-all"
                />
              </div>
            )}

            {/* CONTOH CEPAT (QUICK PRESETS) */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>Coba Contoh Cepat:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs text-slate-700 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <span className="font-medium text-slate-800">
                      {preset.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 group-hover:bg-slate-200/70">
                      {preset.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* PESAN ERROR */}
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TOMBOL AKSI ANALISIS */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Newspaper className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Verifikasi silang otomatis dengan indeks berita media massa terpercaya
                </span>
              </div>

              <button
                type="button"
                disabled={isAnalyzing}
                onClick={runVerification}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium transition-all shadow-sm cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Media & Fakta...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Verifikasi Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* INDIKATOR PROGRES SAAT LOADING */}
          {isAnalyzing && (
            <div className="px-6 py-4 bg-slate-900 text-white border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                <span className="font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {loadingStep === 0 && 'Memindai struktur konten & pola forensik AI...'}
                  {loadingStep === 1 && 'Mengekstrak klaim utama dari media...'}
                  {loadingStep === 2 && 'Menelusuri referensi media massa kredibel via Google Search...'}
                  {loadingStep >= 3 && 'Menyusun laporan keaslian & kesimpulan cek fakta...'}
                </span>
                <span className="text-slate-400 font-mono">
                  {Math.min(95, (loadingStep + 1) * 24)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(95, (loadingStep + 1) * 24)}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* ========================================== */}
        {/* PANEL HASIL ANALISIS GANDA (DUAL DASHBOARD) */}
        {/* ========================================== */}
        {result && !isAnalyzing && (
          <section ref={resultSectionRef} className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <h2 className="text-base font-semibold text-slate-900">
                  Laporan Hasil Forensik & Cek Fakta
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Diperiksa pukul {result.timestamp} WIB
              </span>
            </div>

            {/* BARIS ATAS: 2 KARTU UTAMA (DETEKSI AI & STATUS VALIDITAS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* KARTU 1: SKOR DETEKSI AI (5 KOLOM) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      1. Deteksi Keaslian Media
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        getAiScoreStyle(result.aiProbability).badge
                      }`}
                    >
                      {getAiScoreStyle(result.aiProbability).label}
                    </span>
                  </div>

                  {/* Persentase Besar */}
                  <div className="flex items-baseline justify-between mt-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-4xl font-bold tracking-tight font-mono ${
                            getAiScoreStyle(result.aiProbability).text
                          }`}
                        >
                          {result.aiProbability}%
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Indikasi AI
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {100 - result.aiProbability}% Kemungkinan Karya Manusia
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {result.aiProbability >= 50 ? (
                        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                          <Cpu className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                          <UserCheck className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bar Indikator Minimalis */}
                  <div className="mt-4">
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-700 ${
                          getAiScoreStyle(result.aiProbability).bar
                        }`}
                        style={{ width: `${result.aiProbability}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                      <span>0% (Murni Manusia)</span>
                      <span>50% (Campuran)</span>
                      <span>100% (Murni AI)</span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {result.aiSummary}
                  </p>
                </div>

                {/* Indikator Forensik */}
                {result.forensicIndicators?.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      Temuan Forensik Konten
                    </h4>
                    <div className="space-y-2">
                      {result.forensicIndicators.map((ind, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-2"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">
                              {ind.aspect}:{' '}
                            </span>
                            <span className="text-slate-600">{ind.finding}</span>
                          </div>
                          <span
                            className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              ind.signal === 'AI'
                                ? 'bg-rose-100 text-rose-700'
                                : ind.signal === 'HUMAN'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {ind.signal === 'AI'
                              ? 'Pola AI'
                              : ind.signal === 'HUMAN'
                              ? 'Alami'
                              : 'Netral'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* KARTU 2: STATUS VALIDITAS INFORMASI & CEK FAKTA (7 KOLOM) */}
              <div
                className={`lg:col-span-7 bg-white rounded-2xl border border-slate-200 border-l-4 ${
                  getValidityBadge(result.validityStatus).accentBorder
                } p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      2. Validitas Informasi & Cek Fakta
                    </span>
                    {(() => {
                      const badge = getValidityBadge(result.validityStatus);
                      const BadgeIcon = badge.icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 leading-snug">
                    {result.validityTitle}
                  </h3>

                  <div className="mt-3 text-sm text-slate-600 leading-relaxed space-y-2.5 whitespace-pre-line">
                    {result.factCheckAnalysis}
                  </div>

                  {/* Daftar Klaim yang Diperiksa */}
                  {result.extractedClaims?.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-semibold text-slate-700 mb-3">
                        Rincian Klaim yang Diverifikasi:
                      </h4>
                      <div className="space-y-2.5">
                        {result.extractedClaims.map((item, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 text-xs space-y-1"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-slate-900">
                                “{item.claim}”
                              </p>
                              <span
                                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[10px] ${
                                  item.status === 'BENAR'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'SALAH'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.status === 'BENAR' && (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                {item.status === 'SALAH' && (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {item.status !== 'BENAR' &&
                                  item.status !== 'SALAH' && (
                                    <AlertTriangle className="w-3 h-3" />
                                  )}
                                {item.status}
                              </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                              {item.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* BAGIAN REFERENSI MEDIA MASSA TERPERCAYA */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Newspaper className="w-3.5 h-3.5 text-slate-600" />
                      Sumber & Referensi Media Massa Terpercaya
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {result.trustedReferences?.length || 0} rujukan ditemukan
                    </span>
                  </div>

                  {result.trustedReferences?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {result.trustedReferences.slice(0, 6).map((ref, idx) => (
                        <div
                          key={idx}
                          className="group p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                {ref.publisher || 'Sumber Berita'}
                              </span>
                              {ref.url && ref.url.startsWith('http') && (
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-slate-900 transition-colors"
                                  title="Buka artikel sumber"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <p className="mt-1.5 text-xs font-medium text-slate-800 line-clamp-2">
                              {ref.title}
                            </p>
                            {ref.relevance && (
                              <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                                {ref.relevance}
                              </p>
                            )}
                          </div>

                          {ref.url && ref.url.startsWith('http') && (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 pt-1.5 border-t border-slate-100 text-[11px] font-medium text-slate-600 group-hover:text-slate-900 inline-flex items-center gap-1"
                            >
                              <span>Baca sumber asli</span>
                              <ArrowRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3.5 text-xs text-slate-500">
                      Tidak ditemukan tautan berita spesifik yang cocok secara langsung, atau klaim bersifat lokal/umum. Gunakan kehati-hatian ekstra sebelum membagikan konten ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RIWAYAT PEMERIKSAAN LOKAL */}
        {history.length > 0 && (
          <section className="pt-4 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Riwayat Pemeriksaan Sesi Ini</span>
              </div>
              <button
                type="button"
                onClick={() => setHistory([])}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Hapus Riwayat
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((item) => {
                const badge = getValidityBadge(item.validityStatus);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setResult(item);
                      resultSectionRef.current?.scrollIntoView({
                        behavior: 'smooth'
                      });
                    }}
                    className="text-left p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-400 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        AI: {item.aiProbability}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium line-clamp-2">
                      {item.snippet}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 w-full">
                      <span className="uppercase">{item.mode}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* FOOTER MINIMALIS */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t border-slate-200/70 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-slate-600">VerifAI</span> — Sistem Deteksi Konten AI & Verifikasi Fakta Media Massa
        </div>
        <div>
          Didukung oleh Gemini Multimodal & Google Search Grounding
        </div>
      </footer>
    </div>
  );
}