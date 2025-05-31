import React from 'react';
import { Github, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <span>Built with</span>
          <Heart className="w-4 h-4 text-red-500 fill-current" />
          <span>by</span>
          <a 
            href="https://github.com/harshAdv10080" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Harsh Bhanushali
          </a>
        </div>
        
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/harshAdv10080/ai-chatbot-mern"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>View Source</span>
          </a>
          
          <span className="text-gray-500 dark:text-gray-500">
            © 2024 Harsh Bhanushali
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
