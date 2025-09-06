// Add global type declarations for libraries loaded via script tags
declare global {
  interface Window {
    d3: any;
    lucide: {
      icons: { [key: string]: any };
      createIcons: () => void;
    };
    Recharts: any;
  }
}

export type RelationshipStatus = 'connected' | 'pending_sent' | 'pending_received' | 'not_connected';
export type AccessLevel = 'viewer' | 'contributor' | 'collaborator';

export enum DocumentType {
  BirthCertificate = 'Birth Certificate',
  MarriageCertificate = 'Marriage Certificate',
  DeathCertificate = 'Death Certificate',
  Other = 'Other',
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  url: string; // This will be a data URL
  fileType: string; // e.g., 'application/pdf', 'image/png'
}

export interface FamilyMember {
  id: string;
  name: string;
  imageUrl: string;
  /** Should be in YYYY-MM-DD format */
  birthDate: string;
  /** Should be in YYYY-MM-DD format */
  deathDate?: string;
  profession?: string;
  birthPlace?: string;
  relationshipStatus?: RelationshipStatus;
  accessLevel?: AccessLevel;
  spouse?: {
    id: string;
    name: string;
    imageUrl: string;
    birthDate?: string;
    deathDate?: string;
    profession?: string;
    birthPlace?: string;
    documents?: Document[];
  };
  children?: FamilyMember[];
  stories?: string[];
  documents?: Document[];
}

export interface Comment {
  id: string;
  author: string;
  authorImage: string;
  text: string;
}

export interface Post {
  id: string;
  author: string;
  authorImage: string;
  timestamp: string;
  content: string;
  image?: string;
  voiceNote?: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
}

export type NotificationType = 'family_request' | 'request_accepted' | 'comment' | 'like' | 'tree_update' | 'new_post' | 'birthday' | 'new_connection';

export interface Notification {
  id: string;
  type: NotificationType;
  actor: {
    name: string;
    imageUrl: string;
  };
  timestamp: string;
  message: string;
  isRead: boolean;
  relatedMemberId?: string; // For family requests
  linkTo?: View;
}


export type View = 'tree' | 'wall' | 'vault' | 'contacts' | 'profile' | 'notifications' | 'relativeProfile';

export type CallType = 'video' | 'audio';

export interface CallInfo {
  contacts: FamilyMember[];
  type: CallType;
}

export interface User {
  name: string;
  imageUrl: string;
}