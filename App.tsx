import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { GeneratorControls } from './components/GeneratorControls';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ShieldCheckIcon } from './components/icons/ShieldCheckIcon';
import { generateHeadshot, fileToBase64 } from './services/geminiService';
import { ATTIRES, BACKGROUNDS } from './constants';
import { CameraView } from './components/CameraView';
import { ImageCropper } from './components/ImageCropper';


const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [attire, setAttire] = useState<string>(ATTIRES[0]);
  const [background, setBackground] = useState<string>(BACKGROUNDS[0]);
  const [isEnhanced, setIsEnhanced] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [imageToCrop, setImageToCrop] = useState<File | null>(null);

  const handleImageReadyForCrop = useCallback((file: File) => {
    setGeneratedImageUrl(null);
    setError(null);
    setImageToCrop(file);
    setIsCropping(true);
    setIsCameraOpen(false); // Ensure camera view is closed
  }, []);

  const handleCropComplete = useCallback((croppedFile: File) => {
    setImageFile(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImageUrl(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
    
    setIsCropping(false);
    setImageToCrop(null);
  }, []);

  const handleCropCancel = useCallback(() => {
    setIsCropping(false);
    setImageToCrop(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const base64Image = await fileToBase64(imageFile);
      const resultBase64 = await generateHeadshot(base64Image, attire, background, isEnhanced);
      if (resultBase64) {
        setGeneratedImageUrl(`data:image/jpeg;base64,${resultBase64}`);
      } else {
        setError('The AI could not generate a headshot from this image. Please try a different photo with a clear view of the face.');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the headshot. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, attire, background, isEnhanced]);

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Uploader and Controls */}
          <div className="flex flex-col space-y-6">
            <ImageUploader 
              onImageSelected={handleImageReadyForCrop} 
              imageUrl={originalImageUrl}
              onOpenCameraClick={() => setIsCameraOpen(true)}
            />
             <GeneratorControls
              attire={attire}
              setAttire={setAttire}
              background={background}
              setBackground={setBackground}
              isEnhanced={isEnhanced}
              setIsEnhanced={setIsEnhanced}
              onGenerate={handleGenerate}
              isLoading={isLoading}
              hasUploadedImage={!!imageFile}
            />
          </div>

          {/* Right Column: Generated Result */}
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
              Generated Headshot
            </h2>
            <div className="flex-grow aspect-square w-full rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden">
              {isLoading && <LoadingSpinner message="Generating your new headshot..." />}
              {error && <div className="text-red-400 text-center p-4">{error}</div>}
              {!isLoading && !error && generatedImageUrl && (
                <img src={generatedImageUrl} alt="Generated headshot" className="object-cover w-full h-full" />
              )}
               {!isLoading && !error && !generatedImageUrl && (
                <div className="text-center text-gray-500 p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">Your generated headshot will appear here.</p>
                </div>
              )}
            </div>
             {generatedImageUrl && !isLoading && (
                <a 
                  href={generatedImageUrl} 
                  download="linkedin-headshot.jpg"
                  className="mt-4 w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Download Headshot
                </a>
              )}
          </div>

        </main>
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheckIcon />
            <p>All image processing is handled securely.</p>
          </div>
          <p className="mt-2">&copy; {new Date().getFullYear()} LinkedIn Headshot Generator. All rights reserved.</p>
        </footer>
      </div>
       {isCameraOpen && (
        <CameraView onCapture={handleImageReadyForCrop} onClose={() => setIsCameraOpen(false)} />
      )}
      {isCropping && imageToCrop && (
        <ImageCropper 
          imageFile={imageToCrop} 
          onCropComplete={handleCropComplete} 
          onClose={handleCropCancel} 
        />
      )}
    </div>
  );
};

export default App;