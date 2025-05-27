import React from 'react';
import { motion } from 'framer-motion';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { DetectionResult } from './components/DetectionResult';
import { HistorySection } from './components/HistorySection';
import { InfoSection } from './components/InfoSection';
import { Footer } from './components/Footer';
import { useVideoDetection } from './hooks/useVideoDetection';
import { cn } from './lib/utils';

function App() {
  const {
    currentVideo,
    history,
    isProcessing,
    handleFileSelect,
    resetCurrentVideo
  } = useVideoDetection();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Hero Section */}
          <motion.section 
            className="text-center py-12 md:py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
              Spot AI-Generated Videos in Seconds
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              Our multi-layered AI detection system analyzes facial patterns, eye movements, and visual artifacts to verify video authenticity with scientific precision.
            </p>
          </motion.section>
          
          {/* Upload and Results Section */}
          <div className="flex flex-col items-center">
            <UploadSection
              currentVideo={currentVideo}
              onFileSelect={handleFileSelect}
              onReset={resetCurrentVideo}
              isProcessing={isProcessing}
            />
            
            {currentVideo?.status === 'completed' && currentVideo.result && (
              <motion.div 
                className="w-full max-w-3xl mx-auto px-4 pb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <DetectionResult result={currentVideo.result} />
              </motion.div>
            )}
            
            <HistorySection history={history} />
          </div>
          
          {/* Info Section */}
          <InfoSection />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;