/**
 * Sparqly API Type Definitions
 * Based on the backend API documentation.
 */

export interface User {
  id: string;
  email: string | null;
  username: string | null;
  fullName: string | null;
  provider: string;
  photo?: FileType;
  role?: Role;
  status?: Status;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileType {
  id: string;
  path: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface Status {
  id: number;
  name: string;
}

export interface Wallet {
  balance: number;
  bonusBalance: number;
  totalBalance: number;
}

export interface PlatformAccount {
  id: string;
  platform: 'youtube' | 'linkedin' | 'instagram';
  accountName: string;
  profileImageUrl?: string;
  isConnected: boolean;
  createdAt: string;
}

export interface Content {
  id: string;
  title: string;
  description?: string;
  type: string;
  url?: string;
  createdAt: string;
}

export interface ScheduledPost {
  id: string;
  content: Content;
  platformAccount: PlatformAccount;
  scheduledAt: string;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  errorMessage?: string;
  createdAt: string;
}

export interface AiJob {
  id: string;
  jobType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  input?: any;
  output?: any;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface InfinityPaginationResponse<T> {
  data: T[];
  hasNextPage: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: User;
}
