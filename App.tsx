import React, { useState, useRef, useEffect } from 'react';
import { generateWallpapers } from './services/geminiService';
import { GeneratedImage, AppStatus } from './types';
import { SparklesIcon, DownloadIcon, RemixIcon, CloseIcon, XCircleIcon } from './components/Icons';

export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [referenceImage, setReferenceImage] = useState<GeneratedImage | null>(null); // For Remix
  
  // Ref for auto-scrolling to results
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStatus(AppStatus.GENERATING);
    try {
      const generated = await generateWallpapers(prompt, referenceImage?.base64);
      setImages(generated);
      setStatus(AppStatus.SUCCESS);
      // Clean up remix state after generation
      setReferenceImage(null);
      setPrompt(''); 
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleRemix = (image: GeneratedImage) => {
    setReferenceImage(image);
    setSelectedImage(null);
    setPrompt(''); // Allow user to type new instructions
    // Scroll to top to show input
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.base64;
    link.download = `moodpaper-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearReference = () => {
    setReferenceImage(null);
  };

  // Scroll to results on success
  useEffect(() => {
    if (status === AppStatus.SUCCESS && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex justify-center">
      {/* Mobile container constraint */}
      <div className="w-full max-w-md bg-black min-h-screen relative flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <header className="px-6 py-6 pt-10 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent sticky top-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.5)]">
               <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              MoodPaper
            </h1>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 pb-24 overflow-y-auto no-scrollbar">
          
          {/* Input Section */}
          <div className="mt-4 mb-8">
            <h2 className="text-2xl font-semibold mb-2 leading-tight">
              어떤 분위기를 <br />
              <span className="text-neutral-400">만들고 싶으신가요?</span>
            </h2>
            
            <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 shadow-lg focus-within:border-purple-500 transition-colors">
              {/* Reference Image Badge (Remix Mode) */}
              {referenceImage && (
                <div className="mb-3 flex items-center gap-2 bg-neutral-800 p-2 rounded-lg w-max border border-neutral-700 animate-fade-in">
                  <img src={referenceImage.base64} alt="Ref" className="w-8 h-12 object-cover rounded bg-neutral-700" />
                  <span className="text-xs text-neutral-300">이 이미지를 Remix</span>
                  <button onClick={clearReference} className="text-neutral-400 hover:text-white">
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              <textarea
                className="w-full bg-transparent text-lg placeholder-neutral-600 outline-none resize-none h-24"
                placeholder={referenceImage ? "어떻게 변경할까요? (예: 더 어둡게, 비 내리는 효과 추가)" : "예: 비 오는 서정적인 도시 풍경, 파스텔 톤 구름"}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || status === AppStatus.GENERATING}
              className={`mt-4 w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                !prompt.trim() || status === AppStatus.GENERATING
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
              }`}
            >
              {status === AppStatus.GENERATING ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  생성 중...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 text-purple-600" />
                  {referenceImage ? 'Remix 하기' : '생성하기'}
                </>
              )}
            </button>
          </div>

          {/* Results Grid */}
          {status === AppStatus.ERROR && (
             <div className="text-center p-4 bg-red-900/20 text-red-300 rounded-xl mb-6">
                오류가 발생했습니다. 잠시 후 다시 시도해주세요.
             </div>
          )}

          {images.length > 0 && (
            <div ref={resultsRef} className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">결과물</h3>
                <span className="text-xs text-neutral-500 bg-neutral-900 px-2 py-1 rounded-full border border-neutral-800">9:16 Ratio</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {images.map((img) => (
                  <div 
                    key={img.id} 
                    onClick={() => setSelectedImage(img)}
                    className="aspect-[9/16] relative group cursor-pointer overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
                  >
                    <img 
                      src={img.base64} 
                      alt="Generated wallpaper" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Full Screen Overlay Modal */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center relative w-full h-full">
               <img 
                src={selectedImage.base64} 
                alt="Full screen" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black via-black/80 to-transparent flex gap-4 justify-center items-end">
              <button 
                onClick={() => handleRemix(selectedImage)}
                className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-600 backdrop-blur-sm">
                   <RemixIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">Remix</span>
              </button>

              <button 
                onClick={() => handleDownload(selectedImage)}
                className="flex flex-col items-center gap-1 text-white group"
              >
                <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] group-active:scale-95 transition-transform">
                   <DownloadIcon className="w-8 h-8" />
                </div>
                <span className="text-xs font-medium">다운로드</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Style for fade animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}