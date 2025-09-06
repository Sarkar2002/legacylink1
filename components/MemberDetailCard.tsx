
import React, { useState, useEffect, useCallback } from 'react';
import type { FamilyMember, Document, DocumentType } from '../types';
import { generateMemory } from '../services/geminiService';
import Icon from './Icon';

interface MemberDetailCardProps {
  member: FamilyMember;
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (targetId: string, relationship: 'child' | 'spouse') => void;
}

const getDocumentIcon = (type: DocumentType): React.ComponentProps<typeof Icon>['name'] => {
    switch (type) {
        case 'Birth Certificate': return 'FileBadge';
        case 'Death Certificate': return 'FileClock';
        case 'Marriage Certificate': return 'FileHeart';
        default: return 'FileText';
    }
}

const MemberDetailCard: React.FC<MemberDetailCardProps> = ({ member, isOpen, onClose, onAddMember }) => {
  const [generatedMemory, setGeneratedMemory] = useState<string>('');
  const [isLoadingMemory, setIsLoadingMemory] = useState<boolean>(false);
  const [isMemoryGenerated, setIsMemoryGenerated] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
        setTimeout(() => {
            setGeneratedMemory('');
            setIsLoadingMemory(false);
            setIsMemoryGenerated(false);
            setGenerationError(null);
        }, 300);
    }
  }, [isOpen, member]);

  const handleGenerateMemory = async () => {
    setIsLoadingMemory(true);
    setGenerationError(null);
    setGeneratedMemory('');
    const memory = await generateMemory({
      name: member.name,
      birthDate: member.birthDate,
      deathDate: member.deathDate,
      profession: member.profession,
      birthPlace: member.birthPlace,
    });
    
    if (memory.startsWith('API Key not configured') || memory.startsWith('There was an error')) {
        setGenerationError(memory);
    } else {
        setGeneratedMemory(memory);
        setIsMemoryGenerated(true);
    }
    setIsLoadingMemory(false);
  };

  return (
    <div
      className={`absolute top-0 right-0 h-full w-full max-w-md bg-slate-900/70 backdrop-blur-lg shadow-2xl border-l-2 border-slate-700/50 transform transition-transform duration-300 ease-in-out z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 relative">
          <button onClick={handleClose} className="absolute top-4 right-4 text-dark-text-secondary hover:text-white transition-colors">
            <Icon name="X" size={24}/>
          </button>
          <div className="flex items-center space-x-5">
            <img src={member.imageUrl} alt={member.name} className="w-28 h-28 rounded-full object-cover border-4 border-brand-blue" />
            <div>
              <h2 className="text-3xl font-bold text-slate-100">{member.name}</h2>
              <p className="text-brand-gold text-lg">{member.profession}</p>
              <p className="text-dark-text-secondary">{member.birthDate} - {member.deathDate || 'Present'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-slate-200 flex items-center"><Icon name="BookUser" className="mr-2 text-brand-gold"/>AI Memory Generator</h3>
                    {isMemoryGenerated && !isLoadingMemory && !generationError && (
                         <button 
                            onClick={handleGenerateMemory} 
                            className="text-sm bg-slate-700/80 hover:bg-slate-600 text-slate-300 font-semibold py-1 px-3 rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <span className="text-lg">✨</span>
                            <Icon name="RefreshCw" size={14}/>
                            <span>Regenerate</span>
                        </button>
                    )}
                </div>
                
                {isLoadingMemory && <div className="text-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mx-auto"></div><p className="mt-2 text-slate-400">Weaving a memory...</p></div>}
                
                {generationError && !isLoadingMemory && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 text-center">
                        <Icon name="AlertTriangle" className="mx-auto mb-2 text-red-400" size={24} />
                        <p className="font-semibold">Could not generate memory</p>
                        <p className="text-xs mt-1">{generationError}</p>
                    </div>
                )}

                {generatedMemory && !isLoadingMemory && (
                  <p className="text-dark-text leading-relaxed italic">"{generatedMemory}"</p>
                )}
                
                {!isMemoryGenerated && !isLoadingMemory && !generationError && (
                    <div className="text-center p-4 border-2 border-dashed border-slate-600 rounded-lg">
                        <Icon name="Sparkles" className="mx-auto text-brand-gold mb-2" size={32}/>
                        <p className="text-slate-300 mb-3">Generate a first-person memory with AI.</p>
                        <button 
                            onClick={handleGenerateMemory} 
                            className="bg-brand-blue-light hover:bg-brand-blue text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                        >
                            <span className="text-lg">📜</span>
                            <Icon name="Wand2" size={16}/>
                            <span>Generate a Memory</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-6 bg-slate-800/50 p-4 rounded-lg">
                 <h3 className="text-xl font-semibold text-slate-200 mb-3 flex items-center"><Icon name="Users" className="mr-2 text-brand-gold"/>Family Actions</h3>
                 <div className="flex space-x-3">
                     <button
                        onClick={() => onAddMember(member.id, 'spouse')}
                        disabled={!!member.spouse}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                     >
                        <span className="text-lg">💍</span>
                        <Icon name="UserPlus" size={16}/>
                        <span>Add Spouse</span>
                     </button>
                      <button
                        onClick={() => onAddMember(member.id, 'child')}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                     >
                        <span className="text-lg">👶</span>
                        <Icon name="PlusCircle" size={16}/>
                        <span>Add Child</span>
                     </button>
                 </div>
            </div>

            <div className="mt-6">
                <h3 className="text-xl font-semibold text-slate-200 mb-3 flex items-center"><Icon name="FileText" className="mr-2 text-brand-gold"/>Certificates & Documents</h3>
                <ul className="space-y-3">
                     {member.documents?.map((doc, index) => (
                        <li key={doc.id || `doc-${index}`}>
                           <a href={doc.url} target="_blank" rel="noopener noreferrer" className="bg-slate-800/50 p-3 rounded-lg flex items-center hover:bg-slate-700 transition-colors cursor-pointer group/doc">
                                <Icon name={getDocumentIcon(doc.type)} className="text-slate-500 mr-4 flex-shrink-0" size={24}/>
                                <div className="flex-1">
                                    <p className="text-slate-300 font-medium">{doc.name}</p>
                                    <p className="text-sm text-dark-text-secondary">{doc.type}</p>
                                </div>
                                <Icon name="Download" className="ml-auto text-slate-500 group-hover/doc:text-brand-gold" size={18}/>
                            </a>
                        </li>
                    ))}
                    {(!member.documents || member.documents.length === 0) && (
                        <li className="bg-slate-800/50 p-4 rounded-lg text-center text-dark-text-secondary">
                            No documents added yet.
                        </li>
                    )}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailCard;