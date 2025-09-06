import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import type { FamilyMember, User, View, Notification } from '../types';

interface HeaderProps {
  notifications: Notification[];
  onMarkAsRead: () => void;
  onToggleSidebar: () => void;
  isOpen: boolean;
  canGoBack: boolean;
  onGoBack: () => void;
  searchQuery: string;
  searchResults: FamilyMember[];
  onSearchChange: (query: string) => void;
  onMemberSelect: (memberId: string) => void;
  onLogout: () => void;
  currentUser: User;
  onProfileOpenChange: (isOpen: boolean) => void;
  onNavigate: (view: View) => void;
  onNotificationClick: (notification: Notification) => void;
}

const Header: React.FC<HeaderProps> = ({ notifications, onMarkAsRead, onToggleSidebar, isOpen, canGoBack, onGoBack, searchQuery, searchResults, onSearchChange, onMemberSelect, onLogout, currentUser, onProfileOpenChange, onNavigate, onNotificationClick }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    onProfileOpenChange(isProfileOpen);
  }, [isProfileOpen, onProfileOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    if (isProfileOpen || isNotificationsOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen, isNotificationsOpen]);
  
  const handleBellClick = () => {
    setIsNotificationsOpen(prev => !prev);
    if (!isNotificationsOpen && unreadCount > 0) {
        onMarkAsRead();
    }
  };
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch(type) {
        case 'family_request': return 'UserPlus';
        case 'request_accepted': return 'UserCheck';
        case 'new_connection': return 'Link';
        case 'comment': return 'MessageSquare';
        case 'like': return 'Heart';
        case 'tree_update': return 'GitFork';
        case 'new_post': return 'Newspaper';
        case 'birthday': return 'Gift';
        default: return 'Bell';
    }
  };

  return (
    <header className="relative z-20 h-20 bg-slate-900/50 backdrop-blur-lg flex-shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-slate-700/50">
      <div className="flex items-center">
        {canGoBack && (
            <button onClick={onGoBack} className="text-dark-text-secondary hover:text-white mr-4" aria-label="Go Back">
                <Icon name="ArrowLeft" size={28}/>
            </button>
        )}
        <button onClick={onToggleSidebar} className="text-dark-text-secondary hover:text-white mr-4">
            <Icon name={isOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={28}/>
        </button>
        <div className="hidden lg:block text-dark-text-secondary">
            <p className="text-lg">Welcome to Digital Heritage</p>
        </div>
      </div>
      <div className="flex items-center space-x-4 md:space-x-6">
        <div className="relative" ref={searchRef}>
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-lg">🔍</span>
            <input
                type="text"
                placeholder="Search for relatives..."
                value={searchQuery}
                onChange={(e) => {
                    onSearchChange(e.target.value);
                    setIsSearchOpen(e.target.value.length > 0);
                }}
                onFocus={() => setIsSearchOpen(searchQuery.length > 0)}
                className="w-64 bg-slate-800/80 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all"
            />
            {isSearchOpen && (
                <div className="absolute top-full mt-2 w-full bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-2xl z-50 animate-fade-in-down max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
                    {searchResults.length > 0 ? (
                        <ul>
                            {searchResults.map(member => (
                                <li key={member.id}>
                                    <button
                                        onClick={() => {
                                            onMemberSelect(member.id);
                                            setIsSearchOpen(false);
                                        }}
                                        className="w-full flex items-center p-3 text-left hover:bg-slate-700/50 transition-colors"
                                    >
                                        <img src={member.imageUrl} alt={member.name} className="w-9 h-9 rounded-full mr-3"/>
                                        <div>
                                            <p className="font-semibold text-slate-200 text-sm">{member.name}</p>
                                            {member.birthDate !== 'N/A' && <p className="text-xs text-dark-text-secondary">{member.birthDate}</p>}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-4 text-center text-sm text-dark-text-secondary">No members found.</p>
                    )}
                </div>
            )}
        </div>
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={handleBellClick}
            className="relative text-dark-text-secondary hover:text-slate-100 transition-colors"
            aria-haspopup="true"
            aria-expanded={isNotificationsOpen}
          >
            <Icon name="Bell" size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-3 w-80 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-2xl z-50 animate-fade-in-down">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-semibold text-slate-100">Notifications</h3>
                <button onClick={() => onNavigate('notifications')} className="text-sm text-brand-gold hover:underline">View All</button>
              </div>
              <ul className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map(notif => (
                    <li key={notif.id}>
                      <button onClick={() => onNotificationClick(notif)} className={`w-full flex items-start p-3 text-left hover:bg-slate-700/50 transition-colors ${!notif.isRead && 'bg-brand-blue/20'}`}>
                        <Icon name={getNotificationIcon(notif.type)} className="w-5 h-5 text-brand-gold mr-3 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-200">
                              <span className="font-bold">{notif.actor.name}</span> {notif.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{notif.timestamp}</p>
                        </div>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center text-dark-text-secondary text-sm">No new notifications.</li>
                )}
              </ul>
            </div>
          )}
        </div>
        <div className="relative" ref={profileRef}>
          <button onClick={() => setIsProfileOpen(prev => !prev)} className="flex items-center space-x-3 group" aria-haspopup="true" aria-expanded={isProfileOpen}>
            <img src={currentUser.imageUrl} alt="User" className="w-10 h-10 rounded-full border-2 border-brand-blue group-hover:border-brand-gold transition-colors" />
            <div className="hidden md:block text-left">
              <p className="font-semibold text-slate-200">{currentUser.name}</p>
              <p className="text-sm text-dark-text-secondary">My Profile</p>
            </div>
            <Icon name="ChevronDown" size={16} className={`text-dark-text-secondary transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>
          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-3 w-56 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-2xl z-50 animate-fade-in-down overflow-hidden">
              <div className="p-2">
                <button
                    onClick={() => {
                        onNavigate('profile');
                        setIsProfileOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-slate-200 rounded-md hover:bg-slate-700 transition-colors space-x-3"
                >
                  <span className="text-lg">👤</span>
                  <Icon name="UserCircle" size={16} className="text-brand-gold" /> 
                  <span>My Profile</span>
                </button>
                 <button onClick={() => alert('Settings page coming soon!')} className="flex items-center w-full px-3 py-2 text-sm text-slate-200 rounded-md hover:bg-slate-700 transition-colors space-x-3">
                  <span className="text-lg">⚙️</span>
                  <Icon name="Settings" size={16} className="text-brand-gold" /> 
                  <span>Settings</span>
                </button>
                <div className="my-1 h-px bg-slate-700"></div>
                 <button
                    onClick={() => {
                      onLogout();
                      setIsProfileOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-slate-200 rounded-md hover:bg-slate-700 transition-colors space-x-3"
                >
                  <span className="text-lg">🚪</span>
                  <Icon name="LogOut" size={16} className="text-red-500" /> 
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;