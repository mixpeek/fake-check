import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DropZone } from './ui/DropZone';
import { ProgressBar } from './ui/ProgressBar';
import { ProcessingAnimation } from './ui/ProcessingAnimation';
import { Button } from './ui/Button';
import { RefreshCcw, FileVideo } from 'lucide-react';
import { AnalyzedVideo } from '../types';
import { ProcessingStage } from '../hooks/useVideoDetection';
import { formatFileSize } from '../lib/utils';
import { ExampleVideos } from './ExampleVideos';

interface UploadSectionProps {
  currentVideo: AnalyzedVideo | null;
  onFileSelect: (file: File) => void;
  onReset: () => void;
  isProcessing: boolean;
  processingStages?: ProcessingStage[];
  currentStageIndex?: number;
  simulatedProgress?: number;
  estimatedTimeRemaining?: number;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  currentVideo,
  onFileSelect,
  onReset,
  isProcessing,
  processingStages = [],
  currentStageIndex = 0,
  simulatedProgress = 0,
  estimatedTimeRemaining = 0
}) => {
  const handleExampleSelect = (file: File) => {
    onFileSelect(file);
  };

  const renderContent = () => {
    if (currentVideo) {
      return (
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
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
            <div className="mt-6">
              <ProcessingAnimation
                stages={processingStages}
                currentStageIndex={currentStageIndex}
                overallProgress={simulatedProgress}
                estimatedTimeRemaining={estimatedTimeRemaining}
              />
            </div>
          )}
          
          {currentVideo.status === 'error' && (
            <div className="mt-4 p-3 bg-error-50 text-error-700 rounded-lg text-sm">
              {currentVideo.error || 'An error occurred while processing the video.'}
            </div>
          )}
        </motion.div>
      );
    }
    
    return (
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
    );
  };

  return <div>{renderContent()}</div>;
};