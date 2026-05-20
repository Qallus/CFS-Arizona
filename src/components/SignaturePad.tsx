'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Upload, Trash2, Check } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({ value, onChange, width = 400, height = 150 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If there's an existing signature, load it
    if (value && mode === 'draw') {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value, mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Option 1: Upload to server
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'signatures');
      const res = await fetch('/api/uploads', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        onChange(data.url);
        setHasSignature(true);
      }
    } catch {
      // Fallback: Convert to data URL
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result as string);
        setHasSignature(true);
      };
      reader.readAsDataURL(file);
    }
  };

  if (value && !value.startsWith('data:')) {
    // It's a URL - show preview with option to change
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 p-3 bg-white border border-border rounded-lg">
            <img src={value} alt="Signature" className="max-h-16 mx-auto" />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg text-sm flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            mode === 'draw' 
              ? 'bg-brand text-brand-foreground' 
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          ✏️ Draw
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            mode === 'upload' 
              ? 'bg-brand text-brand-foreground' 
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          📤 Upload
        </button>
      </div>

      {mode === 'draw' ? (
        <>
          {/* Canvas */}
          <div className="relative border-2 border-dashed border-border rounded-lg bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="cursor-crosshair touch-none w-full"
              style={{ maxWidth: width, height }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-gray-400 text-sm">Sign here</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="px-3 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 text-sm flex items-center gap-1"
            >
              <Eraser className="w-4 h-4" /> Clear
            </button>
            {hasSignature && (
              <button
                type="button"
                onClick={saveSignature}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Use Signature
              </button>
            )}
          </div>
        </>
      ) : (
        /* Upload Mode */
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg hover:border-brand cursor-pointer transition-colors bg-secondary/30">
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Click to upload signature image</span>
          <span className="text-xs text-muted-foreground mt-1">PNG, JPG (transparent background works best)</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      )}
    </div>
  );
}
