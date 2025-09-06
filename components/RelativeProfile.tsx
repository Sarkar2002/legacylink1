import React from 'react';
import type { FamilyMember, AccessLevel } from '../types';
import Icon from './Icon';

interface RelativeProfileProps {
  member: FamilyMember;
  onSendRequest: (memberId: string) => void;
}

const getAccessLevelInfo = (level: AccessLevel | undefined) => {
    switch (level) {
        case 'collaborator':
            return { label: 'Collaborator', icon: 'Users', color: 'bg-green-500/20 text-green-400' };
        case 'contributor':
            return { label: 'Contributor', icon: 'Edit3', color: 'bg-yellow-500/20 text-yellow-400' };
        case 'viewer':
            return { label: 'Viewer', icon: 'Eye', color: 'bg-blue-500/20 text-blue-400' };
        default:
            return null;
    }
}

const RelativeProfile: React.FC<RelativeProfileProps> = ({ member, onSendRequest }) => {
  
  const accessInfo = getAccessLevelInfo(member.accessLevel);
  
  const renderActionButton = () => {
    switch (member.relationshipStatus) {
      case 'not_connected':
        return (
          <button
            onClick={() => onSendRequest(member.id)}
            className="bg-brand-blue-light hover:bg-brand-blue text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span className="text-lg">➕</span>
            <Icon name="UserPlus" size={20} />
            <span>Send Family Request</span>
          </button>
        );
      case 'pending_sent':
        return (
          <button
            disabled
            className="bg-slate-600 text-slate-300 font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 cursor-not-allowed"
          >
            <Icon name="Clock" size={20} />
            <span>Request Pending</span>
          </button>
        );
      case 'connected':
        return (
          <div className="flex items-center space-x-4">
            <div className="bg-green-600/20 text-green-400 font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2">
                <Icon name="Check" size={20} />
                <span>Connected</span>
            </div>
            {accessInfo && (
                <div className={`font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 text-sm ${accessInfo.color}`}>
                    <Icon name={accessInfo.icon as any} size={16} />
                    <span>{accessInfo.label}</span>
                </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 animate-fade-in">
      <div className="max-w-2xl mx-auto bg-slate-900/70 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-8 flex flex-col items-center">
        <img 
          src={member.imageUrl} 
          alt={member.name} 
          className="w-32 h-32 rounded-full object-cover border-4 border-brand-gold shadow-lg mb-4"
        />
        <h2 className="text-3xl font-bold text-slate-100">{member.name}</h2>
        <p className="text-dark-text-secondary mt-1">{member.profession}</p>
        <p className="text-sm text-slate-500">{member.birthDate} - {member.deathDate || 'Present'}</p>
        
        <div className="w-full mt-8 border-t border-slate-700 pt-8 flex justify-center">
            {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default RelativeProfile;