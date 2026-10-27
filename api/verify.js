import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metode tidak diizinkan' });
  }

  try {
    const { prompt, imageBase64, mimeType } = req.body;
    
    // Panggil API Key dari Environment Variable Vercel (Mode Secret)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let result;
    
    // Logika jika pengguna mengunggah gambar
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
      // Logika jika pengguna hanya memasukkan teks
      result = await model.generateContent(prompt);
    }

    const responseText = result.response.text();
    
    // Kembalikan hasil ke frontend React
    res.status(200).json({ success: true, data: responseText });
    
  } catch (error) {
    console.error('Error dari API Gemini:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server VerifAI sedang sibuk atau mencapai batas kuota harian. Silakan coba beberapa saat lagi.' 
    });
  }
}