'use client';

import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Upload, FileText, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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

      const count = Array.isArray(result.data) ? result.data.length : 1;
      const firstTitle = Array.isArray(result.data) 
        ? (result.data[0]?.title || 'Academic Items') 
        : (result.data.title || 'Academic Item');

      setSuccess(Array.isArray(result.data) 
        ? `Successfully extracted ${count} academic items.` 
        : `Successfully extracted: "${firstTitle}"`
      );
      
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
        className={`relative upload-dropzone overflow-hidden rounded-[28px] p-8 border border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md ${
          isDragActive 
            ? 'border-slate-800 dark:border-white bg-slate-50/80 dark:bg-slate-800/40 scale-[1.01]' 
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
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
          <div className="flex flex-col items-center justify-center py-6 w-full">
            <Loader2 className="w-10 h-10 text-slate-800 dark:text-white animate-spin mb-4" />
            <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{statusText}</p>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">Please keep this window open</p>
            
            {/* Custom progress bar */}
            <div className="w-48 bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-5 overflow-hidden">
              <div 
                className="bg-slate-900 dark:bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 w-full">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4 text-slate-700 dark:text-slate-350 transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
              Upload Screenshot or Text Log
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 max-w-xs leading-relaxed font-medium">
              Drag & drop files here, or click to browse. Supports WhatsApp chat <code className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-bold">.txt</code> exports and screenshot images.
            </p>
            
            <div className="flex items-center gap-5 mt-6 text-xs text-slate-450 dark:text-slate-500">
              <span className="flex items-center gap-1.5 font-bold">
                <FileText className="w-3.5 h-3.5" /> WhatsApp Logs
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <ImageIcon className="w-3.5 h-3.5" /> Portal Images
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicators */}
      {error && (
        <div className="mt-4 p-4 rounded-[20px] bg-red-50/50 dark:bg-red-950/10 border border-red-100/60 dark:border-red-900/30 text-red-600 dark:text-red-400 flex items-start gap-3 animate-slide-up">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs">Extraction Failed</p>
            <p className="text-[11px] mt-0.5 leading-relaxed font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 rounded-[20px] bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-start gap-3 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs">Success</p>
            <p className="text-[11px] mt-0.5 leading-relaxed font-medium">{success}</p>
          </div>
        </div>
      )}
    </div>
  );
}
