'use client';

import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Upload, FileText, Image, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

import { playBellChime } from '@/lib/sound';

interface FileUploadProps {
  onItemExtracted: (newItem: any) => void;
}

export default function FileUpload({ onItemExtracted }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    const isImage = file.type.startsWith('image/');
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt');

    if (!isImage && !isText) {
      setError('Unsupported file type. Please upload a WhatsApp chat export (.txt) or a screenshot image.');
      setLoading(false);
      return;
    }

    try {
      let extractedText = '';

      if (isImage) {
        setStatusText('Initializing OCR Engine...');
        setProgress(15);
        const worker = await createWorker('eng');
        
        setStatusText('Scanning screenshot for text...');
        setProgress(40);
        const { data: { text } } = await worker.recognize(file);
        
        setStatusText('Finishing scan...');
        setProgress(70);
        await worker.terminate();
        
        extractedText = text;
      } else {
        setStatusText('Reading chat export file...');
        setProgress(40);
        extractedText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read text file.'));
          reader.readAsText(file);
        });
        setProgress(70);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No legible text could be extracted from this file.');
      }

      setStatusText('AI Parsing details...');
      setProgress(85);

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: extractedText,
          sourceType: isImage ? 'screenshot' : 'whatsapp',
          sourceName: file.name,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to extract items via AI.');
      }

      setProgress(100);
      
      // Trigger the chime sound upon successful task creation action
      playBellChime();

      setSuccess(`Successfully extracted: "${result.data.title}"`);
      onItemExtracted(result.data);
      
      setTimeout(() => {
        setSuccess(null);
      }, 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while processing the file.');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`relative bg-white rounded-[24px] p-8 border-dashed border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] ${
          isDragActive 
            ? 'border-[#1677FF] bg-blue-50/50 scale-[1.01]' 
            : 'border-gray-200 hover:border-[#1677FF]/60 bg-white'
        } ${loading ? 'pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="text/plain,image/*"
          onChange={handleFileChange}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="w-12 h-12 text-[#1677FF] animate-spin mb-4" />
            <p className="font-bold text-[#111827] text-sm">{statusText}</p>
            <p className="text-xs text-[#6B7280] mt-1">Please keep this window open</p>
            
            {/* Custom progress bar */}
            <div className="w-64 bg-gray-100 h-2 rounded-full mt-4 overflow-hidden border border-gray-200">
              <div 
                className="bg-[#1677FF] h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 rounded-[16px] bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 text-[#1677FF] transition-transform">
              <Upload className="w-8 h-8" />
            </div>
            <p className="font-bold text-base text-[#111827]">
              Upload Screenshot or Text Log
            </p>
            <p className="text-xs text-[#6B7280] mt-2 max-w-sm leading-relaxed">
              Drag & drop files here, or click to browse. Supports WhatsApp chat <code className="text-[#1677FF] bg-blue-50 px-1 py-0.5 rounded text-[10px] font-bold">.txt</code> exports and dashboard images.
            </p>
            
            <div className="flex items-center gap-6 mt-6 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5 font-semibold">
                <FileText className="w-4 h-4 text-[#22C55E]" /> WhatsApp Logs
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Image className="w-4 h-4 text-[#F59E0B]" /> Portal Screenshots
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicators */}
      {error && (
        <div className="mt-4 p-4 rounded-[14px] bg-red-50 border border-red-100 text-[#EF4444] flex items-start gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs">Extraction Failed</p>
            <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 rounded-[14px] bg-green-50 border border-green-100 text-[#22C55E] flex items-start gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs">Success</p>
            <p className="text-[11px] text-green-600 mt-0.5">{success}</p>
          </div>
        </div>
      )}
    </div>
  );
}
