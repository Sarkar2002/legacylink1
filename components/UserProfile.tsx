import React from 'react';
import type { FamilyMember, Post } from '../types';
import Icon from './Icon';

interface VaultDocument {
  memberId: string;
}

interface UserProfileProps {
  currentUser: FamilyMember;
  posts: Post[];
  allDocuments: VaultDocument[];
  onEditProfile: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ currentUser, posts, allDocuments, onEditProfile }) => {
  const userPosts = posts.filter(post => post.author === currentUser.name);
  const userDocumentsCount = allDocuments.filter(doc => doc.memberId === currentUser.id).length;

  return (
    <div className="p-8 h-full overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 animate-fade-in">
      <h1 className="text-4xl font-bold text-slate-100">My Profile</h1>
      <p className="text-lg text-dark-text-secondary mb-8">Your personal hub within the LegacyLink platform.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          {/* Profile Card */}
          <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-6 flex flex-col items-center text-center">
            <img 
              src={currentUser.imageUrl} 
              alt={currentUser.name} 
              className="w-28 h-28 rounded-full object-cover border-4 border-brand-gold shadow-lg mb-4"
            />
            <h2 className="text-2xl font-bold text-slate-100">{currentUser.name}</h2>
            <p className="text-dark-text-secondary mt-1">{currentUser.profession}</p>

            <div className="w-full text-left mt-6 space-y-4 border-t border-slate-700/50 pt-6">
                <div className="flex items-center">
                    <Icon name="User" size={16} className="text-brand-gold mr-3 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs text-dark-text-secondary">Full Name</p>
                        <p className="text-sm text-slate-200 font-medium">{currentUser.name}</p>
                    </div>
                </div>
                <div className="flex items-center">
                    <Icon name="Phone" size={16} className="text-brand-gold mr-3 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs text-dark-text-secondary">Mobile Number</p>
                        <p className="text-sm text-slate-400 font-medium italic">Not Provided</p>
                    </div>
                </div>
            </div>

            <button 
              onClick={onEditProfile}
              className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
                <Icon name="Edit" size={16} />
                <span>Edit Profile</span>
            </button>
          </div>
          
          {/* Stats Card */}
          <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-6">
            <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
                <Icon name="BarChart2" className="mr-2 text-brand-gold"/>
                My Stats
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                    <span className="text-dark-text-secondary flex items-center"><Icon name="Newspaper" size={16} className="mr-2"/> Memories Posted</span>
                    <span className="font-bold text-slate-100 text-lg">{userPosts.length}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                    <span className="text-dark-text-secondary flex items-center"><Icon name="FileText" size={16} className="mr-2"/> Documents Uploaded</span>
                    <span className="font-bold text-slate-100 text-lg">{userDocumentsCount}</span>
                </div>
            </div>
          </div>
        </div>
        
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
            <Icon name="Activity" className="mr-2 text-brand-gold"/>
            My Activity
          </h3>
          <div className="space-y-6">
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <div key={post.id} className="bg-slate-900/70 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-6">
                  <div className="flex items-center mb-4">
                      <img src={post.authorImage} alt={post.author} className="w-10 h-10 rounded-full mr-4" />
                      <div>
                          <p className="font-bold text-slate-100">{post.author}</p>
                          <p className="text-sm text-dark-text-secondary">{post.timestamp}</p>
                      </div>
                  </div>
                  <p className="text-dark-text whitespace-pre-wrap">{post.content}</p>
                  {post.image && <img src={post.image} alt="Post content" className="mt-4 rounded-lg max-h-80 w-full object-cover" />}
                  {post.voiceNote && <audio src={post.voiceNote} controls className="mt-4 w-full"></audio>}
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-slate-900/70 rounded-xl border border-dashed border-slate-700">
                <Icon name="Archive" size={40} className="mx-auto text-slate-600"/>
                <h4 className="mt-4 text-lg font-semibold text-slate-300">No Activity Yet</h4>
                <p className="mt-1 text-dark-text-secondary">Your posts on the Memory Wall will appear here.</p>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;