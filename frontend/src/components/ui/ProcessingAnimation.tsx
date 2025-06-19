import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Loader, Sparkles, Brain, Eye } from 'lucide-react';
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
    <div className={cn("space-y-8", className)}>
      {/* Main Status with enhanced visual design */}
      <div className="text-center relative">
        <motion.div
          className="inline-flex items-center px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-50 via-blue-50 to-purple-50 border border-primary-200 text-primary-800 mb-6 shadow-lg relative overflow-hidden"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary-200/20 to-blue-200/20"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          <motion.div
            className="relative z-10"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader className="h-5 w-5 mr-3 text-primary-600" />
          </motion.div>
          
          <div className="relative z-10">
            <span className="font-bold text-lg">
              {activeStage ? activeStage.name : 'Processing video...'}
            </span>
          </div>
          
          <Sparkles className="h-4 w-4 ml-3 text-purple-500 animate-pulse" />
        </motion.div>
        
        {activeStage && (
          <motion.p 
            className="text-base text-gray-700 max-w-lg mx-auto font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={activeStage.id}
          >
            {activeStage.description}
          </motion.p>
        )}
      </div>

      {/* Enhanced Overall Progress Bar */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-gray-800">Overall Progress</span>
          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {Math.round(overallProgress * 100)}%
          </span>
        </div>
        <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-500 rounded-full shadow-lg"
            style={{ width: `${overallProgress * 100}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-full"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Enhanced Time Remaining */}
      {estimatedTimeRemaining > 0 && (
        <motion.div 
          className="flex items-center justify-center text-base text-gray-700 bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Clock className="h-5 w-5 mr-2 text-primary-600" />
          <span className="font-medium">
            Estimated time remaining: <span className="text-primary-700 font-bold">{formatTime(estimatedTimeRemaining)}</span>
          </span>
        </motion.div>
      )}

      {/* Enhanced Stage Checklist */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center mb-6">
          <Brain className="h-6 w-6 text-primary-600 mr-3" />
          <h4 className="text-xl font-bold text-gray-900">AI Analysis Progress</h4>
        </div>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.id}
              className={cn(
                "flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 border",
                stage.active && "bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200 shadow-md",
                stage.completed && "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm",
                !stage.active && !stage.completed && "bg-white border-gray-200 hover:bg-gray-50"
              )}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ x: 4 }}
            >
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-300",
                stage.completed && "bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 shadow-lg",
                stage.active && "border-primary-500 bg-white shadow-md",
                !stage.active && !stage.completed && "border-gray-300 bg-gray-100"
              )}>
                {stage.completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Check className="h-5 w-5 text-white" />
                  </motion.div>
                ) : stage.active ? (
                  <motion.div
                    className="w-4 h-4 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                ) : (
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-base font-bold",
                  stage.completed && "text-green-800",
                  stage.active && "text-primary-800",
                  !stage.active && !stage.completed && "text-gray-600"
                )}>
                  {stage.name}
                </p>
                {stage.active && (
                  <motion.p 
                    className="text-sm text-gray-700 mt-1 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {stage.description}
                  </motion.p>
                )}
              </div>
              
              {stage.active && (
                <motion.div
                  className="flex-shrink-0"
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  transition={{ duration: 0.5, rotate: { duration: 2, repeat: Infinity, ease: "linear" } }}
                >
                  <Loader className="h-5 w-5 text-primary-600" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Enhanced Educational Content */}
      {activeStage && (
        <motion.div
          key={activeStage.id}
          className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg relative overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="absolute top-2 right-2 opacity-20"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Eye className="h-8 w-8 text-blue-500" />
          </motion.div>
          
          <div className="flex items-start space-x-4">
            <motion.div 
              className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-white text-xl">💡</span>
            </motion.div>
            <div className="flex-1">
              <h5 className="text-lg font-bold text-blue-900 mb-2 flex items-center">
                Did you know?
                <Sparkles className="h-4 w-4 ml-2 text-purple-600 animate-pulse" />
              </h5>
              <p className="text-base text-blue-800 leading-relaxed font-medium">
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
    extracting: "AI models analyze videos frame by frame, typically processing 24-30 frames per second to detect subtle inconsistencies that are invisible to the human eye.",
    visual_analysis: "The CLIP neural network was trained on 400 million image-text pairs and can detect visual patterns with superhuman precision, identifying synthetic faces with 94% accuracy.",
    artifacts: "Deepfakes often leave compression artifacts around face edges where synthetic content is blended with real video - these tiny distortions are telltale signs of manipulation.",
    lipsync: "Even the best deepfakes struggle with perfect lip-sync - there are often micro-delays of just 40-80 milliseconds that our AI can detect but humans cannot perceive.",
    blinks: "Humans naturally blink 15-20 times per minute with irregular patterns. AI-generated faces often show robotic blinking or no blinking at all - a dead giveaway.",
    text: "AI-generated videos frequently contain corrupted text or gibberish characters that reveal their synthetic nature, as text rendering is still challenging for AI systems.",
    motion: "Optical flow analysis can detect unnatural movement patterns when AI struggles to maintain temporal consistency across video frames.",
    finalizing: "Our system combines results from all analysis methods using advanced fusion algorithms to provide a comprehensive authenticity assessment with confidence scoring."
  };
  
  return content[stageId] || "Advanced AI analysis is detecting patterns that indicate whether this video is authentic or synthetic.";
}; 