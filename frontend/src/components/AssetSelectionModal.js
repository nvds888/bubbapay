import React, { useState, useMemo } from 'react';
import { getSupportedAssets } from '../services/api';

function AssetSelectionModal({ isOpen, onClose, selectedAssetId, onAssetSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const supportedAssets = getSupportedAssets();

  // Filter assets based on search term
  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) {
      return supportedAssets;
    }

    const searchLower = searchTerm.toLowerCase();
    return supportedAssets.filter(asset => 
      asset.name.toLowerCase().includes(searchLower) ||
      asset.symbol.toLowerCase().includes(searchLower) ||
      asset.id.toString().includes(searchTerm) ||
      (asset.description && asset.description.toLowerCase().includes(searchLower))
    );
  }, [supportedAssets, searchTerm]);

  // Reset search when modal closes
  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-20 z-[60] pointer-events-none">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm w-full mx-4 pointer-events-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-base font-medium text-gray-900">Select Asset</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {filteredAssets.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No assets found matching "{searchTerm}"
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => {
                  onAssetSelect(asset.id, asset);
                  handleClose();
                }}
                className={`w-full p-3 text-left transition-colors border-b border-gray-50 last:border-b-0 hover:bg-gray-50 ${
                  selectedAssetId === asset.id
                    ? 'bg-purple-50 border-purple-100'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                    <div className="text-xs text-gray-500">{asset.id}</div>
                    {asset.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{asset.description}</div>
                    )}
                  </div>
                  {selectedAssetId === asset.id && (
                    <svg className="w-4 h-4 text-purple-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AssetSelectionModal;