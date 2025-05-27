import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { DetectionResult as DetectionResultType } from '../types';
import { DetectionTagBadge } from './ui/Badge';
import { cn } from '../lib/utils';

interface DetectionResultProps {
  result: DetectionResultType;
}

export const DetectionResult: React.FC<DetectionResultProps> = ({ result }) => {
  const { isReal, confidenceScore, tags } = result;
  const score = Math.round(confidenceScore * 100);

  return (
    <motion.div
      className="card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={cn(
        "p-6",
        isReal ? "bg-success-500" : "bg-error-500"
      )}>
        <div className="flex items-center">
          {isReal ? (
            <CheckCircle className="h-8 w-8 text-white mr-3" />
          ) : (
            <XCircle className="h-8 w-8 text-white mr-3" />
          )}
          <div>
            <h3 className="text-xl font-bold text-white">
              {score}% {isReal ? 'Likely Authentic' : 'Likely AI-Generated'}
            </h3>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-white">
        <h4 className="text-lg font-medium mb-4">Detected Anomalies</h4>
        <div className="space-y-3">
          {tags.map((tag, index) => (
            <div key={index} className="flex items-center text-sm">
              <AlertTriangle className="h-4 w-4 text-warning-500 mr-2" />
              <span>{tag}</span>
            </div>
          ))}
          {isReal && (
            <>
              <div className="flex items-center text-sm text-success-700">
                <Check className="h-4 w-4 mr-2" />
                <span>Natural facial movements</span>
              </div>
              <div className="flex items-center text-sm text-success-700">
                <Check className="h-4 w-4 mr-2" />
                <span>Audio sync verified</span>
              </div>
              <div className="flex items-center text-sm text-success-700">
                <Check className="h-4 w-4 mr-2" />
                <span>No visual artifacts found</span>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-500">Analysis Completed</h4>
          <p className="text-sm text-gray-500">{result.processedAt}</p>
        </div>
      </div>
    </motion.div>
  );
};