import React from 'react';
import { ScanFace, Github, Twitter, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center">
            <ScanFace className="h-6 w-6 text-primary-500" />
            <span className="ml-2 text-xl font-bold">FakeCheck</span>
          </div>
          <p className="mt-2 text-gray-400 text-sm">
            Advanced AI-powered deepfake detection for everyone. Helping combat misinformation in the digital age.
          </p>
          

          
          {/* Social Media Links */}
          <div className="mt-6 flex space-x-4 justify-center">
            <a 
              href="https://x.com/mixpeek" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              title="Follow us on Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a 
              href="https://github.com/mixpeek/fake-check" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              title="View on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-gray-400 text-sm text-center">
            © {currentYear}{' '}
            <a 
              href="https://mixpeek.com/contact" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Mixpeek
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}