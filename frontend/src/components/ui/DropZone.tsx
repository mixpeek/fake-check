import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileVideo, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatFileSize } from '../../lib/utils';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  className?: string;
  isDisabled?: boolean;
  isProcessing?: boolean;
  maxFileSizeMB?: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  className,
  isDisabled = false,
  isProcessing = false,
  maxFileSizeMB = 50
}) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        setError(`File too large. Maximum size is ${maxFileSizeMB}MB.`);
        return;
      }
      
      onFileSelect(file);
    },
    [onFileSelect, maxFileSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled: isDisabled || isProcessing,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxFiles: 1
  });

  return (
    <motion.div
      className={cn(
        'w-full',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer',
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:bg-gray-50',
          isDragReject ? 'border-error-500 bg-error-50' : '',
          isDisabled ? 'opacity-60 cursor-not-allowed' : '',
          error ? 'border-error-500' : '',
          className
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center text-center p-4">
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 mb-4 relative">
                <div className="animate-pulse-slow absolute inset-0 rounded-full bg-primary-500 opacity-75"></div>
                <div className="relative flex items-center justify-center w-full h-full rounded-full bg-primary-500">
                  <FileVideo className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700">Processing video...</p>
              <p className="mt-1 text-sm text-gray-500">This might take a moment.</p>
            </div>
          ) : isDragActive ? (
            <div className="flex flex-col items-center">
              <div className="p-3 mb-4 rounded-full bg-primary-100">
                <Upload className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-lg font-medium text-primary-600">Drop the video here</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-3 mb-4 rounded-full bg-gray-100">
                <FileVideo className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-lg font-medium text-gray-700">Drag & drop a video or click to browse</p>
              <p className="mt-1 text-sm text-gray-500">
                Supports MP4, MOV, AVI, WEBM (max {maxFileSizeMB}MB)
              </p>
            </div>
          )}
          
          {error && (
            <div className="mt-4 flex items-center text-error-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};