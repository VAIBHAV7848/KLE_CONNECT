export type UserRole = 'user' | 'moderator' | 'ops_admin' | 'super_admin';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: UserRole;
    createdAt?: number;
    lastLogin?: number;
}
