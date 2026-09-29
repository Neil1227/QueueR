'use client';

import React, { useRef, useEffect } from 'react';
import { drawQR } from '@/lib/qr';
import { Upload, Clipboard } from 'lucide-react';

interface QRPreviewProps {
  payload?: string | null;
  imgB64?: string | null;
  message?: string;
  isSuccess?: boolean;
  onFileSelect: (file: File) => void;
  onPasteClick: () => void;
}

export function QRPreview({
  payload,
  imgB64,
  message,
  isSuccess,
  onFileSelect,
  onPasteClick,
}: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (payload && canvasRef.current) {
      drawQR(canvasRef.current, payload, 320);
    }
  }, [payload]);

  const hasContent = Boolean(payload || imgB64);

  return (
    <div className="bg-surface border-2 border-dashed border-line rounded-2xl p-4 text-center transition-colors">
      {hasContent && (
        <div className="w-44 h-44 mx-auto mb-3.5 bg-white rounded-xl p-2.5 shadow-sm flex items-center justify-center overflow-hidden">
          {payload ? (
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain [image-rendering:pixelated]"
            />
          ) : imgB64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgB64}
              alt="QR Code fallback"
              className="w-full h-full object-contain [image-rendering:pixelated]"
            />
          ) : null}
        </div>
      )}

      <div className="flex gap-2.5 justify-center mt-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-bg hover:bg-bg/80 text-text font-semibold text-sm rounded-xl transition-all active:scale-95 shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>

        <button
          type="button"
          onClick={onPasteClick}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-bg hover:bg-bg/80 text-text font-semibold text-sm rounded-xl transition-all active:scale-95 shadow-sm"
        >
          <Clipboard className="w-4 h-4" />
          <span>Paste</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            onFileSelect(f);
            e.target.value = '';
          }
        }}
      />

      <p
        className={`text-xs mt-3 min-h-[1.25rem] font-medium transition-colors ${
          isSuccess
            ? 'text-emerald-600 dark:text-emerald-400'
            : hasContent
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-muted'
        }`}
      >
        {message || 'Upload a screenshot or paste one from your clipboard.'}
      </p>
    </div>
  );
}
