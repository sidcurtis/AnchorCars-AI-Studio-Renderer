import React, { useRef, useCallback } from 'react';
import type { ImageFile } from '../types';
import { UploadIcon, XCircleIcon, StarIcon } from './Icons';

interface ImageUploaderProps {
  title: string;
  icon: React.ReactNode;
  image: ImageFile | null;
  onImageChange: (file: ImageFile | null) => void;
  isDefault?: boolean;
  onSetDefault?: (file: ImageFile) => void;
  onClearDefault?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, icon, image, onImageChange, isDefault, onSetDefault, onClearDefault }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onImageChange({
          name: file.name,
          base64: base64.split(',')[1], // remove the data url part
          dataUrl: base64,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  }, [onImageChange]);

  const handleRemoveImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, [onImageChange]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleToggleDefault = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDefault && onClearDefault) {
          onClearDefault();
      } else if (!isDefault && image && onSetDefault) {
          onSetDefault(image);
      }
  };

  const uploaderClasses = image
    ? 'relative group cursor-pointer aspect-video flex items-center justify-center'
    : 'relative group bg-slate-200 rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-gray-500 transition-colors duration-300 cursor-pointer aspect-video flex flex-col items-center justify-center text-center';

  return (
    <div
      className={uploaderClasses}
      onClick={triggerFileInput}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
      />
      {image ? (
        <>
          <img src={image.dataUrl} alt={title} className="max-h-full max-w-full object-contain rounded-md" />
           <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 bg-white/70 rounded-full text-gray-500 hover:text-gray-900 hover:bg-white/90 transition-all opacity-0 group-hover:opacity-100"
            title="Remove image"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
           {onSetDefault && onClearDefault && (
            <button
              onClick={handleToggleDefault}
              className="absolute top-2 left-2 p-1 bg-white/70 rounded-full text-gray-500 hover:text-yellow-500 hover:bg-white/90 transition-all opacity-0 group-hover:opacity-100"
              title={isDefault ? "Clear default background" : "Set as default background"}
            >
              <StarIcon className="h-6 w-6" isFilled={isDefault} />
            </button>
          )}
        </>
      ) : (
        <div className="text-gray-500 group-hover:text-gray-700 transition-colors">
          <div className="w-12 h-12 mx-auto text-gray-400 group-hover:text-gray-600 transition-colors">{icon}</div>
          <h3 className="mt-2 text-sm font-semibold text-gray-700">{title}</h3>
          <p className="mt-1 text-xs">Click to upload</p>
        </div>
      )}
    </div>
  );
};