
import React from 'react';
import Icon from './Icon';

interface AddMemberRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (relationship: 'child' | 'spouse') => void;
  targetName: string;
  hasSpouse: boolean;
}

const AddMemberRelationshipModal: React.FC<AddMemberRelationshipModalProps> = ({ isOpen, onClose, onSelect, targetName, hasSpouse }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
      <div 
        className="bg-slate-900/80 backdrop-blur-lg w-full max-w-md rounded-xl shadow-2xl border border-slate-700/50 p-8 text-center" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
            <Icon name="UserPlus" size={32} className="text-brand-gold" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Add a New Member</h2>
        <p className="text-dark-text-secondary mb-6">
          How is the new member related to <strong className="text-slate-200">{targetName}</strong>?
        </p>
        
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => onSelect('child')}
            className="w-full text-left flex items-center p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
          >
            <span className="text-2xl mr-4">👶</span>
            <Icon name="PlusCircle" className="mr-4 text-brand-gold" size={24}/>
            <div>
              <p className="font-bold text-slate-100">Add as a Child</p>
              <p className="text-sm text-dark-text-secondary">Create a new generation in the family tree.</p>
            </div>
          </button>
          
          <button 
            onClick={() => onSelect('spouse')}
            disabled={hasSpouse}
            className="w-full text-left flex items-center p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-2xl mr-4">💍</span>
            <Icon name="Users" className="mr-4 text-brand-gold" size={24}/>
            <div>
              <p className="font-bold text-slate-100">Add as a Spouse</p>
              <p className="text-sm text-dark-text-secondary">
                {hasSpouse ? "A spouse already exists." : "Connect a partner to this member."}
              </p>
            </div>
          </button>
        </div>
        
        <button 
          onClick={onClose} 
          className="mt-8 bg-slate-600 hover:bg-slate-500 text-slate-200 font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
            <span className="text-lg">❌</span>
            <Icon name="X" size={20} />
            <span>Cancel</span>
        </button>
      </div>
    </div>
  );
};

export default AddMemberRelationshipModal;