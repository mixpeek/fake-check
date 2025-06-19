import React from 'react';
import { motion } from 'framer-motion';
import { ScanFace, Github, ExternalLink } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <ScanFace className="h-8 w-8 text-primary-600" />
                <motion.div
                  className="absolute inset-0 bg-primary-400 rounded-full blur-lg opacity-30"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <span className="ml-3 text-2xl font-black text-gray-900 font-display">
                Fake<span className="text-gradient-primary">Check</span>
              </span>
            </motion.div>
            
            <nav className="hidden md:flex items-center space-x-8 ml-8">
              <motion.a
                href="#how-it-works"
                className="text-gray-600 hover:text-primary-600 text-sm font-semibold transition-colors relative group"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
              >
                How It Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-blue-600 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
              
              <motion.a
                href="https://github.com/mixpeek/fake-check"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors group"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
              >
                <Github className="h-5 w-5 group-hover:animate-bounce-subtle" />
                <span>GitHub</span>
              </motion.a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.a
              href="https://mixpeek.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              
              <span className="relative z-10">Build your Own</span>
              <ExternalLink className="h-4 w-4 relative z-10 group-hover:rotate-12 transition-transform duration-200" />
            </motion.a>
          </div>
        </div>
      </div>
    </header>
  );
};