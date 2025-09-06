import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { FamilyMember, CallType } from '../types';
import Icon from './Icon';

interface ContactsProps {
  familyMembers: FamilyMember[];
  onInitiateCall: (member: FamilyMember, type: CallType) => void;
  onInitiateGroupCall: (members: FamilyMember[], type: CallType) => void;
}

const Contacts: React.FC<ContactsProps> = ({ familyMembers, onInitiateCall, onInitiateGroupCall }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<FamilyMember[]>([]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return familyMembers;
    return familyMembers.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, familyMembers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCallClick = (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation();
    setActiveMenu(prev => (prev === memberId ? null : memberId));
  };
  
  const handleCallTypeSelect = (member: FamilyMember, type: CallType) => {
    onInitiateCall(member, type);
    setActiveMenu(null);
  };

  const toggleGroupMode = () => {
    setIsGroupMode(!isGroupMode);
    setSelectedMembers([]);
  };

  const toggleMemberSelection = (member: FamilyMember) => {
    setSelectedMembers(prevSelected => {
      if (prevSelected.some(m => m.id === member.id)) {
        return prevSelected.filter(m => m.id !== member.id);
      } else {
        return [...prevSelected, member];
      }
    });
  };

  const handleStartGroupCall = () => {
    onInitiateGroupCall(selectedMembers, 'video');
    toggleGroupMode();
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-slate-100">Family Contacts</h1>
          <p className="text-lg text-dark-text-secondary">Connect with your loved ones instantly.</p>
        </div>
        <button
          onClick={toggleGroupMode}
          className={`font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 ${isGroupMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand-blue-light hover:bg-brand-blue text-white'}`}
        >
          <Icon name={isGroupMode ? 'X' : 'Users'} size={18} />
          <span>{isGroupMode ? 'Cancel Group Call' : 'Start Group Call'}</span>
        </button>
      </div>
      
      <div className="mb-8 max-w-md">
        <div className="relative">
          <Icon name="Search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
          <input
            type="text"
            placeholder="Search contacts by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg pl-12 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all"
          />
        </div>
      </div>

      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredMembers.map((member) => {
              const isSelected = selectedMembers.some(m => m.id === member.id);
              return (
              <div 
                key={member.id} 
                className={`group bg-slate-900/70 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-4 flex flex-col items-center text-center transition-all duration-300 hover:scale-105 ${isGroupMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-brand-gold' : 'hover:border-brand-gold'}`}
                onClick={isGroupMode ? () => toggleMemberSelection(member) : undefined}
              >
                {isGroupMode && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center">
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-gold"></div>}
                  </div>
                )}
                <img src={member.imageUrl} alt={member.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 group-hover:border-brand-blue transition-colors" />
                <h3 className="font-bold text-slate-100 mt-4 truncate w-full">{member.name}</h3>
                {member.birthDate !== 'N/A' && <p className="text-sm text-dark-text-secondary">{member.birthDate.substring(0,4)}</p>}
                {!isGroupMode && (
                  <div className="relative w-full mt-4">
                  <button 
                      onClick={(e) => handleCallClick(e, member.id)}
                      className="w-full bg-brand-blue-light hover:bg-brand-blue text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                      <span className="text-lg">📞</span>
                      <Icon name="Phone" size={16} />
                      <span>Call</span>
                  </button>
                  {activeMenu === member.id && (
                      <div ref={menuRef} className="absolute bottom-full mb-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 animate-fade-in-down overflow-hidden">
                      <button onClick={() => handleCallTypeSelect(member, 'video')} className="w-full flex items-center justify-center text-left p-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors space-x-3">
                          <span className="text-lg">📹</span>
                          <Icon name="Video" size={16} className="text-brand-gold"/>
                          <span>Video Call</span>
                      </button>
                      <button onClick={() => handleCallTypeSelect(member, 'audio')} className="w-full flex items-center justify-center text-left p-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors border-t border-slate-700 space-x-3">
                          <span className="text-lg">🎙️</span>
                          <Icon name="Mic" size={16} className="text-brand-gold"/>
                          <span>Audio Call</span>
                      </button>
                      </div>
                  )}
                  </div>
                )}
              </div>
            )})}
        </div>
      ) : (
        <div className="text-center py-16">
            <Icon name="UserX" size={48} className="mx-auto text-slate-600"/>
            <h3 className="mt-4 text-xl font-semibold text-slate-300">No Members Found</h3>
            <p className="mt-1 text-dark-text-secondary">Your search for "{searchTerm}" did not match any family members.</p>
        </div>
      )}

      {isGroupMode && selectedMembers.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md z-40 animate-fade-in-down">
          <div className="bg-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl shadow-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 overflow-hidden">
              {selectedMembers.slice(0, 5).map(member => (
                <img key={member.id} src={member.imageUrl} alt={member.name} className="w-10 h-10 rounded-full" />
              ))}
              {selectedMembers.length > 5 && (
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                  +{selectedMembers.length - 5}
                </div>
              )}
            </div>
            <button 
              onClick={handleStartGroupCall}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 flex-shrink-0"
            >
              <Icon name="Video" size={18} />
              <span>Start Call ({selectedMembers.length})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;