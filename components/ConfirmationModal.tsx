
import React from 'react';
import Icon from './Icon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
      <div 
        className="bg-slate-900/80 backdrop-blur-lg w-full max-w-md rounded-xl shadow-2xl border border-slate-700/50 p-8 text-center animate-fade-in-down" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-500/20 rounded-full border-2 border-red-500/50">
            <Icon name="AlertTriangle" size={32} className="text-red-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">{title}</h2>
        <p className="text-dark-text-secondary mb-8">{message}</p>
        
        <div className="flex justify-center space-x-4">
          <button 
            onClick={onClose} 
            className="font-bold py-2 px-6 rounded-md transition-colors bg-slate-600 hover:bg-slate-500 text-slate-200 flex items-center justify-center space-x-2"
          >
            <span className="text-lg">❌</span>
            <Icon name="X" size={20} />
            <span>Cancel</span>
          </button>
          <button 
            onClick={handleConfirm} 
            className="font-bold py-2 px-6 rounded-md transition-colors bg-red-600 hover:bg-red-700 text-white flex items-center justify-center space-x-2"
          >
            <span className="text-lg">🗑️</span>
            <Icon name="Trash2" size={20} />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
