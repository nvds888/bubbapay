import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="relative mt-20">
      {/* Gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      
      {/* Footer content */}
      <div className="bg-black/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 lg:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Brand section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">
                  Nomizo <span className="gradient-text">Pay</span>
                </span>
              </div>
              <p className="text-gray-400 max-w-md mb-6">
                Send USDC instantly on Algorand. Fast, secure, and user-friendly payments for everyone.
              </p>
              
              {/* Social links */}
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/" className="text-gray-400 hover:text-purple-300 transition-colors duration-300">Send USDC</Link></li>
                <li><Link to="/transactions" className="text-gray-400 hover:text-purple-300 transition-colors duration-300">Transaction History</Link></li>
                <li><Link to="/docs" className="text-gray-400 hover:text-purple-300 transition-colors duration-300">Technical Docs</Link></li>
              </ul>
            </div>
            
            {/* Support links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-purple-300 transition-colors duration-300">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-purple-300 transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-purple-300 transition-colors duration-300">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom section */}
          <div className="border-t border-purple-500/20 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Nomizo Pay. All rights reserved.
              </p>
              
              {/* Powered by section */}
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Powered by</span>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-purple-300 font-medium">Algorand</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;