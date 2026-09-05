import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Upload Image Asset',
  hint = 'PNG, JPEG, or SVG up to 2MB (Offline local file cached)',
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-1.5 select-none', className)}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1B2A]">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative w-40 h-32 rounded bg-[#EDF1F5] border border-[#D4D9DF] overflow-hidden group">
          <img src={value} alt="Uploaded asset preview" className="w-full h-full object-contain p-2" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1.5 right-1.5 p-1 bg-[#782525] text-white rounded hover:bg-[#8F2E2E] transition-colors"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-2',
            dragActive
              ? 'border-[#0E1B2A] bg-[#EDF1F5]'
              : 'border-[#D4D9DF] bg-[#F6F8FA] hover:bg-[#EDF1F5] hover:border-[#A0AEC0]',
          )}
        >
          <div className="w-9 h-9 rounded bg-white flex items-center justify-center text-[#0E1B2A] shadow-xs border border-[#D4D9DF]">
            {dragActive ? <Upload className="w-4 h-4 animate-bounce" /> : <ImageIcon className="w-4 h-4" />}
          </div>
          <span className="text-xs font-semibold text-[#0E1B2A]">
            Click to upload or drag & drop
          </span>
          <span className="text-[11px] text-[#64748B]">{hint}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
};
