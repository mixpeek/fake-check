import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Eye, Mic, Search, AlertTriangle } from 'lucide-react';

export const InfoSection: React.FC = () => {
  return (
    <section id="how-it-works" className="w-full bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900">How FakeCheck Works</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Our advanced AI technology detects deepfakes and AI-generated videos with high precision
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className={`p-3 rounded-full inline-flex items-center justify-center ${feature.iconBg}`}>
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-16 bg-primary-50 border border-primary-100 rounded-lg p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-start md:items-center flex-col md:flex-row">
            <div className="flex-shrink-0 p-3 rounded-full bg-primary-100 mb-4 md:mb-0 md:mr-6">
              <AlertTriangle className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-900">Why This Matters</h3>
              <p className="mt-1 text-primary-700">
                In an era where anyone can create convincing fake videos with free apps, protecting truth is critical. Whether you're a journalist verifying sources, a business protecting your brand, or someone concerned about impersonation - FakeCheck provides the verification layer the internet desperately needs.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const features = [
  {
    title: "Facial Pattern Analysis",
    description: "We analyze micro-expressions and facial consistency using advanced neural networks trained on millions of real and synthetic faces. Even the best deepfakes leave subtle statistical fingerprints.",
    icon: <Brain className="h-5 w-5 text-primary-600" />,
    iconBg: "bg-primary-100"
  },
  {
    title: "Natural Eye Movement Tracking",
    description: "Humans blink 15-20 times per minute with natural variation. AI-generated faces often show robotic patterns - too perfect, too regular, or completely absent. We catch these unnatural rhythms.",
    icon: <Eye className="h-5 w-5 text-secondary-600" />,
    iconBg: "bg-secondary-100"
  },
  {
    title: "Voice-Face Synchronization",
    description: "Our system checks if lip movements genuinely match the audio. Deepfakes often show tiny delays or mismatches that are invisible to the human eye but clear to our algorithms.",
    icon: <Mic className="h-5 w-5 text-warning-600" />,
    iconBg: "bg-warning-100"
  },
  {
    title: "Pixel-Level Artifact Detection",
    description: "We scan for compression artifacts, boundary inconsistencies, and temporal flickering that occur when AI tries to blend synthetic faces onto real videos.",
    icon: <Search className="h-5 w-5 text-error-600" />,
    iconBg: "bg-error-100"
  }
];