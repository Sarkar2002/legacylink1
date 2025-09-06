import React from 'react';
import Icon from './Icon';

interface AvatarChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
}

// A curated list of seeds inspired by the user's image to generate thematic, illustrative avatars.
const avatarSeeds = [
  'GreatGrandmother', 'GreatGrandfather', 'Grandmother', 'Grandfather',
  'Mother', 'Father', 'Aunt', 'Uncle',
  'Me', 'Husband', 'Wife', 'Brother',
  'Sister', 'Cousin', 'Daughter', 'Son',
  'Niece', 'Nephew', 'BabyGirl', 'BabyBoy',
  'YoungMan', 'YoungWoman', 'ElderMan', 'ElderWoman'
];

// Using the 'micah' style from Dicebear for a more colorful, illustrative look that matches the user's provided image.
const avatarUrls = avatarSeeds.map(seed => 
  `https://api.dicebear.com/8.x/micah/svg?seed=${seed}`
);

const AvatarChooserModal: React.FC<AvatarChooserModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
      <div 
        className="bg-slate-900/80 backdrop-blur-lg w-full max-w-2xl rounded-xl shadow-2xl border border-slate-700/50 p-8 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '80vh' }}
      >
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-100">Choose an Avatar</h2>
          <button onClick={onClose} className="text-dark-text-secondary hover:text-white transition-colors">
            <Icon name="X" size={24}/>
          </button>
        </div>
        <div className="overflow-y-auto pr-4 -mr-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            {avatarUrls.map((url, index) => (
                <div key={index} className="aspect-square bg-slate-800 rounded-lg p-2 cursor-pointer hover:bg-slate-700 hover:ring-2 hover:ring-glow-cyan transition-all" onClick={() => onSelect(url)}>
                    <img 
                        src={url} 
                        alt={`Avatar ${index + 1}`} 
                        className="w-full h-full object-cover rounded-md"
                    />
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarChooserModal;