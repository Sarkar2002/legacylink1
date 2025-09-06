import React, { useState } from 'react';
import type { AccessLevel } from '../types';
import Icon from './Icon';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accessLevel: AccessLevel) => void;
  memberName: string;
}

const accessOptions: { level: AccessLevel; title: string; description: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  {
    level: 'collaborator',
    title: 'Collaborator',
    description: 'Can view, edit, and help build the family tree.',
    icon: 'Users',
  },
  {
    level: 'contributor',
    title: 'Contributor',
    description: 'Can add memories, comments, and documents.',
    icon: 'Edit3',
  },
  {
    level: 'viewer',
    title: 'Viewer',
    description: 'Can only view the family tree and profiles.',
    icon: 'Eye',
  },
];

const PermissionsModal: React.FC<PermissionsModalProps> = ({ isOpen, onClose, onConfirm, memberName }) => {
  const [selectedLevel, setSelectedLevel] = useState<AccessLevel>('collaborator');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
      <div 
        className="bg-slate-900/80 backdrop-blur-lg w-full max-w-lg rounded-xl shadow-2xl border border-slate-700/50 p-8" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <Icon name="ShieldCheck" size={32} className="text-brand-gold" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 text-center mb-2">Set Access Level</h2>
        <p className="text-dark-text-secondary text-center mb-6">
          Choose what <strong className="text-slate-200">{memberName}</strong> can do in your family space.
        </p>
        
        <div className="space-y-3">
          {accessOptions.map(option => (
            <div
              key={option.level}
              onClick={() => setSelectedLevel(option.level)}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedLevel === option.level ? 'border-brand-gold bg-brand-gold/10' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <Icon name={option.icon} size={24} className={`mr-4 ${selectedLevel === option.level ? 'text-brand-gold' : 'text-slate-400'}`} />
              <div>
                <h3 className={`font-bold ${selectedLevel === option.level ? 'text-slate-100' : 'text-slate-200'}`}>{option.title}</h3>
                <p className="text-sm text-dark-text-secondary">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-4 mt-8">
          <button 
            onClick={onClose} 
            className="font-bold py-2 px-6 rounded-md transition-colors bg-slate-600 hover:bg-slate-500 text-slate-200"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(selectedLevel)} 
            className="font-bold py-2 px-6 rounded-md transition-colors bg-brand-blue-light hover:bg-brand-blue text-white flex items-center space-x-2"
          >
            <Icon name="Check" size={20} />
            <span>Confirm Connection</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal;