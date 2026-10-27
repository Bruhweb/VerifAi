import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metode tidak diizinkan' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'GEMINI_API_KEY belum terbaca di Vercel. Pastikan sudah disimpan di Environment Variables dan di-Redeploy.' 
      });
    }

    const { prompt, imageBase64, mimeType } = req.body;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Daftar model aktif terbaru (otomatis mencoba satu per satu jika ada yang 404)
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let responseText = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        let result;

        if (imageBase64) {
          const imageParts = [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType || 'image/png'
              }
            }
          ];
          result = await model.generateContent([prompt, ...imageParts]);
        } else {
          result = await model.generateContent(prompt);
        }

        responseText = result.response.text();
        break; // Berhasil! Hentikan pencarian model
      } catch (err) {
        console.warn(`Gagal memanggil ${modelName}:`, err.message);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError;
    }

    res.status(200).json({ success: true, data: responseText });

  } catch (error) {
    console.error('Error dari API Gemini:', error);
    // Menampilkan alasan error asli langsung ke layar web agar jelas
    res.status(500).json({ 
      success: false, 
      error: `Detail Error API: ${error.message}` 
    });
  }
}