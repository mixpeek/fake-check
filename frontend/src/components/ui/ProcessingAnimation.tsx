import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Loader } from 'lucide-react';
import { ProcessingStage } from '../../hooks/useVideoDetection';
import { cn } from '../../lib/utils';

interface ProcessingAnimationProps {
  stages: ProcessingStage[];
  currentStageIndex: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
  className?: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

export const ProcessingAnimation: React.FC<ProcessingAnimationProps> = ({
  stages,
  currentStageIndex,
  overallProgress,
  estimatedTimeRemaining,
  className
}) => {
  const activeStage = stages.find(stage => stage.active);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Status */}
      <div className="text-center">
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-primary-50 text-primary-700 mb-4">
          <Loader className="h-4 w-4 mr-2 animate-spin" />
          <span className="font-medium">
            {activeStage ? activeStage.name : 'Processing video...'}
          </span>
        </div>
        
        {activeStage && (
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            {activeStage.description}
          </p>
        )}
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{Math.round(overallProgress * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div 
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress * 100}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Time Remaining */}
      {estimatedTimeRemaining > 0 && (
        <div className="flex items-center justify-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-1" />
          <span>Estimated time remaining: {formatTime(estimatedTimeRemaining)}</span>
        </div>
      )}

      {/* Stage Checklist */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Analysis Progress</h4>
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.id}
              className={cn(
                "flex items-center space-x-3 p-2 rounded transition-colors",
                stage.active && "bg-primary-50",
                stage.completed && "bg-success-50"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                stage.completed && "bg-success-500 border-success-500",
                stage.active && "border-primary-500 bg-white",
                !stage.active && !stage.completed && "border-gray-300 bg-white"
              )}>
                {stage.completed ? (
                  <Check className="h-3 w-3 text-white" />
                ) : stage.active ? (
                  <motion.div
                    className="w-2 h-2 bg-primary-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ) : (
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  stage.completed && "text-success-700",
                  stage.active && "text-primary-700",
                  !stage.active && !stage.completed && "text-gray-500"
                )}>
                  {stage.name}
                </p>
                {stage.active && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    {stage.description}
                  </p>
                )}
              </div>
              
              {stage.active && (
                <motion.div
                  className="flex-shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Loader className="h-4 w-4 text-primary-600 animate-spin" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fun Facts / Educational Content */}
      {activeStage && (
        <motion.div
          key={activeStage.id}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">💡</span>
            </div>
            <div>
              <h5 className="text-sm font-medium text-blue-900 mb-1">Did you know?</h5>
              <p className="text-sm text-blue-800">
                {getEducationalContent(activeStage.id)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const getEducationalContent = (stageId: string): string => {
  const content: Record<string, string> = {
    extracting: "AI models analyze videos frame by frame, typically processing 24-30 frames per second to detect subtle inconsistencies.",
    visual_analysis: "The CLIP neural network was trained on 400 million image-text pairs and can detect visual patterns invisible to human eyes.",
    artifacts: "Deepfakes often leave compression artifacts around face edges where synthetic content is blended with real video.",
    lipsync: "Even the best deepfakes struggle with perfect lip-sync - there are often micro-delays of just 40-80 milliseconds.",
    blinks: "Humans naturally blink 15-20 times per minute with irregular patterns. AI-generated faces often show robotic blinking.",
    text: "AI-generated videos frequently contain corrupted text or gibberish characters that reveal their synthetic nature.",
    motion: "Optical flow analysis can detect unnatural movement patterns when AI struggles to maintain temporal consistency.",
    finalizing: "Our system combines results from all analysis methods to provide a comprehensive authenticity assessment."
  };
  
  return content[stageId] || "Advanced AI analysis is detecting patterns that indicate whether this video is authentic or synthetic.";
}; 