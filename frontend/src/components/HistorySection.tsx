import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistorySectionProps {
  history: HistoryItem[];
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history }) => {
  if (history.length === 0) return null;

  return (
    <motion.section
      className="w-full max-w-3xl mx-auto px-4 py-8 border-t border-gray-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center mb-6">
        <Clock className="h-5 w-5 text-gray-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Previously Analyzed Videos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map((item) => (
          <motion.div 
            key={item.id}
            className="card flex overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-1/3 bg-gray-100 flex items-center justify-center overflow-hidden">
              <img
                src={item.thumbnailUrl}
                alt={item.filename}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="w-2/3 p-4">
              <div className="flex items-center">
                {item.result.isReal ? (
                  <CheckCircle className="h-4 w-4 text-success-500 mr-1.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-error-500 mr-1.5" />
                )}
                <p className="text-sm font-medium truncate">
                  {item.filename}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {item.analyzedAt}
              </p>
              <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.result.isReal 
                    ? 'bg-success-100 text-success-800'
                    : 'bg-error-100 text-error-800'
                }`}>
                  {item.result.isReal ? 'Real' : 'AI Generated'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};