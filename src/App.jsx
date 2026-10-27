import { useState } from 'react';
import { ShieldCheck, UploadCloud, Loader2 } from 'lucide-react';

export default function App() {
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fungsi pengubah file gambar menjadi format Base64 untuk dikirim ke backend
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleVerify = async () => {
    if (!textInput && !file) {
      setErrorMsg('Masukkan teks berita atau unggah gambar terlebih dahulu.');
      return;
    }

    setLoading(true);
    setResult('');
    setErrorMsg('');

    try {
      let imageBase64 = null;
      let mimeType = null;

      if (file) {
        imageBase64 = await fileToBase64(file);
        mimeType = file.type;
      }

      // Mengirim data ke Vercel Serverless Function (/api/verify)
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textInput || 'Tolong analisis apakah gambar ini terindikasi buatan AI, manipulasi editan, atau asli.',
          imageBase64,
          mimeType
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setResult(data.data);
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memverifikasi data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-2 text-blue-500">
            <ShieldCheck size={32} />
            <h1 className="text-2xl font-bold">VerifAI</h1>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Periksa keaslian konten & validitas berita.
          </h2>
          <p className="text-gray-400">
            Unggah teks atau gambar untuk mendeteksi probabilitas keterlibatan AI dan verifikasi fakta otomatis.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
          <textarea
            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="4"
            placeholder="Tempelkan isi artikel, klaim WhatsApp, atau konteks gambar di sini..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-800 border-dashed rounded-xl cursor-pointer hover:bg-gray-800/50 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-blue-400">Klik untuk unggah gambar</span> atau seret ke sini
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files[0])} 
              />
            </label>
          </div>
          
          {file && (
            <p className="text-sm text-emerald-400 text-center">
              File siap dianalisis: {file.name}
            </p>
          )}

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
            {loading ? 'Memverifikasi...' : 'Verifikasi Sekarang'}
          </button>
        </div>

        {/* Error / Result Section */}
        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {result && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-semibold text-blue-400 border-b border-gray-800 pb-3">Hasil Analisis VerifAI</h3>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}