import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="relative mt-16">
      {/* Simple border */}
      <div className="h-px bg-gray-200"></div>
      
      {/* Footer content */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Brand section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                     style={{background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)'}}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  Nomizo<span className="gradient-text">Pay</span>
                </span>
              </div>
              <p className="text-gray-600 max-w-md mb-4 text-sm">
                Send USDC to anyone, anywhere, anytime. User-friendly payments on Algorand.
              </p>
              
              {/* Social links - minimal */}
              <div className="flex space-x-3">
                <a href="#" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors duration-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick links */}
            <div>
              <h3 className="text-gray-900 font-medium mb-3 text-sm">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Send USDC</Link></li>
                <li><Link to="/transactions" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Transaction History</Link></li>
                <li><Link to="/docs" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Technical Docs</Link></li>
              </ul>
            </div>
            
            {/* Support links */}
            <div>
              <h3 className="text-gray-900 font-medium mb-3 text-sm">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom section */}
          <div className="border-t border-gray-200 mt-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Nomizo Pay. All rights reserved.
              </p>
              
              {/* Powered by section */}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Powered by</span>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-purple-600 font-medium">Algorand Testnet</span>
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