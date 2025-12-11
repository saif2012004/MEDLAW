"use client";
import React, { useState, useRef, useCallback, DragEvent } from "react";
import { X, Upload, FileText, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./Button";

interface UploadedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (files: { doc_id: string; filename: string; chunks: number }[]) => void;
  title?: string;
  description?: string;
}

const ALLOWED_TYPES = [
  { ext: ".pdf", mime: "application/pdf", label: "PDF" },
  { ext: ".docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "DOCX" },
  { ext: ".txt", mime: "text/plain", label: "TXT" },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function UploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  title = "Upload Documents",
  description = "Upload documents for AI analysis. Supported formats: PDF, DOCX, TXT",
}: UploadModalProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const isValidType = ALLOWED_TYPES.some((t) => t.ext === ext);
    
    if (!isValidType) {
      return `Invalid file type. Allowed: ${ALLOWED_TYPES.map((t) => t.label).join(", ")}`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    
    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const filesToAdd: UploadedFile[] = [];
    
    Array.from(newFiles).forEach((file) => {
      const error = validateFile(file);
      filesToAdd.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: error ? "error" : "pending",
        progress: 0,
        error: error || undefined,
      });
    });
    
    setFiles((prev) => [...prev, ...filesToAdd]);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
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
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    const validFiles = files.filter((f) => f.status === "pending");
    if (validFiles.length === 0) return;

    setIsUploading(true);

    // Update all pending files to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading" as const, progress: 0 } : f
      )
    );

    try {
      const formData = new FormData();
      validFiles.forEach((f) => {
        formData.append("files", f.file);
      });

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_BASE_URL}/api/rag/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      // Update files to success
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "success" as const, progress: 100 }
            : f
        )
      );

      // Notify parent
      onUploadComplete(result.files);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setFiles([]);
      }, 1500);

    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error" as const, error: error.message }
            : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#064E3B]">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragging
                ? "border-[#064E3B] bg-[#064E3B]/5"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_TYPES.map((t) => t.ext).join(",")}
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            
            <div className={`
              w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center
              ${isDragging ? "bg-[#064E3B]/10" : "bg-slate-100"}
            `}>
              <Upload className={`w-8 h-8 ${isDragging ? "text-[#064E3B]" : "text-slate-400"}`} />
            </div>
            
            <p className="text-base font-medium text-slate-700 mb-1">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-slate-500">
              or <span className="text-[#064E3B] font-medium">browse</span> to select
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Max file size: 50MB
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border
                    ${file.status === "error" ? "border-red-200 bg-red-50" : "border-slate-100 bg-slate-50"}
                  `}
                >
                  {getFileIcon(file.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {file.file.name}
                    </p>
                    {file.error ? (
                      <p className="text-xs text-red-500">{file.error}</p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        {(file.file.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>

                  {file.status === "pending" && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.filter((f) => f.status === "pending").length === 0}
            className="bg-[#064E3B] hover:bg-[#064E3B]/90"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.filter((f) => f.status === "pending").length} file(s)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;



