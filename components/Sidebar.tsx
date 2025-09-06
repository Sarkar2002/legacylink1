import React from 'react';
import type { View } from '../types';
import Icon from './Icon';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onShareTree: () => void;
}

const navItems: { view: View; label: string; icon: React.ComponentProps<typeof Icon>['name']; emoji: string }[] = [
  { view: 'tree', label: 'Family Tree', icon: 'GitFork', emoji: '🌳' },
  { view: 'notifications', label: 'Notifications', icon: 'Bell', emoji: '🔔' },
  { view: 'contacts', label: 'Contacts', icon: 'Contact', emoji: '📔' },
  { view: 'wall', label: 'Memory Wall', icon: 'Heart', emoji: '🖼️' },
  { view: 'vault', label: 'Digital Vault', icon: 'Vault', emoji: '📦' },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, setIsOpen, onShareTree }) => {
  const sidebarClasses = `
      bg-slate-900/70 backdrop-blur-lg flex flex-col border-r border-slate-700/50 
      transition-all duration-300 ease-in-out h-full z-30
      fixed top-0 left-0
      ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-20 md:translate-x-0'}
  `;

  return (
    <nav className={sidebarClasses}>
      <div className={`flex items-center mb-10 px-2 flex-shrink-0 transition-all duration-300 ${isOpen ? 'h-20' : 'h-20 justify-center'}`}>
         <div className={`flex items-center ${isOpen ? 'px-2' : 'md:px-4'}`}>
             <Icon name="TreePine" size={32} className="text-brand-gold flex-shrink-0" />
            <h1 className={`text-2xl font-bold ml-3 text-slate-100 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Legacy<span className="text-brand-gold">Link</span></h1>
         </div>
      </div>
      <ul className={`flex flex-col space-y-2 px-2 overflow-hidden`}>
        {navItems.map((item) => (
          <li key={item.view}>
            <button
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center p-3 rounded-lg text-left text-lg transition-colors duration-200 ${!isOpen && 'justify-center'} ${
                currentView === item.view
                  ? 'bg-brand-blue text-white shadow-lg'
                  : 'text-dark-text-secondary hover:bg-slate-700/50 hover:text-slate-100'
              }`}
            >
              <span className={`text-lg transition-opacity duration-200 ${isOpen ? 'opacity-100 mr-3' : 'opacity-0 w-0'}`}>{item.emoji}</span>
              <Icon name={item.icon} size={24} className={isOpen ? "mr-3" : "mr-0"} />
              <span className={`transition-opacity duration-200 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className={`mt-auto p-2 overflow-hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 h-0'}`}>
         <div className="bg-slate-800/60 p-4 rounded-lg text-center border border-slate-700">
            <Icon name="Users" size={40} className="mx-auto text-brand-gold mb-2"/>
            <h3 className="font-bold text-slate-200">Collaborate</h3>
            <p className="text-sm text-dark-text-secondary mt-1">Invite family members to grow your shared history.</p>
            <button 
                onClick={onShareTree}
                className="mt-3 w-full bg-brand-blue-light hover:bg-brand-blue text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <span className="text-lg">💌</span>
                <Icon name="MailPlus" size={18} />
                <span>Invite</span>
            </button>
         </div>
      </div>
    </nav>
  );
};

export default Sidebar;