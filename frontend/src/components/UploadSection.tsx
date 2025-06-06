import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone } from './ui/DropZone';
import { ProgressBar } from './ui/ProgressBar';
import { Button } from './ui/Button';
import { RefreshCcw, FileVideo } from 'lucide-react';
import { AnalyzedVideo } from '../types';
import { formatFileSize } from '../lib/utils';
import { ExampleVideos } from './ExampleVideos';

interface UploadSectionProps {
  currentVideo: AnalyzedVideo | null;
  onFileSelect: (file: File) => void;
  onReset: () => void;
  isProcessing: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  currentVideo,
  onFileSelect,
  onReset,
  isProcessing
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = () => setIsDragOver(true);
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = () => setIsDragOver(false);

  const handleExampleSelect = (videoId: string) => {
    const mockFile = new File([""], `example-${videoId}.mp4`, { type: "video/mp4" });
    onFileSelect(mockFile);
  };

  return (
    <motion.section 
      className="w-full max-w-3xl mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <p className="mt-4 text-gray-600">
          Upload any video under 30 seconds to see our detection in action. We'll analyze it across multiple dimensions and show you exactly what we found.
        </p>
      </div>

      {currentVideo ? (
        <motion.div 
          className="card p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center">
            <div className="bg-gray-100 rounded-lg p-2 mr-4">
              <FileVideo className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {currentVideo.filename}
              </h4>
              <p className="text-xs text-gray-500">
                {formatFileSize(currentVideo.fileSize)}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              disabled={isProcessing}
            >
              New Video
            </Button>
          </div>
          
          {currentVideo.status === 'uploading' && (
            <div className="mt-4">
              <ProgressBar 
                progress={currentVideo.uploadProgress} 
                showPercentage 
              />
              <p className="mt-2 text-xs text-center text-gray-500">
                Uploading video...
              </p>
            </div>
          )}
          
          {currentVideo.status === 'processing' && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-700">
                <div className="mr-2 h-2 w-2 rounded-full bg-primary-500 animate-pulse"></div>
                <span className="text-sm font-medium">Processing video...</span>
              </div>
            </div>
          )}
          
          {currentVideo.status === 'error' && (
            <div className="mt-4 p-3 bg-error-50 text-error-700 rounded-lg text-sm">
              {currentVideo.error || 'An error occurred while processing the video.'}
            </div>
          )}
        </motion.div>
      ) : (
        <>
          <DropZone
            onFileSelect={onFileSelect}
            isDisabled={isProcessing}
            isProcessing={isProcessing}
            maxFileSizeMB={30}
            className="h-64"
          />
          <ExampleVideos onSelect={handleExampleSelect} />
        </>
      )}
    </motion.section>
  );
};