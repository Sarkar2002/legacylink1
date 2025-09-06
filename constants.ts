import { FamilyMember, Post, User, Notification, DocumentType, AccessLevel } from './types';

// --- Procedural Generation for Large Family Trees ---

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Riya', 'Saanvi', 'Aanya', 'Aarohi', 'Ananya', 'Diya', 'Pari', 'Myra', 'Anika', 'Sara'];
const lastNames = ['Singh', 'Kumar', 'Patel', 'Sharma', 'Shah', 'Gupta', 'Verma', 'Das', 'Roy', 'Mehta'];
const professions = ['Farmer', 'Artisan', 'Merchant', 'Scholar', 'Warrior', 'Healer', 'Scribe', 'Builder', 'Explorer', 'Leader'];
const places = ['Indrapura', 'Suryagram', 'Chandranagar', 'Vanadurga', 'Jalapuri'];

let memberIdCounter = 0;

const generateRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const generateRandomDate = (startYear: number, endYear: number): string => {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'); // Keep it simple
  return `${year}-${month}-${day}`;
};

const generateMember = (birthYear: number, depth: number): FamilyMember => {
    const isConnected = depth < 3;
    const member: FamilyMember = {
        id: `gen-${memberIdCounter++}`,
        name: `${generateRandom(firstNames)} ${generateRandom(lastNames)}`,
        imageUrl: `https://picsum.photos/seed/${Math.random()}/200`,
        birthDate: generateRandomDate(birthYear, birthYear + 5),
        profession: generateRandom(professions),
        birthPlace: generateRandom(places),
        relationshipStatus: isConnected ? 'connected' : 'not_connected',
        accessLevel: isConnected ? 'collaborator' : undefined,
    };
    // 70% chance of dying after 60-80 years
    if (Math.random() < 0.7) {
        const deathYear = birthYear + Math.floor(Math.random() * 21) + 60;
        member.deathDate = generateRandomDate(deathYear, deathYear + 5);
    }
    // Add a document sometimes
    if (Math.random() < 0.2) {
      member.documents = [{
        id: `doc-${Date.now()}`,
        name: 'Birth Certificate (Sample)',
        type: DocumentType.BirthCertificate,
        url: '#',
        fileType: 'application/pdf',
      }];
    }
    // 80% chance of having a spouse
    if (Math.random() < 0.8) {
        member.spouse = {
            id: `spouse-${memberIdCounter++}`,
            name: `${generateRandom(firstNames)} ${generateRandom(lastNames)}`,
            imageUrl: `https://picsum.photos/seed/${Math.random()}/200`,
            birthDate: generateRandomDate(birthYear, birthYear + 5),
        };
    }
    return member;
};

/**
 * Generates a family tree with a specified number of generations.
 * @param maxDepth The total number of generations to create.
 */
export const generateGenerations = (maxDepth: number): FamilyMember => {
    // Reset counter for consistent IDs if regenerated
    memberIdCounter = 0;
    const root = generateMember(1850, 1);
    root.relationshipStatus = 'connected';
    root.accessLevel = 'collaborator';
    
    const addChildren = (parent: FamilyMember, currentDepth: number, parentBirthYear: number) => {
        if (currentDepth >= maxDepth) {
            return;
        }

        parent.children = [];
        const numChildren = Math.floor(Math.random() * 3) + 1; // 1-3 children
        const childBirthYear = parentBirthYear + Math.floor(Math.random() * 10) + 20;

        for (let i = 0; i < numChildren; i++) {
            const child = generateMember(childBirthYear, currentDepth + 1);
            addChildren(child, currentDepth + 1, childBirthYear);
            parent.children.push(child);
        }
    };

    addChildren(root, 1, 1850);
    return root;
};


export const memoryWallPosts: Post[] = [
    { 
        id: 'p1', 
        author: 'A. Singh', 
        authorImage: 'https://picsum.photos/seed/user/40', 
        timestamp: '3 hours ago', 
        content: 'Remembering grandfather Rohan. A true visionary.', 
        image: 'https://picsum.photos/seed/p1/400/200',
        likes: 12,
        isLiked: false,
        comments: [
            { id: 'c1', author: 'Sameer Singh', authorImage: 'https://picsum.photos/seed/9/100', text: 'He truly was.' },
            { id: 'c2', author: 'A. Singh', authorImage: 'https://picsum.photos/seed/user/40', text: 'Beautiful picture!' }
        ]
    },
    { 
        id: 'p2', 
        author: 'Sameer Singh', 
        authorImage: 'https://picsum.photos/seed/9/100', 
        timestamp: '1 day ago', 
        content: 'Found this old map of our ancestral lands in Rajpur. So much history!', 
        image: 'https://picsum.photos/seed/p2/400/200',
        likes: 5,
        isLiked: false,
        comments: []
    },
    { 
        id: 'p3', 
        author: 'A. Singh', 
        authorImage: 'https://picsum.photos/seed/user/40', 
        timestamp: '2 days ago', 
        content: 'A voice note from my travels as a diplomat. The world has changed so much.', 
        voiceNote: '#',
        likes: 2,
        isLiked: false,
        comments: []
    },
];

export const currentUser: User = {
    name: 'A. Singh',
    imageUrl: 'https://picsum.photos/seed/user/40',
};

export const initialNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'family_request',
    actor: { name: 'Riya Patel', imageUrl: 'https://picsum.photos/seed/riya/100' },
    timestamp: '2 hours ago',
    message: 'sent you a family request.',
    isRead: false,
    relatedMemberId: 'gen-15'
  },
  {
    id: 'n2',
    type: 'like',
    actor: { name: 'Sameer Singh', imageUrl: 'https://picsum.photos/seed/9/100' },
    timestamp: '5 hours ago',
    message: 'liked your post on the Memory Wall.',
    isRead: false,
  },
  {
    id: 'n3',
    type: 'comment',
    actor: { name: 'Anika Sharma', imageUrl: 'https://picsum.photos/seed/anika/100' },
    timestamp: '1 day ago',
    message: 'commented on your memory: "What a wonderful story!"',
    isRead: true,
  },
  {
    id: 'n4',
    type: 'request_accepted',
    actor: { name: 'Arjun Kumar', imageUrl: 'https://picsum.photos/seed/arjun/100' },
    timestamp: '2 days ago',
    message: 'accepted your family request.',
    isRead: true,
  }
];