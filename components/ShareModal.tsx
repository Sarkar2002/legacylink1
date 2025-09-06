
import React, { useState, useEffect } from 'react';
import Icon from './Icon';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'tree' | 'wall' | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, contentType }) => {
  const [shareLink, setShareLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen && contentType) {
      // Generate a simulated unique link
      const uniqueId = `share_${new Date().getTime()}`;
      const link = `${window.location.origin}${window.location.pathname}?view=${contentType}&shareId=${uniqueId}#readonly`;
      setShareLink(link);
    }
  }, [isOpen, contentType]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    });
  };

  if (!isOpen) return null;

  const title = contentType === 'tree' ? 'Share Your Family Tree' : 'Share Your Memory Wall';
  const description = "Share this private, read-only link with your relatives. They won't be able to make any changes.";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
      <div 
        className="bg-slate-900/80 backdrop-blur-lg w-full max-w-lg rounded-xl shadow-2xl border border-slate-700/50 p-8 text-center" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-brand-blue/20 rounded-full border-2 border-brand-blue/50">
            <Icon name="Link" size={32} className="text-brand-gold" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">{title}</h2>
        <p className="text-dark-text-secondary mb-6">{description}</p>
        
        <div className="flex items-center bg-slate-800 border border-slate-600 rounded-md p-2">
          <input 
            type="text" 
            readOnly 
            value={shareLink} 
            className="flex-1 bg-transparent text-slate-300 border-none focus:ring-0 text-sm"
          />
          <button 
            onClick={handleCopyLink} 
            className={`font-bold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center space-x-2 ${isCopied ? 'bg-green-500 text-white' : 'bg-brand-blue-light hover:bg-brand-blue text-white'}`}
          >
            <span className="text-lg">{isCopied ? '✅' : '📋'}</span>
            <Icon name={isCopied ? "Check" : "Copy"} size={16} />
            <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
        
        <button 
          onClick={onClose} 
          className="mt-8 bg-slate-600 hover:bg-slate-500 text-slate-200 font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <span className="text-lg">👍</span>
          <Icon name="Check" size={20} />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};

export default ShareModal;