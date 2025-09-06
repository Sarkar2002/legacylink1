import React from 'react';
import type { Notification } from '../types';
import Icon from './Icon';

interface NotificationsProps {
  notifications: Notification[];
  onAcceptRequest: (notificationId: string, memberId: string) => void;
  onDeclineRequest: (notificationId: string, memberId: string) => void;
  onNotificationClick: (notification: Notification) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, onAcceptRequest, onDeclineRequest, onNotificationClick }) => {

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
    <div className="p-8 h-full overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
      <h1 className="text-4xl font-bold mb-2 text-slate-100">Notifications</h1>
      <p className="text-lg text-dark-text-secondary mb-8">Recent activity from your family network.</p>
      
      <div className="max-w-3xl mx-auto space-y-4">
        {notifications.length > 0 ? notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`w-full text-left bg-slate-900/70 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-4 flex items-start space-x-4 transition-all ${!notif.isRead && 'border-brand-blue'}`}
          >
            <div className="mt-1">
                <Icon name={getNotificationIcon(notif.type)} className="w-6 h-6 text-brand-gold flex-shrink-0" />
            </div>
            <div className="flex-1">
                <button 
                  onClick={() => onNotificationClick(notif)}
                  disabled={!notif.linkTo}
                  className={`flex items-center space-x-3 text-left ${notif.linkTo && 'cursor-pointer'}`}
                >
                    <img src={notif.actor.imageUrl} alt={notif.actor.name} className="w-10 h-10 rounded-full" />
                    <p className="text-slate-200">
                        <span className="font-bold">{notif.actor.name}</span> {notif.message}
                    </p>
                </button>
                <p className="text-xs text-slate-400 mt-1 pl-13">{notif.timestamp}</p>
                {notif.type === 'family_request' && notif.relatedMemberId && (
                    <div className="mt-3 pl-13 flex space-x-3">
                        <button onClick={(e) => { e.stopPropagation(); onAcceptRequest(notif.id, notif.relatedMemberId!); }} className="bg-brand-blue-light hover:bg-brand-blue text-white font-semibold py-1 px-4 rounded-lg text-sm flex items-center space-x-2">
                            <Icon name="Check" size={16} />
                            <span>Accept</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDeclineRequest(notif.id, notif.relatedMemberId!); }} className="bg-slate-600 hover:bg-slate-500 text-slate-200 font-semibold py-1 px-4 rounded-lg text-sm flex items-center space-x-2">
                            <Icon name="X" size={16} />
                            <span>Decline</span>
                        </button>
                    </div>
                )}
            </div>
            {!notif.isRead && <div className="w-2 h-2 rounded-full bg-brand-gold mt-2 flex-shrink-0"></div>}
          </div>
        )) : (
          <div className="text-center py-16">
            <Icon name="BellOff" size={48} className="mx-auto text-slate-600"/>
            <h3 className="mt-4 text-xl font-semibold text-slate-300">No Notifications</h3>
            <p className="mt-1 text-dark-text-secondary">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;