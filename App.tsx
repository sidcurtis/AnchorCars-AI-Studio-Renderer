import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { CarIcon, StudioIcon, SparklesIcon, AlertTriangleIcon, DownloadIcon, ClockIcon } from './components/Icons';
import { redrawCarImage } from './services/geminiService';
import { SYSTEM_PROMPT } from './constants';
import type { ImageFile } from './types';

const DEFAULT_BG_KEY = 'anchorCarsDefaultStudioBackground';
const DEFAULT_LOGO_KEY = 'anchorCarsDefaultLogo';

const App: React.FC = () => {
  const [carImage, setCarImage] = useState<ImageFile | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<ImageFile | null>(null);
  const [defaultBackgroundImage, setDefaultBackgroundImage] = useState<ImageFile | null>(null);
  const [logo, setLogo] = useState<ImageFile | null>(null);
  const [defaultLogo, setDefaultLogo] = useState<ImageFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  useEffect(() => {
    // Load default background
    try {
      const savedBackground = localStorage.getItem(DEFAULT_BG_KEY);
      if (savedBackground) {
        const parsed: Pick<ImageFile, 'dataUrl' | 'mimeType'> = JSON.parse(savedBackground);
        const imageFile: ImageFile = {
          dataUrl: parsed.dataUrl,
          mimeType: parsed.mimeType,
          base64: parsed.dataUrl.split(',')[1],
          name: "default-background"
        };
        setBackgroundImage(imageFile);
        setDefaultBackgroundImage(imageFile);
      }
    } catch (e) {
      console.error("Failed to load default background from localStorage", e);
      localStorage.removeItem(DEFAULT_BG_KEY);
    }
    
    // Load default logo
    try {
      const savedLogo = localStorage.getItem(DEFAULT_LOGO_KEY);
      if (savedLogo) {
        const parsed: Pick<ImageFile, 'dataUrl' | 'mimeType'> = JSON.parse(savedLogo);
        const imageFile: ImageFile = {
          dataUrl: parsed.dataUrl,
          mimeType: parsed.mimeType,
          base64: parsed.dataUrl.split(',')[1],
          name: "default-logo"
        };
        setLogo(imageFile);
        setDefaultLogo(imageFile);
      }
    } catch (e) {
      console.error("Failed to load default logo from localStorage", e);
      localStorage.removeItem(DEFAULT_LOGO_KEY);
    }

  }, []);

  const handleSetDefaultBackground = useCallback((image: ImageFile) => {
    try {
      const storable = { dataUrl: image.dataUrl, mimeType: image.mimeType };
      localStorage.setItem(DEFAULT_BG_KEY, JSON.stringify(storable));
      setDefaultBackgroundImage(image);
    } catch (e) {
      console.error("Failed to save default background to localStorage", e);
      setError("Could not set the default background. Storage might be full.");
    }
  }, []);

  const handleClearDefaultBackground = useCallback(() => {
    localStorage.removeItem(DEFAULT_BG_KEY);
    setDefaultBackgroundImage(null);
  }, []);
  
  const handleSetDefaultLogo = useCallback((image: ImageFile) => {
    try {
      const storable = { dataUrl: image.dataUrl, mimeType: image.mimeType };
      localStorage.setItem(DEFAULT_LOGO_KEY, JSON.stringify(storable));
      setDefaultLogo(image);
    } catch (e) {
      console.error("Failed to save default logo to localStorage", e);
      setError("Could not set the default logo. Storage might be full.");
    }
  }, []);

  const handleClearDefaultLogo = useCallback(() => {
    localStorage.removeItem(DEFAULT_LOGO_KEY);
    setDefaultLogo(null);
  }, []);

  const handleRedraw = useCallback(async () => {
    if (!carImage || !backgroundImage) {
      setError("Please upload both a car image and a studio background image.");
      return;
    }

    const startTime = Date.now();
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedText(null);
    setGenerationTime(null);

    try {
      const { image, text } = await redrawCarImage(
        carImage.base64,
        backgroundImage.base64,
        carImage.mimeType,
        backgroundImage.mimeType,
        SYSTEM_PROMPT
      );
      setGeneratedImage(image);
      setGeneratedText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      const endTime = Date.now();
      setGenerationTime((endTime - startTime) / 1000); // in seconds
      setIsLoading(false);
    }
  }, [carImage, backgroundImage]);

  const handleDownload = useCallback(() => {
    if (!generatedImage) return;

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError("Could not process image for download.");
        return;
      }
      
      ctx.drawImage(image, 0, 0);

      // Convert the canvas to a JPEG data URL
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95); // High quality

      // Create a link and trigger the download
      const link = document.createElement('a');
      link.href = jpegDataUrl;
      link.download = 'redrawn-car-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    image.onerror = () => {
      setError("Failed to load generated image for download conversion.");
    };
    image.src = generatedImage;
  }, [generatedImage]);

  const canGenerate = carImage && backgroundImage && !isLoading;

  return (
    <div className="min-h-screen bg-slate-100 text-gray-800 flex flex-col">
      <Header 
        logo={logo}
        onLogoChange={setLogo}
        isDefaultLogo={!!(defaultLogo && logo && defaultLogo.dataUrl === logo.dataUrl)}
        onSetDefaultLogo={handleSetDefaultLogo}
        onClearDefaultLogo={handleClearDefaultLogo}
      />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12">
          
          {/* Input Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3">Inputs</h2>
            <ImageUploader
              title="Upload Car Image"
              icon={<CarIcon className="w-12 h-12" />}
              image={carImage}
              onImageChange={setCarImage}
            />
            <ImageUploader
              title="Upload Studio Background"
              icon={<StudioIcon className="w-12 h-12" />}
              image={backgroundImage}
              onImageChange={setBackgroundImage}
              isDefault={!!(defaultBackgroundImage && backgroundImage && defaultBackgroundImage.dataUrl === backgroundImage.dataUrl)}
              onSetDefault={handleSetDefaultBackground}
              onClearDefault={handleClearDefaultBackground}
            />
            <button
              onClick={handleRedraw}
              disabled={!canGenerate}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 border border-transparent text-lg font-bold rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-6 w-6 mr-2" />
                  Redraw Image
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3">Output</h2>
            <div className="bg-slate-200 rounded-lg p-4 border-2 border-dashed border-gray-300 aspect-video flex items-center justify-center">
              {isLoading && (
                <div className="text-center text-gray-600">
                   <svg className="animate-spin mx-auto h-10 w-10 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4">Generating hyper-realistic image...</p>
                  <p className="text-sm text-gray-500">This may take a moment.</p>
                </div>
              )}
              {error && (
                <div className="text-center text-red-600">
                  <AlertTriangleIcon className="mx-auto h-10 w-10" />
                  <p className="mt-4 font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {!isLoading && !error && generatedImage && (
                <div className="relative group w-full h-full">
                  <img src={generatedImage} alt="Generated car" className="w-full h-full object-contain rounded-md" />
                </div>
              )}
               {!isLoading && !error && !generatedImage && (
                <div className="text-center text-gray-500">
                  <p>Your redrawn image will appear here.</p>
                </div>
              )}
            </div>
             {generatedImage && !isLoading && (
               <div className="flex flex-col items-center gap-4">
                 <button
                   onClick={handleDownload}
                   className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-gray-700 transition-colors"
                 >
                   <DownloadIcon className="h-5 w-5" />
                   Download Image
                 </button>
                 {generatedText && (
                    <p className="text-sm text-gray-600 text-center p-3 bg-slate-200 rounded-lg">{generatedText}</p>
                 )}
                 {generationTime && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-slate-200 px-3 py-1.5 rounded-full">
                        <ClockIcon className="h-4 w-4" />
                        <span>Generation took {generationTime.toFixed(1)} seconds</span>
                    </div>
                 )}
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;