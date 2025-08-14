import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  isProcessing: boolean;
}

export function FileUpload({ onFileSelect, onFileRemove, selectedFile, isProcessing }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
    setDragOver(false);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isProcessing
  });

  if (selectedFile) {
    return (
      <div className="glassmorphism rounded-xl p-4" data-testid="file-selected-display">
        <div className="space-y-3">
          <div className="w-12 h-12 glassmorphism-dark rounded-xl flex items-center justify-center mx-auto">
            <Check className="w-5 h-5 text-green-300" data-testid="file-selected-icon" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1" data-testid="file-selected-title">File Selected</h3>
            <p className="text-gray-200 text-sm mb-1" data-testid="file-selected-name">{selectedFile.name}</p>
            <p className="text-xs text-gray-300" data-testid="file-selected-size">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={onFileRemove}
            disabled={isProcessing}
            className="glassmorphism-dark hover:bg-white hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            data-testid="button-change-file"
          >
            <X className="w-3 h-3 inline mr-1" />
            Change File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-white border-opacity-30 rounded-xl p-6 text-center transition-all duration-300 cursor-pointer",
        "hover:border-opacity-50",
        (isDragActive || dragOver) && "drag-over",
        isProcessing && "opacity-50 cursor-not-allowed"
      )}
      data-testid="file-upload-area"
    >
      <input {...getInputProps()} data-testid="file-input" />
      <div className="space-y-4">
        <div className="w-12 h-12 glassmorphism-dark rounded-xl flex items-center justify-center mx-auto animate-pulse-soft">
          <Upload className="w-5 h-5" data-testid="upload-icon" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1" data-testid="upload-title">Upload Question Paper</h3>
          <p className="text-gray-200 text-sm mb-2" data-testid="upload-description">
            {isDragActive ? "Drop the file here..." : "Drag and drop or click to browse"}
          </p>
          <p className="text-xs text-gray-300" data-testid="upload-file-types">
            PDF, PNG, JPG, TXT (Max 10MB)
          </p>
        </div>
        <button
          type="button"
          className="glassmorphism-dark hover:bg-white hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-300 text-sm"
          data-testid="button-choose-file"
        >
          <File className="w-3 h-3 inline mr-1" />
          Choose File
        </button>
      </div>
    </div>
  );
}
