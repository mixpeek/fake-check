import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileVideo, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isHovered, setIsHovered] = useState(false);

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
      className={cn('w-full', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        {...getRootProps()}
        className={cn(
          'relative overflow-hidden flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer group',
          isDragActive 
            ? 'border-primary-400 bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 shadow-lg scale-105' 
            : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 hover:border-gray-400 hover:shadow-md',
          isDragReject ? 'border-red-400 bg-gradient-to-br from-red-50 to-pink-50' : '',
          isDisabled ? 'opacity-60 cursor-not-allowed' : '',
          error ? 'border-red-400 bg-gradient-to-br from-red-50 to-pink-50' : ''
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <input {...getInputProps()} />
        
        {/* Animated background sparkles */}
        <AnimatePresence>
          {(isDragActive || isHovered) && !error && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Sparkles className="absolute top-4 right-4 w-4 h-4 text-primary-400 animate-pulse" />
              <Sparkles className="absolute top-8 left-6 w-3 h-3 text-blue-400 animate-pulse delay-300" />
              <Sparkles className="absolute bottom-6 right-8 w-3 h-3 text-purple-400 animate-pulse delay-700" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex flex-col items-center justify-center text-center p-4 relative z-10">
          {isProcessing ? (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 mb-6 relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-blue-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
                  <FileVideo className="w-7 h-7 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Processing video...</h3>
              <p className="text-sm text-gray-600">This might take a moment.</p>
            </motion.div>
          ) : isDragActive ? (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="p-4 mb-6 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Upload className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-primary-700 mb-2">Drop the video here</h3>
              <p className="text-sm text-primary-600">Release to upload</p>
            </motion.div>
          ) : (
            <motion.div 
              className="flex flex-col items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className={cn(
                  "p-4 mb-6 rounded-full transition-all duration-300",
                  isHovered 
                    ? "bg-gradient-to-r from-primary-500 to-blue-500 shadow-lg" 
                    : "bg-gradient-to-r from-gray-200 to-gray-300"
                )}
                animate={isHovered ? { y: -2 } : { y: 0 }}
              >
                <FileVideo className={cn(
                  "w-8 h-8 transition-colors duration-300",
                  isHovered ? "text-white" : "text-gray-600"
                )} />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-gray-900">
                Drag & drop a video or click to browse
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Supports MP4, MOV, AVI, WEBM (max {maxFileSizeMB}MB)
              </p>
              
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:from-primary-700 hover:to-blue-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Choose File
              </motion.button>
            </motion.div>
          )}
          
          <AnimatePresence>
            {error && (
              <motion.div 
                className="mt-6 flex items-center text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};