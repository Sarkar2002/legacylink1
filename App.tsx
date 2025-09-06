import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FamilyTree from './components/FamilyTree';
import MemoryWall from './components/MemoryWall';
import DigitalVault from './components/DigitalVault';
import MemberDetailCard from './components/MemberDetailCard';
import MemberFormModal from './components/MemberFormModal';
import ShareModal from './components/ShareModal';
import LoginPage from './components/LoginPage';
import Contacts from './components/Contacts';
import Calling from './components/Calling';
import AddMemberRelationshipModal from './components/AddMemberRelationshipModal';
import ConfirmationModal from './components/ConfirmationModal';
import UserProfile from './components/UserProfile';
import Notifications from './components/Notifications';
import RelativeProfile from './components/RelativeProfile';
import DocumentUploadModal from './components/DocumentUploadModal';
import PermissionsModal from './components/PermissionsModal';
import { memoryWallPosts as initialMemoryWallPosts, generateGenerations, currentUser, initialNotifications } from './constants';
import type { FamilyMember, View, Post, CallInfo, CallType, Comment, User, Notification, Document, AccessLevel } from './types';

interface VaultDocument extends Document {
  memberId: string;
  memberName: string;
}

const flattenTree = (node: FamilyMember): FamilyMember[] => {
    let nodes: FamilyMember[] = [node];
    if (node.spouse) {
        const spouseAsMember: FamilyMember = {
            id: node.spouse.id,
            name: node.spouse.name,
            imageUrl: node.spouse.imageUrl,
            birthDate: node.spouse.birthDate || 'N/A',
            deathDate: node.spouse.deathDate,
            profession: node.spouse.profession,
            birthPlace: node.spouse.birthPlace,
            relationshipStatus: node.relationshipStatus,
            accessLevel: node.accessLevel, 
        };
        nodes.push(spouseAsMember);
    }
    if (node.children) {
        node.children.forEach(child => {
            nodes = nodes.concat(flattenTree(child));
        });
    }
    return nodes;
};

const updateMemberInTree = (node: FamilyMember, targetId: string, updates: Partial<FamilyMember> | ((member: FamilyMember) => FamilyMember)): FamilyMember => {
  if (node.id === targetId) {
    if (typeof updates === 'function') {
        return updates(node);
    }
    return { ...node, ...updates };
  }
  if (node.spouse && node.spouse.id === targetId) {
    if (typeof updates === 'function') {
      return node;
    }
    return { ...node, spouse: { ...node.spouse, ...updates } };
  }
  if (node.children) {
    return { ...node, children: node.children.map(child => updateMemberInTree(child, targetId, updates)) };
  }
  return node;
};


type ModalState = 
  | { type: 'none' }
  | { type: 'memberForm'; mode: 'add' | 'edit'; memberData?: FamilyMember; isEditingSpouse?: boolean; targetId?: string; relationship?: 'child' | 'spouse'; }
  | { type: 'addRelationship'; targetId: string; targetName: string; hasSpouse: boolean; }
  | { type: 'share'; contentType: 'tree' | 'wall'; }
  | { type: 'confirm'; title: string; message: string; onConfirm: () => void; }
  | { type: 'documentUpload'; }
  | { type: 'permissions'; memberId: string; memberName: string; notificationId: string; };

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewHistory, setViewHistory] = useState<View[]>(['tree']);
  const currentView = viewHistory[viewHistory.length - 1];
  const canGoBack = viewHistory.length > 1;

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState<boolean>(false);
  
  const [history, setHistory] = useState<FamilyMember[]>([generateGenerations(10)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const familyTree = history[historyIndex];

  const [posts, setPosts] = useState<Post[]>(initialMemoryWallPosts);
  const [activeCall, setActiveCall] = useState<CallInfo | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null);
  
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [viewedRelativeId, setViewedRelativeId] = useState<string | null>(null);

  const flatFamilyData = useMemo(() => {
      const allMembers = flattenTree(familyTree);
      const uniqueMembers = Array.from(new Map(allMembers.map(item => [item.id, item])).values());
      return uniqueMembers;
  }, [familyTree]);
  
    const currentUserFull = useMemo(() => {
        return flatFamilyData.find(m => m.name === currentUser.name) || { ...currentUser, id: 'current-user-fallback' } as FamilyMember;
    }, [flatFamilyData]);

  const allDocuments = useMemo((): VaultDocument[] => {
    const documents: VaultDocument[] = [];
    const traverse = (member: FamilyMember) => {
        if (member.documents) {
            member.documents.forEach(doc => {
                documents.push({ ...doc, memberId: member.id, memberName: member.name });
            });
        }
        if (member.spouse && member.spouse.documents) {
            member.spouse.documents.forEach(doc => {
                 documents.push({ ...doc, memberId: member.spouse!.id, memberName: member.spouse!.name });
            });
        }
        if (member.children) {
            member.children.forEach(traverse);
        }
    };
    traverse(familyTree);
    return documents;
  }, [familyTree]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return flatFamilyData.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, flatFamilyData]);
  
  const viewedRelative = useMemo(() => {
    if (!viewedRelativeId) return null;
    return flatFamilyData.find(m => m.id === viewedRelativeId) || null;
  }, [viewedRelativeId, flatFamilyData]);

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const birthdayNotifications: Notification[] = [];
    flatFamilyData.forEach(member => {
        if (member.relationshipStatus === 'connected' && member.birthDate && member.birthDate !== 'N/A') {
            const dateParts = member.birthDate.split('-');
            const birthDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
            
            const birthMonth = birthDate.getMonth() + 1;
            const birthDay = birthDate.getDate();

            if (birthMonth === currentMonth && birthDay === currentDay) {
                const bdayId = `bday-${member.id}-${today.getFullYear()}`;
                if (!notifications.some(n => n.id === bdayId)) {
                    const newNotification: Notification = {
                        id: bdayId,
                        type: 'birthday',
                        actor: { name: member.name, imageUrl: member.imageUrl },
                        timestamp: 'Today',
                        message: 'is celebrating their birthday today!',
                        isRead: false,
                    };
                    birthdayNotifications.push(newNotification);
                }
            }
        }
    });

    if (birthdayNotifications.length > 0) {
        setNotifications(prev => [...birthdayNotifications, ...prev]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, flatFamilyData]);

  const pushToHistory = useCallback((newTreeState: FamilyMember) => {
    setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        return [...newHistory, newTreeState];
    });
    setHistoryIndex(prevIndex => prevIndex + 1);
  }, [historyIndex]);

  const handleNavigate = useCallback((view: View) => {
    setViewHistory(prevHistory => {
        if (prevHistory[prevHistory.length - 1] === view) {
            return prevHistory;
        }
        return [...prevHistory, view];
    });
    setViewedRelativeId(null);
  }, []);

  const handleGoBack = useCallback(() => {
    if (viewHistory.length > 1) {
        setViewHistory(prevHistory => prevHistory.slice(0, prevHistory.length - 1));
    }
  }, [viewHistory.length]);

  const handleNodeClick = useCallback((member: FamilyMember) => {
    const fullMemberData = flatFamilyData.find(m => m.id === member.id) || member;
    setSelectedMember(fullMemberData);
    setIsDetailViewOpen(true);
  }, [flatFamilyData]);

  const closeDetailView = useCallback(() => {
    setIsDetailViewOpen(false);
    setTimeout(() => {
        setSelectedMember(null);
    }, 300);
  }, []);

  const openAddMemberModal = useCallback((targetId: string, relationship: 'child' | 'spouse') => {
    setModalState({ type: 'memberForm', mode: 'add', targetId, relationship });
    setIsDetailViewOpen(false);
  }, []);
  
  const openEditMemberModal = useCallback((member: FamilyMember) => {
    setModalState({ type: 'memberForm', mode: 'edit', memberData: member, isEditingSpouse: false });
  }, []);
  
  const openEditSpouseModal = useCallback((parentMember: FamilyMember) => {
    setModalState({ type: 'memberForm', mode: 'edit', memberData: parentMember, isEditingSpouse: true });
  }, []);

  const handleEditCurrentUser = useCallback(() => {
    if (currentUserFull) {
      setModalState({ type: 'memberForm', mode: 'edit', memberData: currentUserFull });
    }
  }, [currentUserFull]);
  
  const handleSaveMember = useCallback((formData: Partial<Omit<FamilyMember, 'id' | 'children' | 'spouse'>> & { id?: string; documents?: Document[] }) => {
    if (modalState.type !== 'memberForm') return;
    const { mode, targetId, relationship, memberData, isEditingSpouse } = modalState;

    const recursiveUpdate = (node: FamilyMember): FamilyMember => {
        if (mode === 'edit' && node.id === memberData?.id) {
            if (isEditingSpouse) {
                const updatedSpouse = { ...node.spouse!, ...formData, id: node.spouse!.id };
                return { ...node, spouse: updatedSpouse };
            } else {
                 return { ...node, ...formData };
            }
        }
        
        if (mode === 'add' && node.id === targetId) {
            if (relationship === 'child') {
                const newMember: FamilyMember = { ...(formData as FamilyMember), id: `member-${Date.now()}` };
                return { ...node, children: [...(node.children || []), newMember] };
            }
            if (relationship === 'spouse') {
                 const newSpouse = { ...(formData as FamilyMember), id: `spouse-${Date.now()}` };
                 return { ...node, spouse: newSpouse };
            }
        }

        if (node.children) {
            return { ...node, children: node.children.map(recursiveUpdate) };
        }
        return node;
    };

    const newTree = recursiveUpdate(familyTree);
    pushToHistory(newTree);
    setModalState({ type: 'none' });
  }, [modalState, familyTree, pushToHistory]);
  
  const handleDeleteMember = useCallback((memberId: string) => {
    if (familyTree.id === memberId) {
        alert("Cannot delete the root member of the family tree.");
        return;
    }
    const memberToDelete = flatFamilyData.find(m => m.id === memberId);
    setModalState({
        type: 'confirm',
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete ${memberToDelete?.name || 'this member'} and all their descendants? This action is permanent.`,
        onConfirm: () => {
            const recursiveDelete = (node: FamilyMember): FamilyMember => {
                if (node.children) {
                    const newChildren = node.children.filter(child => child.id !== memberId).map(recursiveDelete);
                    return { ...node, children: newChildren.length > 0 ? newChildren : undefined };
                }
                return node;
            };
            const newTree = recursiveDelete(familyTree);
            pushToHistory(newTree);
            if(selectedMember?.id === memberId) closeDetailView();
        }
    });
  }, [familyTree, flatFamilyData, selectedMember, closeDetailView, pushToHistory]);

  const handleDeleteSpouse = useCallback((memberId: string) => {
    const parentMember = flatFamilyData.find(m => m.id === memberId);
    setModalState({
        type: 'confirm',
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete ${parentMember?.spouse?.name || 'this spouse'}? This action is permanent.`,
        onConfirm: () => {
            const recursiveDelete = (node: FamilyMember): FamilyMember => {
                if (node.id === memberId && node.spouse) {
                    const { spouse, ...rest } = node;
                    return rest;
                }
                if (node.children) return { ...node, children: node.children.map(recursiveDelete) };
                return node;
            };
            const newTree = recursiveDelete(familyTree);
            pushToHistory(newTree);
        }
    });
  }, [familyTree, flatFamilyData, pushToHistory]);

  const handleAddMemberClick = useCallback((targetIdFromTree: string | null) => {
    const targetId = targetIdFromTree || familyTree.id;
    const targetMember = flatFamilyData.find(m => m.id === targetId);
    if (!targetMember) return;
    setModalState({
        type: 'addRelationship',
        targetId: targetMember.id,
        targetName: targetMember.name,
        hasSpouse: !!targetMember.spouse,
    });
  }, [familyTree.id, flatFamilyData]);
  
  const handleUndo = useCallback(() => setHistoryIndex(i => Math.max(0, i - 1)), []);
  const handleRedo = useCallback(() => setHistoryIndex(i => Math.min(history.length - 1, i + 1)), [history.length]);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(isCurrentlyEditMode => {
        if (isCurrentlyEditMode) setEditTargetId(null);
        return !isCurrentlyEditMode;
    });
  }, []);

  const handleSetEditTarget = useCallback((targetId: string) => {
    setEditTargetId(prevId => (prevId === targetId ? null : targetId));
  }, []);

  const handleSelectRelationship = useCallback((relationship: 'child' | 'spouse') => {
      if (modalState.type !== 'addRelationship') return;
      openAddMemberModal(modalState.targetId, relationship);
  }, [modalState, openAddMemberModal]);
  
  const handleAddPost = useCallback((newPostData: { content: string; image?: string; voiceNote?: string; }) => {
    const newPost: Post = {
        id: `post-${Date.now()}`,
        author: currentUser.name,
        authorImage: currentUser.imageUrl,
        timestamp: 'Just now',
        likes: 0,
        isLiked: false,
        comments: [],
        ...newPostData
    };
    setPosts(prevPosts => [newPost, ...prevPosts]);
    
    const newNotification: Notification = {
        id: `n-${Date.now()}`,
        type: 'new_post',
        actor: { name: currentUser.name, imageUrl: currentUser.imageUrl },
        timestamp: 'Just now',
        message: 'added a new memory to the Wall.',
        isRead: false,
        linkTo: 'wall'
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const handleLikePost = useCallback((postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  }, []);

  const handleAddComment = useCallback((postId: string, commentText: string) => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: currentUser.name,
      authorImage: currentUser.imageUrl,
      text: commentText.trim(),
    };
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );
  }, []);

  const handleDeletePost = useCallback((postId: string) => {
    setModalState({
        type: 'confirm',
        title: 'Confirm Post Deletion',
        message: 'Are you sure you want to permanently delete this memory? This action cannot be undone.',
        onConfirm: () => {
            setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        }
    });
  }, []);
  
  const handleDeleteComment = useCallback((postId: string, commentId: string) => {
    setModalState({
        type: 'confirm',
        title: 'Confirm Comment Deletion',
        message: 'Are you sure you want to permanently delete this comment?',
        onConfirm: () => {
            setPosts(prevPosts =>
                prevPosts.map(post => {
                    if (post.id === postId) {
                        return { ...post, comments: post.comments.filter(comment => comment.id !== commentId) };
                    }
                    return post;
                })
            );
        },
    });
  }, []);

  const handleShare = useCallback((contentType: 'tree' | 'wall') => {
    setModalState({ type: 'share', contentType });
  }, []);
  
  const handleLogin = useCallback(() => setIsAuthenticated(true), []);
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setViewHistory(['tree']);
  }, []);

  const handleInitiateCall = useCallback((member: FamilyMember, type: CallType) => setActiveCall({ contacts: [member], type }), []);
  
  const handleInitiateGroupCall = useCallback((members: FamilyMember[], type: CallType) => {
    if (members.length > 0) {
      setActiveCall({ contacts: members, type });
    }
  }, []);
  
  const handleEndCall = useCallback(() => {
    setActiveCall(null);
    handleNavigate('contacts');
  }, [handleNavigate]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleMemberSelect = useCallback((memberId: string) => {
    setViewedRelativeId(memberId);
    setSearchQuery('');
    handleNavigate('relativeProfile');
  }, [handleNavigate]);

  const handleTreeInteraction = useCallback(() => setFocusedMemberId(null), []);

  const handleMarkNotificationsAsRead = useCallback(() => {
    setTimeout(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, 1000);
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    if (notification.linkTo) {
        handleNavigate(notification.linkTo);
    }
  }, [handleNavigate]);

  const handleSendFamilyRequest = useCallback((memberId: string) => {
    const newTree = updateMemberInTree(familyTree, memberId, { relationshipStatus: 'pending_sent' });
    pushToHistory(newTree);
  }, [familyTree, pushToHistory]);

  const handleDeclineFamilyRequest = useCallback((notificationId: string, memberId: string) => {
    const newTree = updateMemberInTree(familyTree, memberId, { relationshipStatus: 'not_connected' });
    pushToHistory(newTree);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, [familyTree, pushToHistory]);

  const handleAcceptFamilyRequest = useCallback((notificationId: string, memberId: string) => {
    const member = flatFamilyData.find(m => m.id === memberId);
    if (member) {
        setModalState({ type: 'permissions', memberId, memberName: member.name, notificationId });
    }
  }, [flatFamilyData]);
  
  const handleConfirmConnectionWithAccess = useCallback((memberId: string, notificationId: string, accessLevel: AccessLevel) => {
    const newTree = updateMemberInTree(familyTree, memberId, { relationshipStatus: 'connected', accessLevel });
    pushToHistory(newTree);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    const targetMember = flatFamilyData.find(m => m.id === memberId);
    const newNotification: Notification = {
        id: `n-conn-${Date.now()}`,
        type: 'new_connection',
        actor: { name: targetMember?.name || 'A relative', imageUrl: targetMember?.imageUrl || '' },
        timestamp: 'Just now',
        message: 'is now connected with you.',
        isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
    setModalState({ type: 'none' });
  }, [familyTree, pushToHistory, flatFamilyData]);

  const handleUploadDocument = useCallback((memberId: string, docData: Omit<Document, 'id'>) => {
    const newDocument: Document = { ...docData, id: `doc-${Date.now()}` };
    const newTree = updateMemberInTree(familyTree, memberId, (member) => ({
        ...member,
        documents: [...(member.documents || []), newDocument],
    }));
    pushToHistory(newTree);
    setModalState({ type: 'none' });
  }, [familyTree, pushToHistory]);
  
  const handleDeleteDocument = useCallback((memberId: string, documentId: string) => {
    setModalState({
      type: 'confirm',
      title: 'Confirm Document Deletion',
      message: 'Are you sure you want to permanently delete this document?',
      onConfirm: () => {
        const newTree = updateMemberInTree(familyTree, memberId, (member) => ({
            ...member,
            documents: (member.documents || []).filter(doc => doc.id !== documentId),
        }));
        pushToHistory(newTree);
      }
    });
  }, [familyTree, pushToHistory]);


  const renderView = () => {
    switch (currentView) {
      case 'tree':
        return <FamilyTree 
                    data={familyTree} 
                    onNodeClick={handleNodeClick} 
                    onShare={() => handleShare('tree')}
                    isEditMode={isEditMode}
                    onToggleEditMode={handleToggleEditMode}
                    onEditMember={openEditMemberModal}
                    onDeleteMember={handleDeleteMember}
                    onAddMemberClick={handleAddMemberClick}
                    onEditSpouse={openEditSpouseModal}
                    onDeleteSpouse={handleDeleteSpouse}
                    editTargetId={editTargetId}
                    onSetEditTarget={handleSetEditTarget}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    focusedMemberId={focusedMemberId}
                    onTreeInteraction={handleTreeInteraction}
                    isHeaderMenuOpen={isHeaderMenuOpen}
                />;
      case 'wall':
        return <MemoryWall 
                    posts={posts} 
                    onAddPost={handleAddPost} 
                    onShare={() => handleShare('wall')} 
                    onLikePost={handleLikePost}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    onDeleteComment={handleDeleteComment}
                    currentUser={currentUser}
                />;
      case 'vault':
        return <DigitalVault 
                  documents={allDocuments} 
                  onUploadClick={() => setModalState({ type: 'documentUpload' })} 
                  onDeleteClick={handleDeleteDocument} 
                />;
      case 'contacts':
        return <Contacts familyMembers={flatFamilyData.filter(m => m.relationshipStatus === 'connected')} onInitiateCall={handleInitiateCall} onInitiateGroupCall={handleInitiateGroupCall} />;
      case 'profile':
        return <UserProfile currentUser={currentUserFull} posts={posts} allDocuments={allDocuments} onEditProfile={handleEditCurrentUser} />;
      case 'notifications':
        return <Notifications notifications={notifications} onAcceptRequest={handleAcceptFamilyRequest} onDeclineRequest={handleDeclineFamilyRequest} onNotificationClick={handleNotificationClick} />;
      case 'relativeProfile':
        return viewedRelative ? <RelativeProfile member={viewedRelative} onSendRequest={handleSendFamilyRequest} /> : <div className="p-8">Member not found.</div>;
      default:
        return <FamilyTree data={familyTree} onNodeClick={handleNodeClick} onShare={() => handleShare('tree')} isEditMode={false} onToggleEditMode={()=>{}} onEditMember={()=>{}} onDeleteMember={()=>{}} onAddMemberClick={() => {}} onEditSpouse={() => {}} onDeleteSpouse={() => {}} editTargetId={null} onSetEditTarget={() => {}} onUndo={() => {}} onRedo={() => {}} canUndo={false} canRedo={false} focusedMemberId={null} onTreeInteraction={() => {}} isHeaderMenuOpen={false} />;
    }
  };

  if (activeCall) return <Calling callInfo={activeCall} onEndCall={handleEndCall} />;
  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="h-screen bg-transparent font-sans">
      {isSidebarOpen && (
          <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-20 md:hidden" aria-hidden="true"></div>
      )}
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        onShareTree={() => handleShare('tree')}
      />
      <div className={`relative h-full flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'}`}>
        <Header 
          notifications={notifications}
          onMarkAsRead={handleMarkNotificationsAsRead}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isOpen={isSidebarOpen}
          canGoBack={canGoBack}
          onGoBack={handleGoBack}
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearchChange={handleSearchChange}
          onMemberSelect={handleMemberSelect}
          onLogout={handleLogout}
          currentUser={currentUser}
          onProfileOpenChange={setIsHeaderMenuOpen}
          onNavigate={handleNavigate}
          onNotificationClick={handleNotificationClick}
        />
        <main className="flex-1 overflow-y-auto relative">
          {renderView()}
          {selectedMember && (
            <MemberDetailCard 
              member={selectedMember} 
              isOpen={isDetailViewOpen}
              onClose={closeDetailView} 
              onAddMember={openAddMemberModal}
            />
          )}
        </main>
      </div>
      {modalState.type === 'memberForm' && 
        <MemberFormModal
            isOpen={true}
            onClose={() => setModalState({ type: 'none' })}
            onSubmit={handleSaveMember}
            mode={modalState.mode}
            isEditingSpouse={modalState.isEditingSpouse}
            relationship={modalState.relationship}
            initialData={modalState.isEditingSpouse ? modalState.memberData?.spouse : modalState.memberData}
        />}
      {modalState.type === 'share' &&
        <ShareModal
            isOpen={true}
            onClose={() => setModalState({ type: 'none' })}
            contentType={modalState.contentType}
        />}
      {modalState.type === 'addRelationship' &&
        <AddMemberRelationshipModal 
            isOpen={true}
            onClose={() => setModalState({ type: 'none' })}
            onSelect={handleSelectRelationship}
            targetName={modalState.targetName || ''}
            hasSpouse={modalState.hasSpouse || false}
        />}
      {modalState.type === 'confirm' &&
        <ConfirmationModal 
            isOpen={true}
            onClose={() => setModalState({ type: 'none' })}
            onConfirm={modalState.onConfirm}
            title={modalState.title}
            message={modalState.message}
        />}
      {modalState.type === 'documentUpload' &&
        <DocumentUploadModal
            isOpen={true}
            onClose={() => setModalState({ type: 'none' })}
            onSubmit={handleUploadDocument}
            familyMembers={flatFamilyData}
        />}
      {modalState.type === 'permissions' &&
        <PermissionsModal
            isOpen={true}
            onClose={() => setModalState({ type: 'none' })}
            memberName={modalState.memberName}
            onConfirm={(accessLevel) => handleConfirmConnectionWithAccess(modalState.memberId, modalState.notificationId, accessLevel)}
        />}
    </div>
  );
};

export default App;