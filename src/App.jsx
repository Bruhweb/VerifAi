import { useState, useRef } from 'react';
import { 
  ShieldCheck, UploadCloud, Loader2, AlertTriangle, 
  CheckCircle2, XCircle, Info, Sparkles, Image as ImageIcon, 
  FileText, Trash2, Copy, Check, RefreshCw, Cpu
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('semua'); // 'teks' | 'gambar' | 'semua'
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [modelUsed, setModelUsed] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  // Contoh kasus cepat untuk memudahkan pengguna awam mencoba aplikasi
  const sampleCases = [
    {
      title: "Klaim Hoaks Kesehatan",
      text: "URGENT!! Diteruskan dari grup sebelah: Minum air rebusan daun pepaya dicampur garam murni diklaim oleh WHO mampu menyembuhkan segala jenis virus dalam waktu 3 jam tanpa perlu ke rumah sakit. Sebarkan ke keluarga Anda!"
    },
    {
      title: "Cek Validitas Berita Ekonomi",
      text: "Pemerintah dikabarkan akan menarik seluruh uang kertas pecahan Rp 100.000 mulai minggu depan dan menggantinya secara penuh dengan mata uang kripto nasional. Masyarakat diminta segera mengosongkan rekening bank."
    },
    {
      title: "Deteksi Ciri Gambar / Data",
      text: "Apakah data grafik, teks, dan elemen visual di dalam gambar ini valid atau merupakan hasil rekayasa AI / manipulasi editan?"
    }
  ];

  // Fungsi kompresi & konversi gambar otomatis agar cepat dikirim ke server
  const processImage = (selectedFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
          canvas.width = img.width * scaleSize;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Kompresi ke JPEG kualitas 85% agar ringan dan bebas error payload
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({
            base64: dataUrl.split(',')[1],
            mimeType: 'image/jpeg',
            previewUrl: dataUrl
          });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setErrorMsg('');
    try {
      const processed = await processImage(selected);
      setFile({
        name: selected.name,
        base64: processed.base64,
        mimeType: processed.mimeType
      });
      setImagePreview(processed.previewUrl);
    } catch (err) {
      setErrorMsg('Gagal memuat gambar. Pastikan format file berupa PNG atau JPG.');
    }
  };

  const clearImage = () => {
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    setTextInput('');
    clearImage();
    setAnalysis(null);
    setErrorMsg('');
  };

  const handleCopyResult = () => {
    if (!analysis) return;
    const summaryText = `[Hasil VerifAI]\nStatus: ${analysis.verdict}\nSkor Kepercayaan: ${analysis.credibilityScore}%\nIndikasi AI: ${analysis.aiProbability}%\n\nKesimpulan: ${analysis.summary}\n\nRekomendasi: ${analysis.recommendation}`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!textInput.trim() && !file) {
      setErrorMsg('Silakan masukkan teks berita/klaim atau unggah sebuah gambar terlebih dahulu.');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setErrorMsg('');

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textInput.trim(),
          imageBase64: file ? file.base64 : null,
          mimeType: file ? file.mimeType : null,
          mode: file && textInput ? 'Multimodal (Gambar & Teks)' : file ? 'Forensik Visual Gambar' : 'Verifikasi Fakta & Teks AI'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Terjadi kesalahan pada server saat memproses permintaan.');
      }

      setAnalysis(data.result);
      setModelUsed(data.modelUsed);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Penentu warna badge berdasarkan hasil putusan AI
  const getVerdictStyle = (verdict = '') => {
    const v = verdict.toUpperCase();
    if (v.includes('ASLI') || v.includes('FAKTA') || v.includes('VALID')) {
      return {
        bg: 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
      };
    }
    if (v.includes('HOAKS') || v.includes('MANIPULASI') || v.includes('PALSU')) {
      return {
        bg: 'bg-red-950/60 border-red-700/60 text-red-200',
        badge: 'bg-red-500/20 text-red-300 border-red-500/40',
        icon: <XCircle className="w-7 h-7 text-red-400 shrink-0" />
      };
    }
    return {
      bg: 'bg-amber-950/60 border-amber-700/60 text-amber-200',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0" />
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">VerifAI</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Forensik AI & Cek Fakta
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Deteksi keaslian media & verifikasi kebenaran informasi otomatis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Mesin Multi-API Aktif
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Hero Title */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Periksa keaslian konten & validitas berita dalam satu langkah.
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Unggah tangkapan layar, foto, atau tempelkan pesan berantai untuk mendeteksi probabilitas keterlibatan AI sekaligus menguji kebenaran klaimnya.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Mode Filter Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('semua')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === 'semua' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Semua Mode
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teks')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === 'teks' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Teks / Berita
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gambar')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === 'gambar' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Gambar / Visual
            </button>
          </div>

          {/* Image Upload Zone */}
          {(activeTab === 'semua' || activeTab === 'gambar') && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Unggah Gambar / Tangkapan Layar (Opsional)
              </label>

              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-800 border-dashed rounded-xl cursor-pointer bg-slate-950/50 hover:bg-slate-800/40 hover:border-blue-500/50 transition group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <UploadCloud className="w-9 h-9 text-slate-400 group-hover:text-blue-400 mb-2 transition" />
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-blue-400">Klik untuk memilih gambar</span> atau seret file ke sini
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Mendukung JPG, PNG, WEBP (Otomatis dioptimalkan)</p>
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between gap-4 p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={imagePreview} 
                      alt="Pratinjau" 
                      className="w-16 h-16 object-cover rounded-lg border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                        Visual Siap Dianalisis
                      </span>
                      <p className="text-sm font-medium text-slate-200 truncate">{file?.name}</p>
                      <p className="text-xs text-slate-400">AI akan memeriksa anomali piksel, konteks, dan klaim teks di dalam gambar.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition shrink-0"
                    title="Hapus Gambar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Text Input Zone */}
          {(activeTab === 'semua' || activeTab === 'teks' || imagePreview) && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {imagePreview ? 'Pertanyaan / Konteks Tambahan Gambar' : 'Teks Berita / Klaim Informasi'}
                </label>
                <span className="text-xs text-slate-500">{textInput.length} karakter</span>
              </div>
              <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/80 text-sm leading-relaxed resize-y"
                rows="4"
                placeholder={
                  imagePreview 
                    ? "Contoh: Apakah data grafik di gambar ini valid? Apakah foto ini buatan AI?" 
                    : "Tempelkan isi artikel berita, pesan berantai WhatsApp, atau klaim yang ingin diperiksa..."
                }
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>
          )}

          {/* Quick Sample Buttons */}
          <div className="space-y-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Coba Contoh Cepat (1-Klik):
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleCases.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTextInput(sample.text)}
                  className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg transition"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Menganalisis Konten...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Verifikasi Sekarang</span>
                </>
              )}
            </button>

            {(textInput || file || analysis) && (
              <button
                type="button"
                onClick={handleReset}
                className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
                title="Bersihkan Formulir"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Notification Box */}
        {errorMsg && (
          <div className="bg-red-950/60 border border-red-800/80 text-red-200 p-4 rounded-xl flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-semibold text-red-300">Perhatian Sistem:</p>
              <p className="leading-relaxed break-words">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Structured Forensic Result Dashboard */}
        {analysis && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6 animate-fade-in">
            {/* Top Verdict Banner */}
            {(() => {
              const style = getVerdictStyle(analysis.verdict);
              return (
                <div className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${style.bg}`}>
                  <div className="flex items-start sm:items-center gap-3.5">
                    {style.icon}
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold opacity-75 block">
                        Putusan Forensik VerifAI
                      </span>
                      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                        {analysis.verdict}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${style.badge}`}>
                      Tingkat Risiko: {analysis.riskLevel || 'Sedang'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Visual Meter Bars (Awam-Friendly) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Probabilitas AI */}
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-400">Indikasi Buatan / Rekayasa AI</span>
                  <span className="text-sm font-bold text-amber-400">{analysis.aiProbability ?? 0}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(analysis.aiProbability || 0, 5), 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Semakin tinggi persentase, semakin besar kemungkinan dibuat oleh mesin AI.
                </p>
              </div>

              {/* Skor Kepercayaan Fakta */}
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-400">Tingkat Kredibilitas & Validitas Data</span>
                  <span className="text-sm font-bold text-emerald-400">{analysis.credibilityScore ?? 0}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(analysis.credibilityScore || 0, 5), 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Mengukur seberapa akurat klaim/data dibandingkan dengan fakta umum.
                </p>
              </div>
            </div>

            {/* Ringkasan Utama */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Ringkasan Eksekutif
              </h3>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
                {analysis.summary}
              </p>
            </div>

            {/* Temuan Kunci (Bullet Points) */}
            {analysis.keyFindings && analysis.keyFindings.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Detail Temuan Forensik & Fakta
                </h3>
                <ul className="space-y-2">
                  {analysis.keyFindings.map((item, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                      <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed whitespace-pre-wrap">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rekomendasi */}
            {analysis.recommendation && (
              <div className="bg-blue-950/30 border border-blue-800/40 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                  <span className="font-semibold text-blue-300 block">Saran & Tindakan:</span>
                  <p className="text-slate-300 leading-relaxed">{analysis.recommendation}</p>
                </div>
              </div>
            )}

            {/* Footer Hasil (Engine Info & Tombol Salin) */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-slate-400" />
                <span>Dianalisis dengan engine: <strong className="text-slate-300">{modelUsed}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleCopyResult}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Laporan Disalin!' : 'Salin Hasil'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        VerifAI — Sistem Deteksi Konten AI & Verifikasi Fakta Media • Didukung Arsitektur Multi-Model Gemini API
      </footer>
    </div>
  );
}