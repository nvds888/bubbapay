import React from 'react';
import { getSupportedAssets } from '../services/api';

function AssetSelectionModal({ isOpen, onClose, selectedAssetId, onAssetSelect }) {
  const supportedAssets = getSupportedAssets();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-20 z-[60] pointer-events-none">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm w-full mx-4 pointer-events-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-base font-medium text-gray-900">Select Asset</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {supportedAssets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => {
                onAssetSelect(asset.id, asset);
                onClose();
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default AssetSelectionModal;