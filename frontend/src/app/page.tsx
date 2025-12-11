"use client";
import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Paperclip, X, FileText, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/animations/FadeIn";

interface AttachedFile {
  file: File;
  id: string;
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; // Max height before scrolling
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [query]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const allowedTypes = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
    const newFiles: AttachedFile[] = [];
    
    Array.from(files).forEach(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (allowedTypes.includes(ext)) {
        newFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9)
        });
      }
    });
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!query.trim() && attachedFiles.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Store query and files in sessionStorage for the assistant page
      sessionStorage.setItem('pendingQuery', query);
      
      if (attachedFiles.length > 0) {
        // We'll handle file upload on the assistant page
        const fileNames = attachedFiles.map(f => f.file.name);
        sessionStorage.setItem('pendingFiles', JSON.stringify(fileNames));
        
        // Store files in a temporary way (via FormData approach on next page)
        // For now, we'll just pass the metadata
      }
      
      // Navigate to assistant page with query
      router.push(`/assistant?q=${encodeURIComponent(query)}`);
      
    } catch (error) {
      console.error('Error submitting query:', error);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const suggestedQueries = [
    "What are the FDA 21 CFR 820 requirements?",
    "Explain ISO 13485 quality management",
    "How to prepare for EU MDR compliance?",
    "What is a Design History File (DHF)?",
  ];

  return (
    <main 
      className="min-h-screen bg-gradient-to-b from-[#f0fdf4] to-white flex flex-col items-center justify-center p-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-[#064E3B]/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-dashed border-[#064E3B]">
            <FileText className="w-16 h-16 text-[#064E3B] mx-auto mb-4" />
            <p className="text-xl font-medium text-[#064E3B]">Drop files here</p>
            <p className="text-sm text-slate-500 mt-2">PDF, DOCX, TXT, or images</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl">
        <FadeIn direction="up" delay={0.1}>
          {/* Logo / Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              <span className="text-sm font-medium text-slate-600">AI-Powered Compliance</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#064E3B] tracking-tight mb-4">
              How can I help you?
            </h1>
            <p className="text-lg text-slate-500 font-light">
              Ask about FDA, ISO 13485, EU MDR regulations, or upload documents for analysis
            </p>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={0.2}>
          {/* Search Container */}
          <div className={`
            relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300
            ${isDragging ? 'border-[#064E3B] shadow-xl' : 'border-slate-200 hover:border-slate-300 focus-within:border-[#064E3B] focus-within:shadow-xl'}
          `}>
            {/* Attached Files */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 pb-0">
                {attachedFiles.map(({ file, id }) => (
                  <div 
                    key={id}
                    className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 text-sm group"
                  >
                    <FileText className="w-4 h-4 text-[#064E3B]" />
                    <span className="text-slate-700 max-w-[150px] truncate">{file.name}</span>
                    <button 
                      onClick={() => removeFile(id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main Input Area */}
            <div className="flex items-end gap-2 p-3">
              {/* Attach Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-2.5 rounded-xl text-slate-400 hover:text-[#064E3B] hover:bg-slate-100 transition-all"
                title="Attach files"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about medical device regulations..."
                className="flex-1 resize-none outline-none text-lg text-slate-700 placeholder:text-slate-400 min-h-[48px] max-h-[200px] py-2"
                rows={1}
                disabled={isLoading}
              />

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (!query.trim() && attachedFiles.length === 0)}
                className={`
                  flex-shrink-0 h-12 w-12 rounded-xl p-0 transition-all
                  ${query.trim() || attachedFiles.length > 0
                    ? 'bg-[#064E3B] hover:bg-[#064E3B]/90 text-white shadow-md hover:shadow-lg'
                    : 'bg-slate-100 text-slate-400'
                  }
                `}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Helper Text */}
            <div className="px-4 pb-3">
              <p className="text-xs text-slate-400">
                Press Enter to send • Shift+Enter for new line • Drag & drop files
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={0.3}>
          {/* Suggested Queries */}
          <div className="mt-8">
            <p className="text-sm text-slate-400 text-center mb-4">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedQueries.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(suggestion)}
                  className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm text-slate-600 hover:border-[#064E3B] hover:text-[#064E3B] transition-all shadow-sm hover:shadow"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={0.4}>
          {/* Footer Links */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <a href="/dashboard" className="hover:text-[#064E3B] transition-colors">
                Dashboard
              </a>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <a href="/dashboard/templates" className="hover:text-[#064E3B] transition-colors">
                Templates
              </a>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <a href="/login" className="hover:text-[#064E3B] transition-colors">
                Sign In
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
