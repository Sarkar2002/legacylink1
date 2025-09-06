import React, { useState, useRef } from 'react';
// FIX: 'DocumentType' is an enum, which has a runtime representation, so it must not be imported as a type.
import type { FamilyMember, Document } from '../types';
import { DocumentType } from '../types';
import Icon from './Icon';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memberId: string, docData: Omit<Document, 'id'>) => void;
  familyMembers: FamilyMember[];
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, onSubmit, familyMembers }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [docName, setDocName] = useState('');
  // FIX: Initialize state with the enum member `DocumentType.Other` instead of the string literal 'Other'.
  const [docType, setDocType] = useState<DocumentType>(DocumentType.Other);
  const [docFile, setDocFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useState(() => {
    if (familyMembers.length > 0) {
        setSelectedMemberId(familyMembers[0].id);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFile(file);
      setDocName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !docName.trim() || !selectedMemberId) {
        alert('Please select a family member, choose a file, and provide a name.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            const docData: Omit<Document, 'id'> = {
                name: docName.trim(),
                type: docType,
                url: event.target.result as string,
                fileType: docFile.type,
            };
            onSubmit(selectedMemberId, docData);
        }
    };
    reader.readAsDataURL(docFile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
      <div 
        className="bg-slate-900/80 backdrop-blur-lg w-full max-w-lg rounded-xl shadow-2xl border border-slate-700/50 p-8" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">Upload New Document</h2>
          <button onClick={onClose} className="text-dark-text-secondary hover:text-white transition-colors">
            <Icon name="X" size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="memberSelect" className="block text-sm font-medium text-dark-text-secondary mb-1">Associate with Family Member</label>
            <select
              id="memberSelect"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-brand-gold focus:border-brand-gold"
            >
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="docFile" className="block text-sm font-medium text-dark-text-secondary mb-1">Document File</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-blue-light"
            />
          </div>

          {docFile && (
            <>
              <div>
                <label htmlFor="docName" className="block text-sm font-medium text-dark-text-secondary mb-1">Document Name</label>
                <input 
                  type="text" 
                  id="docName" 
                  value={docName} 
                  onChange={(e) => setDocName(e.target.value)} 
                  required 
                  className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-brand-gold focus:border-brand-gold"
                />
              </div>

              <div>
                <label htmlFor="docType" className="block text-sm font-medium text-dark-text-secondary mb-1">Document Type</label>
                <select
                  id="docType"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-brand-gold focus:border-brand-gold"
                >
                  {Object.values(DocumentType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-slate-200 font-bold py-2 px-6 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-brand-blue-light hover:bg-brand-blue text-white font-bold py-2 px-6 rounded-lg transition-colors">
              Upload and Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;