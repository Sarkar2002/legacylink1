import React, { useMemo } from 'react';
// FIX: 'DocumentType' is an enum, which has a runtime representation, so it must not be imported as a type.
import type { Document, FamilyMember } from '../types';
import { DocumentType } from '../types';
import Icon from './Icon';

interface VaultDocument extends Document {
  memberId: string;
  memberName: string;
}

interface DigitalVaultProps {
  documents: VaultDocument[];
  onUploadClick: () => void;
  onDeleteClick: (memberId: string, docId: string) => void;
}

const getDocumentIcon = (type: DocumentType): React.ComponentProps<typeof Icon>['name'] => {
    switch (type) {
        case 'Birth Certificate': return 'FileBadge';
        case 'Death Certificate': return 'FileClock';
        case 'Marriage Certificate': return 'FileHeart';
        default: return 'FileText';
    }
};

const DigitalVault: React.FC<DigitalVaultProps> = ({ documents, onUploadClick, onDeleteClick }) => {
  const groupedDocuments = useMemo(() => {
    const groups: { [key in DocumentType]?: VaultDocument[] } = {};
    documents.forEach(doc => {
      if (!groups[doc.type]) {
        groups[doc.type] = [];
      }
      groups[doc.type]!.push(doc);
    });
    return groups;
  }, [documents]);

  const documentOrder: DocumentType[] = [
    DocumentType.BirthCertificate,
    DocumentType.MarriageCertificate,
    DocumentType.DeathCertificate,
    DocumentType.Other
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-slate-100">Digital Vault</h1>
          <p className="text-lg text-dark-text-secondary">A secure archive of your family's precious memories and documents.</p>
        </div>
        <button 
          onClick={onUploadClick}
          className="bg-brand-blue-light hover:bg-brand-blue text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Icon name="UploadCloud" size={20} />
          <span>Upload New Document</span>
        </button>
      </div>
      
      <div className="space-y-8">
        {documentOrder.map(groupType => {
          const docsInGroup = groupedDocuments[groupType];
          if (!docsInGroup || docsInGroup.length === 0) return null;

          return (
            <section key={groupType}>
              <h2 className="text-2xl font-semibold text-slate-200 border-b-2 border-slate-700 pb-2 mb-4 flex items-center">
                <Icon name={getDocumentIcon(groupType)} className="mr-3 text-brand-gold" />
                {groupType}s
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docsInGroup.map((doc) => (
                  <div key={doc.id} className="group relative bg-slate-900/70 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-4 flex items-center space-x-4">
                    <Icon name={getDocumentIcon(doc.type)} size={32} className="text-slate-500 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-100 truncate hover:underline" title={doc.name}>
                        {doc.name}
                      </a>
                      <p className="text-sm text-dark-text-secondary">
                        Belongs to: <span className="font-medium text-slate-400">{doc.memberName}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => onDeleteClick(doc.memberId, doc.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-800 text-slate-500 hover:bg-red-500/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete document"
                    >
                        <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {documents.length === 0 && (
             <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-xl">
                <Icon name="Vault" size={48} className="mx-auto text-slate-600"/>
                <h3 className="mt-4 text-xl font-semibold text-slate-300">Your Vault is Empty</h3>
                <p className="mt-1 text-dark-text-secondary">Upload your first document to start preserving your legacy.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default DigitalVault;