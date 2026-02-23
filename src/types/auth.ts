export type UserRole = 'student' | 'ops_admin' | 'super_admin';

export interface User {
    uid: string;
    email: string;
    displayName: string;
    phoneNumber?: string;
    photoURL?: string;
    role?: UserRole;
}

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: UserRole;
    isOwner?: boolean; // Added for Platform Owner Protection
    createdAt?: number;
    lastLogin?: number;
}
