import React from 'react';
import { ScanFace, Github, ExternalLink } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <ScanFace className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">FakeCheck</span>
            <nav className="hidden md:flex items-center space-x-6 ml-6">
              <a
                href="#how-it-works"
                className="text-gray-500 hover:text-gray-900 text-sm font-medium"
              >
                How It Works
              </a>
              <a
                href="https://github.com/mixpeek/fake-check"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                <Github className="h-5 w-5" />
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://mixpeek.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              <span>Contact Us</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};