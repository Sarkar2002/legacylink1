import React, { useState, useRef, useEffect } from 'react';
import type { Post, User, Comment } from '../types';
import Icon from './Icon';

interface MemoryWallProps {
  posts: Post[];
  onAddPost: (postData: { content: string; image?: string; voiceNote?: string }) => void;
  onShare: () => void;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  currentUser: User;
}

const DRAFT_STORAGE_KEY = 'legacyLinkMemoryWallDraft';

interface PostData {
  content: string;
  image?: string | null;
  voiceNote?: string | null;
}

const MemoryWall: React.FC<MemoryWallProps> = ({ posts, onAddPost, onShare, onLikePost, onAddComment, onDeletePost, onDeleteComment, currentUser }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  // Effect to check for draft on mount
  useEffect(() => {
    try {
      const savedDraftJSON = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraftJSON) {
        const savedDraft: PostData = JSON.parse(savedDraftJSON);
        if (savedDraft.content || savedDraft.image || savedDraft.voiceNote) {
          setShowDraftPrompt(true);
        }
      }
    } catch (error) {
        console.error("Failed to read draft from localStorage", error);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  // Effect to save draft on change
  useEffect(() => {
    const draft: PostData = { content, image, voiceNote };
    if (draft.content || draft.image || draft.voiceNote) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } else {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [content, image, voiceNote]);
  
  const handleRestoreDraft = () => {
    try {
      const savedDraftJSON = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraftJSON) {
        const savedDraft: PostData = JSON.parse(savedDraftJSON);
        setContent(savedDraft.content);
        setImage(savedDraft.image || null);
        setVoiceNote(savedDraft.voiceNote || null);
      }
    } catch (error) {
        console.error("Failed to restore draft from localStorage", error);
    } finally {
        setShowDraftPrompt(false);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setShowDraftPrompt(false);
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVoiceNote(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handlePost = () => {
    if (!content.trim() && !image && !voiceNote) return;
    onAddPost({ content, image: image || undefined, voiceNote: voiceNote || undefined });
    setContent('');
    setImage(null);
    setVoiceNote(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  // --- Camera Logic ---
  const handleOpenCamera = () => {
    setCameraPermissionError(null);
    setIsCameraOpen(true);
  };
  
  const handleCloseCamera = () => setIsCameraOpen(false);

  useEffect(() => {
    const stopCamera = () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
    };

    if (isCameraOpen) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          cameraStreamRef.current = stream;
        } catch (err) {
          console.error("Error accessing camera:", err);
          if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
              setCameraPermissionError("Camera access was denied. Please enable camera permissions in your browser settings to use this feature.");
          } else {
              setCameraPermissionError("Could not access the camera. Please check if it's connected and not in use by another application.");
          }
        }
      };
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        setVoiceNote(null);
        setIsCameraOpen(false);
      }
    }
  };
  
  // --- Voice Note Logic ---
  const handleOpenRecordingModal = () => {
    setMicPermissionError(null);
    setIsRecordingModalOpen(true);
  };
  
  const handleCloseRecordingModal = () => {
    if (isRecording) handleStopRecording();
    setIsRecordingModalOpen(false);
  };
  
  useEffect(() => {
    const stopMic = () => {
        if(micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
            micStreamRef.current = null;
        }
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setIsRecording(false);
        setRecordingTime(0);
    }
    if(isRecordingModalOpen) {
        const startMic = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                micStreamRef.current = stream;
            } catch (err) {
                console.error("Error accessing microphone:", err);
                if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
                    setMicPermissionError("Microphone access was denied. Please enable microphone permissions in your browser settings to record audio.");
                } else {
                    setMicPermissionError("Could not access the microphone. Please check if it's connected and not in use by another application.");
                }
            }
        };
        startMic();
    } else {
      stopMic();
    }
    return () => stopMic();
  }, [isRecordingModalOpen]);

  const handleStartRecording = () => {
    if (!micStreamRef.current) {
        setMicPermissionError("Microphone is not available. Please allow access.");
        return;
    }
    setVoiceNote(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
    mediaRecorderRef.current = new MediaRecorder(micStreamRef.current);
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };
    
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        setVoiceNote(reader.result as string);
      };
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
    }
  };
  
  const handleSaveRecording = () => {
      setImage(null);
      handleCloseRecordingModal();
  };
  
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  const handleToggleComments = (postId: string) => {
    setExpandedCommentsPostId(prevId => (prevId === postId ? null : postId));
  };
  
  const handleCommentSubmit = (postId: string) => {
    onAddComment(postId, commentText);
    setCommentText('');
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
       <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-4xl font-bold text-slate-100">Memory Wall</h1>
            <p className="text-lg text-dark-text-secondary">Share and cherish moments with your family.</p>
        </div>
        <button onClick={onShare} className="hidden md:flex items-center bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors space-x-2">
            <span className="text-lg">🔗</span>
            <Icon name="Share2" size={16} />
            <span>Share Wall</span>
        </button>
      </div>

      {showDraftPrompt && (
        <div className="bg-slate-800/80 border border-brand-gold/50 rounded-lg p-4 mb-6 flex items-center justify-between animate-fade-in-down">
          <div>
            <h4 className="font-bold text-slate-100 flex items-center"><Icon name="Save" size={16} className="mr-2 text-brand-gold" /> Unsaved Draft</h4>
            <p className="text-sm text-dark-text-secondary mt-1">You have a post that you were working on. Want to continue?</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={handleDiscardDraft} className="bg-slate-600 hover:bg-slate-500 text-slate-200 font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Discard</button>
            <button onClick={handleRestoreDraft} className="bg-brand-blue-light hover:bg-brand-blue text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Continue Editing</button>
          </div>
        </div>
      )}

      {/* Post Composer */}
      <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-6 mb-8">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share a memory, a story, or a thought..."
          className="w-full bg-slate-800/50 border-0 rounded-lg p-3 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-brand-gold resize-none"
          rows={3}
        ></textarea>
        
        {image && (
          <div className="mt-4 relative">
            <img src={image} alt="Preview" className="max-h-60 rounded-lg" />
            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70" aria-label="Remove image">
              <Icon name="X" size={16}/>
            </button>
          </div>
        )}

        {voiceNote && (
          <div className="mt-4 relative p-3 bg-slate-800 rounded-lg flex items-center">
             <audio src={voiceNote} controls className="w-full"></audio>
             <button onClick={() => setVoiceNote(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70" aria-label="Remove voice note">
                <Icon name="X" size={16}/>
             </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <button onClick={triggerFileSelect} disabled={!!voiceNote} className="flex items-center space-x-2 text-dark-text-secondary hover:text-brand-gold transition-colors p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="text-lg">🖼️</span>
              <Icon name="Image" size={20} />
              <span className="hidden md:inline">Add Photo</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            <button onClick={handleOpenCamera} disabled={!!voiceNote} className="flex items-center space-x-2 text-dark-text-secondary hover:text-brand-gold transition-colors p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="text-lg">📸</span>
              <Icon name="Camera" size={20} />
              <span className="hidden md:inline">Take Photo</span>
            </button>
            <button onClick={handleOpenRecordingModal} disabled={!!image} className="flex items-center space-x-2 text-dark-text-secondary hover:text-brand-gold transition-colors p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="text-lg">🎤</span>
              <Icon name="Mic" size={20} />
              <span className="hidden md:inline">Record Voice</span>
            </button>
          </div>
          <button onClick={handlePost} className="bg-brand-blue-light hover:bg-brand-blue text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center space-x-2">
            <span className="text-lg">📮</span>
            <Icon name="Send" size={16} />
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-slate-900/70 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <img src={post.authorImage} alt={post.author} className="w-12 h-12 rounded-full mr-4" />
                    <div>
                        <p className="font-bold text-slate-100">{post.author}</p>
                        <p className="text-sm text-dark-text-secondary">{post.timestamp}</p>
                    </div>
                </div>
              </div>
              <p className="text-dark-text whitespace-pre-wrap">{post.content}</p>
              {post.image && <img src={post.image} alt="Post content" className="mt-4 rounded-lg max-h-96 w-full object-cover" />}
              {post.voiceNote && <audio src={post.voiceNote} controls className="mt-4 w-full"></audio>}
            </div>
            <div className="px-6 py-3 border-t border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => onLikePost(post.id)} className={`flex items-center space-x-2 transition-colors ${post.isLiked ? 'text-brand-gold' : 'text-dark-text-secondary hover:text-slate-100'}`}>
                        <span className="text-lg">{post.isLiked ? '❤️' : '🤍'}</span>
                        <Icon name="Heart" size={20} fill={post.isLiked ? 'currentColor' : 'none'}/>
                        <span>{post.likes} Like{post.likes !== 1 && 's'}</span>
                    </button>
                    <button onClick={() => handleToggleComments(post.id)} className="flex items-center space-x-2 text-dark-text-secondary hover:text-brand-gold transition-colors">
                        <span className="text-lg">💬</span>
                        <Icon name="MessageSquare" size={20}/>
                        <span>{post.comments.length} Comment{post.comments.length !== 1 && 's'}</span>
                    </button>
                </div>
                {post.author === currentUser.name && (
                <button onClick={() => onDeletePost(post.id)} className="flex items-center space-x-2 text-dark-text-secondary hover:text-red-500 transition-colors group">
                    <span className="text-lg">🗑️</span>
                    <Icon name="Trash2" size={18} className="group-hover:text-red-500"/>
                    <span className="hidden md:inline">Delete Post</span>
                </button>
                )}
            </div>
            {expandedCommentsPostId === post.id && (
              <div className="p-6 border-t border-slate-700/50 bg-slate-800/40 animate-fade-in-down">
                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="flex items-start group">
                      <img src={comment.authorImage} alt={comment.author} className="w-8 h-8 rounded-full mr-3 mt-1"/>
                      <div className="flex-1 bg-slate-700/50 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-slate-200">{comment.author}</p>
                          {(post.author === currentUser.name || comment.author === currentUser.name) && (
                            <button onClick={() => onDeleteComment(post.id, comment.id)} className="p-1 text-slate-500 hover:text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" aria-label="Delete comment">
                               <Icon name="Trash2" size={14}/>
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-dark-text mt-1">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                  {post.comments.length === 0 && <p className="text-sm text-center text-slate-400">Be the first to comment.</p>}
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-slate-700/50 border-0 rounded-lg p-2 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-brand-gold"
                  />
                  <button onClick={() => handleCommentSubmit(post.id)} className="ml-2 bg-brand-blue-light hover:bg-brand-blue text-white font-bold p-2 rounded-lg transition-colors" aria-label="Send comment">
                    <Icon name="Send" size={16}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in" onClick={handleCloseCamera}>
          <div className="bg-slate-900 rounded-xl shadow-2xl p-6 relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseCamera} className="absolute top-4 right-4 text-white" aria-label="Close camera view"><Icon name="X" size={24}/></button>
            {cameraPermissionError ? (
                <div className="text-center p-8">
                    <Icon name="CameraOff" size={48} className="text-red-500 mx-auto mb-4"/>
                    <h3 className="text-xl font-bold text-slate-100">Camera Error</h3>
                    <p className="text-slate-300 mt-2">{cameraPermissionError}</p>
                </div>
            ) : (
                <>
                    <video ref={videoRef} className="w-full rounded-lg" autoPlay playsInline></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <button onClick={handleCapture} className="mt-4 w-full bg-brand-blue-light hover:bg-brand-blue text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2">
                        <span className="text-lg">📸</span>
                        <Icon name="Camera" size={20}/>
                        <span>Capture</span>
                    </button>
                </>
            )}
          </div>
        </div>
      )}
      
      {isRecordingModalOpen && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in" onClick={handleCloseRecordingModal}>
            <div className="bg-slate-900 rounded-xl shadow-2xl p-6 relative w-full max-w-md text-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleCloseRecordingModal} className="absolute top-4 right-4 text-white" aria-label="Close recording modal"><Icon name="X" size={24}/></button>
                {micPermissionError ? (
                    <div className="text-center p-8">
                        <Icon name="MicOff" size={48} className="text-red-500 mx-auto mb-4"/>
                        <h3 className="text-xl font-bold text-slate-100">Microphone Error</h3>
                        <p className="text-slate-300 mt-2">{micPermissionError}</p>
                    </div>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Record a Voice Note</h3>
                        <div className="my-8">
                            <Icon name="Mic" size={48} className={`mx-auto ${isRecording ? 'text-red-500 animate-pulse' : 'text-brand-gold'}`}/>
                            <p className="text-4xl font-mono mt-4">{formatRecordingTime(recordingTime)}</p>
                        </div>
                        
                        {!isRecording && !voiceNote && (
                            <button onClick={handleStartRecording} className="w-full bg-brand-blue-light hover:bg-brand-blue text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2">
                                <Icon name="Play" size={20}/>
                                <span>Start Recording</span>
                            </button>
                        )}
                        
                        {isRecording && (
                             <button onClick={handleStopRecording} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2">
                                <Icon name="StopCircle" size={20}/>
                                <span>Stop Recording</span>
                            </button>
                        )}

                        {voiceNote && !isRecording && (
                            <div className="space-y-4">
                                <audio src={voiceNote} controls className="w-full"></audio>
                                <button onClick={handleSaveRecording} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2">
                                     <span className="text-lg">✅</span>
                                     <Icon name="Check" size={20}/>
                                     <span>Use this Recording</span>
                                </button>
                                <button onClick={handleStartRecording} className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                     <span>Re-record</span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
         </div>
      )}
    </div>
  );
};

export default MemoryWall;