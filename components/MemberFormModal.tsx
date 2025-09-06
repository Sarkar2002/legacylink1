import React, { useState, useEffect, useRef } from 'react';
import { FamilyMember, Document, DocumentType } from '../types';
import Icon from './Icon';
import AvatarChooserModal from './AvatarChooserModal';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memberData: Partial<Omit<FamilyMember, 'id' | 'children' | 'spouse'>> & { id?: string; documents?: Document[] }) => void;
  mode: 'add' | 'edit';
  relationship?: 'child' | 'spouse';
  initialData?: FamilyMember | FamilyMember['spouse'];
  isEditingSpouse?: boolean;
}

const MemberFormModal: React.FC<MemberFormModalProps> = ({ isOpen, onClose, onSubmit, mode, relationship, initialData, isEditingSpouse }) => {
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    birthDate: '',
    deathDate: '',
    profession: '',
    birthPlace: '',
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAvatarChooserOpen, setIsAvatarChooserOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<DocumentType>(DocumentType.Other);
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          name: initialData.name,
          imageUrl: initialData.imageUrl,
          birthDate: initialData.birthDate || '',
          deathDate: initialData.deathDate || '',
          profession: initialData.profession || '',
          birthPlace: initialData.birthPlace || '',
        });
        setDocuments(initialData.documents || []);
      } else { // 'add' mode
        setFormData({ name: '', imageUrl: '', birthDate: '', deathDate: '', profession: '', birthPlace: '' });
        setDocuments([]);
      }
      setNewDocName('');
      setNewDocType(DocumentType.Other);
      setNewDocFile(null);
    }
  }, [isOpen, mode, initialData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleAvatarSelect = (avatarUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl: avatarUrl }));
    setIsAvatarChooserOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, imageUrl: event.target.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewDocFile(file);
      setNewDocName(file.name.replace(/\.[^/.]+$/, "")); // Set name from filename without extension
    }
  };
  
  const handleAddDocument = () => {
    if (!newDocFile || !newDocName.trim()) {
        alert('Please select a file and provide a name for the document.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            const newDocument: Document = {
                id: `doc-${Date.now()}`,
                name: newDocName.trim(),
                type: newDocType,
                url: event.target.result as string,
                fileType: newDocFile.type,
            };
            setDocuments(prev => [...prev, newDocument]);
            // Reset form
            setNewDocFile(null);
            setNewDocName('');
            setNewDocType(DocumentType.Other);
            if(docFileInputRef.current) docFileInputRef.current.value = "";
        }
    };
    reader.readAsDataURL(newDocFile);
  };
  
  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate) {
        alert("Please fill in at least the name and birth date.");
        return;
    }
    const { deathDate, profession, birthPlace, ...rest } = formData;
    const submissionData: any = {...rest, documents};
    if (deathDate) submissionData.deathDate = deathDate;
    if (profession) submissionData.profession = profession;
    if (birthPlace) submissionData.birthPlace = birthPlace;
    
    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  const title = mode === 'edit'
    ? (isEditingSpouse ? `Edit Spouse` : `Edit ${initialData?.name || 'Member'}`)
    : (relationship === 'spouse' ? 'Add a New Spouse' : 'Add a New Child');

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
        <div
          className="bg-slate-900/80 backdrop-blur-lg w-full max-w-lg rounded-xl shadow-2xl border border-slate-700/50 p-8 flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: '90vh' }}
        >
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
            <button onClick={onClose} className="text-dark-text-secondary hover:text-white transition-colors">
              <Icon name="X" size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="overflow-y-auto pr-4 -mr-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group cursor-pointer" onClick={handleUploadClick}>
                <img
                  src={formData.imageUrl || `https://api.dicebear.com/8.x/micah/svg?seed=${formData.name || 'placeholder'}&radius=50`}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-600 group-hover:border-glow-cyan transition-colors"
                />
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="Upload" size={24} className="text-white" />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  <span className="text-lg">📤</span>
                  <Icon name="Upload" size={16} />
                  <span>Upload Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAvatarChooserOpen(true)}
                  className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  <span className="text-lg">🎨</span>
                  <Icon name="Smile" size={16} />
                  <span>Choose Avatar</span>
                </button>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            {/* Basic Info */}
            <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2">Basic Information</h3>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-dark-text-secondary mb-1">Full Name *</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-glow-cyan focus:border-glow-cyan" placeholder="e.g., Rohan Singh" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-dark-text-secondary mb-1">Date of Birth *</label>
                <input type="date" name="birthDate" id="birthDate" value={formData.birthDate} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-glow-cyan focus:border-glow-cyan" />
              </div>
              <div>
                <label htmlFor="deathDate" className="block text-sm font-medium text-dark-text-secondary mb-1">Date of Death (if applicable)</label>
                <input type="date" name="deathDate" id="deathDate" value={formData.deathDate} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-glow-cyan focus:border-glow-cyan" />
              </div>
            </div>
            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-dark-text-secondary mb-1">Profession</label>
              <input type="text" name="profession" id="profession" value={formData.profession} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-glow-cyan focus:border-glow-cyan" placeholder="e.g., Farmer, Scholar" />
            </div>
            <div>
              <label htmlFor="birthPlace" className="block text-sm font-medium text-dark-text-secondary mb-1">Place of Birth</label>
              <input type="text" name="birthPlace" id="birthPlace" value={formData.birthPlace} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-glow-cyan focus:border-glow-cyan" placeholder="e.g., Rajpur, India" />
            </div>

            {/* Document Management */}
            <div className="pt-4">
              <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">Certificates & Documents</h3>
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center bg-slate-800/70 p-2 rounded-md">
                    <Icon name="FileText" size={20} className="text-slate-400 mr-3 flex-shrink-0" />
                    <p className="flex-1 text-sm text-slate-200 truncate" title={doc.name}>{doc.name}</p>
                    <button type="button" onClick={() => handleDeleteDocument(doc.id)} className="p-1 text-slate-500 hover:text-red-500" aria-label="Delete document">
                        <Icon name="Trash2" size={16}/>
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-slate-800 border border-dashed border-slate-600 rounded-lg space-y-3">
                <p className="text-sm font-medium text-slate-300">Add New Document</p>
                <div className="flex items-center space-x-2">
                   <input type="file" ref={docFileInputRef} onChange={handleDocFileChange} className="w-full text-sm text-slate-400 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-blue-light"/>
                </div>
                {newDocFile && (
                    <div className="space-y-2 animate-fade-in">
                       <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="Document Name" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-glow-cyan focus:border-glow-cyan"/>
                       <select value={newDocType} onChange={(e) => setNewDocType(e.target.value as DocumentType)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-glow-cyan focus:border-glow-cyan">
                         {Object.values(DocumentType).map(type => <option key={type} value={type}>{type}</option>)}
                       </select>
                       <button type="button" onClick={handleAddDocument} className="w-full bg-brand-blue-light/50 hover:bg-brand-blue-light/80 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2">
                         <Icon name="Plus" size={16}/>
                         <span>Attach Document</span>
                       </button>
                    </div>
                )}
              </div>
            </div>


            <div className="flex justify-end space-x-4 pt-4 flex-shrink-0">
              <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-slate-200 font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <span className="text-lg">❌</span>
                <Icon name="X" size={18} />
                <span>Cancel</span>
              </button>
              <button type="submit" className="bg-brand-blue-light hover:bg-brand-blue text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center space-x-2">
                <span className="text-lg">💾</span>
                <Icon name="Save" size={18} />
                <span>{mode === 'edit' ? 'Save Changes' : 'Add Member'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      <AvatarChooserModal
        isOpen={isAvatarChooserOpen}
        onClose={() => setIsAvatarChooserOpen(false)}
        onSelect={handleAvatarSelect}
      />
    </>
  );
};

export default MemberFormModal;