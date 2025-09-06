import React, { useState, useEffect, useRef } from 'react';
import type { CallInfo } from '../types';
import Icon from './Icon';

interface CallingProps {
  callInfo: CallInfo;
  onEndCall: () => void;
}

const Calling: React.FC<CallingProps> = ({ callInfo, onEndCall }) => {
  const { contacts, type: callType } = callInfo;
  const isGroupCall = contacts.length > 1;
  const primaryContact = contacts[0]; // For 1-on-1 calls

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerphoneOn, setIsSpeakerphoneOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startMedia = async () => {
      try {
        const constraints: MediaStreamConstraints = { audio: true, video: callType === 'video' };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (err) {
        console.error("Error accessing media devices:", err);
        const resource = callType === 'video' ? 'Camera and microphone' : 'Microphone';
        if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          setPermissionError(
            `${resource} access was denied. To fix this, click the lock icon (🔒) in your browser's address bar, find the Camera and Microphone settings for this site, and set them to 'Allow'.`
          );
        } else {
          setPermissionError(`Could not access ${resource.toLowerCase()}. Please check your device, browser settings, and ensure they are connected properly.`);
        }
      }
    };

    startMedia();

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [callType]);

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(prev => !prev);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsCameraOff(prev => !prev);
    }
  };

  const toggleSpeakerphone = () => setIsSpeakerphoneOn(prev => !prev);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const renderSingleCallBackground = () => (
    <>
      <img src={primaryContact.imageUrl.replace('/200', '/1200/800')} alt={primaryContact.name} className="absolute inset-0 w-full h-full object-cover opacity-50 animate-subtle-zoom" />
      <div className="absolute inset-0 bg-black/40"></div>
    </>
  );

  const renderSingleCallAudio = () => (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-deep-space"></div>
      <div className="flex flex-col items-center justify-center">
        <div className="relative flex flex-col items-center justify-center">
          <div className="absolute w-48 h-48 rounded-full bg-slate-700/30 animate-pulse-ring"></div>
          <div className="absolute w-48 h-48 rounded-full bg-slate-700/20 animate-pulse-ring" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute w-48 h-48 rounded-full bg-slate-700/10 animate-pulse-ring" style={{ animationDelay: '1s' }}></div>
          <img src={primaryContact.imageUrl.replace('/200', '/400')} alt={primaryContact.name} className="relative w-48 h-48 rounded-full object-cover border-8 border-slate-700/50 shadow-2xl" />
        </div>
      </div>
    </>
  );

  const renderGroupCallGrid = () => (
    <div className={`grid h-full w-full p-4 gap-4 grid-cols-2 grid-rows-2`}>
        {contacts.map(contact => (
            <div key={contact.id} className="bg-slate-800 rounded-xl overflow-hidden relative border-2 border-slate-700">
                <img src={contact.imageUrl.replace('/200', '/600/400')} alt={contact.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="font-semibold text-sm truncate">{contact.name}</p>
                </div>
            </div>
        ))}
    </div>
  );

  if (permissionError) {
    return (
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center z-20 p-8 animate-fade-in">
        <Icon name="ShieldAlert" size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Permissions Required</h2>
        <p className="max-w-md text-slate-300">{permissionError}</p>
        <button onClick={onEndCall} className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2" aria-label="Go Back">
          <Icon name="ArrowLeft" size={20} />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-900 text-white relative flex items-center justify-center overflow-hidden">
      {/* Background */}
      {!isGroupCall && callType === 'video' && renderSingleCallBackground()}
      {!isGroupCall && callType === 'audio' && renderSingleCallAudio()}
      {isGroupCall && <div className="absolute inset-0 bg-deep-space"></div>}
      
      {/* Main Content */}
      {isGroupCall && callType === 'video' && renderGroupCallGrid()}

      {/* Local Video Preview */}
      {callType === 'video' && (
        <div className={`absolute top-6 right-6 w-32 h-24 bg-black rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20 ${isGroupCall ? 'sm:w-40 sm:h-32' : ''}`}>
          <video ref={localVideoRef} autoPlay muted className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : 'block'}`}></video>
          {isCameraOff && (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <Icon name="VideoOff" size={32} className="text-slate-500" />
            </div>
          )}
        </div>
      )}

      {/* Call Info */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center z-10 text-shadow">
        <h1 className="text-3xl font-bold">
          {isGroupCall ? `Group Call (${contacts.length})` : primaryContact.name}
        </h1>
        <p className="text-2xl text-slate-200 mt-2 font-mono tracking-wider">{formatDuration(callDuration)}</p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-6 bg-slate-900/70 backdrop-blur-lg p-4 rounded-full border border-slate-700/50 z-10">
        <button onClick={toggleMute} className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700/80 hover:bg-slate-600'}`} aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}>
          <Icon name={isMuted ? 'MicOff' : 'Mic'} size={24} />
        </button>

        {callType === 'video' ? (
          <button onClick={toggleCamera} className={`p-3 rounded-full transition-colors ${isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700/80 hover:bg-slate-600'}`} aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}>
            <Icon name={isCameraOff ? 'VideoOff' : 'Video'} size={24} />
          </button>
        ) : (
          <button onClick={toggleSpeakerphone} className={`p-3 rounded-full transition-colors ${isSpeakerphoneOn ? 'bg-brand-blue hover:bg-brand-blue-light' : 'bg-slate-700/80 hover:bg-slate-600'}`} aria-label={isSpeakerphoneOn ? 'Turn speakerphone off' : 'Turn speakerphone on'}>
            <Icon name={isSpeakerphoneOn ? 'Volume2' : 'Volume1'} size={24} />
          </button>
        )}

        <button onClick={onEndCall} className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors" aria-label="End call">
          <Icon name="PhoneOff" size={28} />
        </button>
      </div>
    </div>
  );
};

export default Calling;