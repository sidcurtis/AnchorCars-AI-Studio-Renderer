import React, { useRef, useCallback } from 'react';
import type { ImageFile } from '../types';
import { UploadIcon, XCircleIcon, StarIcon } from './Icons';

interface HeaderProps {
  logo: ImageFile | null;
  isDefaultLogo: boolean;
  onLogoChange: (file: ImageFile | null) => void;
  onSetDefaultLogo: (file: ImageFile) => void;
  onClearDefaultLogo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  logo,
  isDefaultLogo,
  onLogoChange,
  onSetDefaultLogo,
  onClearDefaultLogo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onLogoChange({
          name: file.name,
          base64: base64.split(',')[1],
          dataUrl: base64,
          mimeType: file.type,
        });
        if(event.target) event.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  }, [onLogoChange]);
  
  const handleRemoveLogo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLogoChange(null);
  }, [onLogoChange]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleToggleDefault = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDefaultLogo) {
          onClearDefaultLogo();
      } else if (logo) {
          onSetDefaultLogo(logo);
      }
  }, [isDefaultLogo, logo, onSetDefaultLogo, onClearDefaultLogo]);

  const uploaderClasses = logo
    ? 'relative group h-16 w-40 flex items-center justify-center cursor-pointer'
    : 'relative group h-16 w-40 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-gray-500 transition-colors duration-300 cursor-pointer p-1';

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            
            <div
              className={uploaderClasses}
              onClick={triggerFileInput}
              title="Click to upload a new logo"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg, image/png, image/webp, image/gif"
              />
              {logo ? (
                <>
                  <img src={logo.dataUrl} alt="Custom Logo" className="max-h-full max-w-full object-contain" />
                  <div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={handleRemoveLogo}
                      className="p-1 bg-white/80 rounded-full text-gray-500 hover:text-gray-900 hover:bg-white/95"
                      title="Remove logo"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleToggleDefault}
                      className="p-1 bg-white/80 rounded-full text-gray-500 hover:text-yellow-500 hover:bg-white/95"
                      title={isDefaultLogo ? "Clear default logo" : "Set as default logo"}
                    >
                      <StarIcon className="h-5 w-5" isFilled={isDefaultLogo} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 group-hover:text-gray-700 transition-colors text-center p-2">
                  <UploadIcon className="h-6 w-6 mx-auto" />
                  <span className="text-xs mt-1 block">Upload Logo</span>
                </div>
              )}
            </div>
            
            <div className="border-l-2 border-gray-200 pl-4">
              <p className="text-lg text-gray-600">AI Studio Renderer</p>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};