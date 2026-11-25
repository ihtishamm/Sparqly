/** Response shapes of the Sparqly API (`/api/v1`). */

export type Paginated<T> = { data: T[]; hasNextPage: boolean };

export type User = {
  id: string;
  email: string | null;
  provider: 'email' | 'google' | string;
  username: string | null;
  fullName: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  role?: { id: number } | null;
  status?: { id: number } | null;
  createdAt: string;
};

/** The API also sets the refresh token as an HttpOnly cookie. */
export type LoginResponse = {
  token: string;
  tokenExpires: number;
  user: User;
};

/* ------------------------------- AI jobs -------------------------------- */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type RepurposeStage =
  | 'downloading'
  | 'transcribing'
  | 'detecting'
  | 'cutting'
  | 'writing'
  | 'generating';

export type AiJob = {
  id: string;
  jobType: string;
  status: JobStatus | string;
  stage?: string | null;
  errorMessage?: string | null;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  content?: { id: string; title?: string | null } | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
};

/* ------------------------------- Projects ------------------------------- */

export type ProjectJob = {
  id: string;
  jobType: string;
  status: string;
  stage: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type ProjectSummary = {
  id: string;
  title: string | null;
  description: string | null;
  status: string;
  sourceType: string;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
  clipCount: number;
  documentCount: number;
  assetCount: number;
  scheduledCount: number;
  latestJob: ProjectJob | null;
  createdAt: string;
  updatedAt: string;
};

export type Asset = {
  id: string;
  type: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes?: number | null;
  metadata: Record<string, any> | null;
  createdAt?: string;
};

export type RenderJob = {
  id: string;
  compositionId: string | null;
  status: string;
  outputFormat: string;
  outputUrl: string | null;
  durationMs: number | null;
  sizeBytes: number | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type ProjectClip = {
  variantId: string;
  title: string | null;
  status: string;
  versionId: string | null;
  compositionId: string | null;
  durationMs: number | null;
  clipUrl: string | null;
  render: RenderJob | null;
  createdAt: string;
};

export type DocumentType =
  | 'blog-post'
  | 'linkedin-post'
  | 'twitter-thread'
  | 'script'
  | 'summary'
  | 'transcript';

export type ProjectDocument = {
  variantId: string;
  type: DocumentType | string;
  title: string | null;
  status: string;
  versionId: string | null;
  versionNumber: number | null;
  text: string;
  editable: boolean;
  updatedAt: string;
};

export type ProjectDetail = ProjectSummary & {
  assets: Asset[];
  clips: ProjectClip[];
  documents: ProjectDocument[];
  jobs: ProjectJob[];
};

/* ------------------------------- Timeline ------------------------------- */

export type TrackType = 'video' | 'audio' | 'text' | 'image';

export type TimelineElement = {
  id?: string;
  type: TrackType;
  startTimeMs: number;
  endTimeMs: number;
  layer: number;
  properties: Record<string, any>;
  assetId: string | null;
};

export type TimelineTrack = {
  id?: string;
  type: TrackType;
  trackOrder: number;
  metadata: Record<string, any> | null;
  elements: TimelineElement[];
};

export type EditorComposition = {
  id: string;
  title: string;
  contentId: string | null;
  variantId: string | null;
  contentVersionId: string | null;
  durationMs: number;
  fps: number;
  resolutionWidth: number;
  resolutionHeight: number;
  backgroundColor: string;
  updatedAt: string;
  tracks: TimelineTrack[];
  assets: Asset[];
};

/* ---------------------------- Publishing -------------------------------- */

export type Platform = 'youtube' | 'linkedin' | 'instagram';

export type PlatformAccount = {
  id: string;
  platform: Platform;
  accountName: string | null;
  accountIdentifier: string | null;
  tokenExpiresAt: string | null;
  /** Token expired and can't be refreshed: the user must connect again. */
  needsReconnect?: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

export type ScheduledPostStatus =
  | 'scheduled'
  | 'processing'
  | 'published'
  | 'failed'
  | 'cancelled';

export type ScheduledPost = {
  id: string;
  scheduledAt: string;
  status: ScheduledPostStatus;
  metadata: {
    caption?: string;
    title?: string;
    hashtags?: string[];
    postUrl?: string;
    lastError?: string;
    publishedAt?: string;
    [key: string]: unknown;
  } | null;
  platformAccount: PlatformAccount;
  contentVariant?: {
    id: string;
    type: string;
    title: string | null;
    content?: { id: string; title: string | null } | null;
  } | null;
  contentVersion?: { id: string } | null;
  content?: { id: string; title: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

/* ------------------------------- Billing -------------------------------- */

export type Wallet = {
  balance: number;
  planCredits: number;
  extraCredits: number;
  rolledOverCredits: number;
  proratedCredits: number;
  usageCount: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  status?: string;
  priceId?: string | null;
  cancelAtPeriodEnd?: boolean;
};

export type Plan = {
  priceId: string;
  credits: number;
  name: string;
  price: number;
  mode: 'subscription' | 'payment';
};

export type CreditTransaction = {
  id: string;
  type: 'allocation' | 'usage' | 'purchase' | 'refund' | 'adjustment' | string;
  amount: number;
  description?: string | null;
  createdAt: string;
};

/* ------------------------------ Analytics ------------------------------- */

/** A published post with its latest totals in the selected range. */
export type PostPerformance = {
  id: string;
  title: string | null;
  contentId: string | null;
  variantType: string | null;
  platform: string;
  accountId: string;
  accountName: string | null;
  postUrl: string | null;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  /** Views gained within the range. */
  viewsInRange: number;
  lastSyncedAt: string | null;
};

export type AccountPerformance = {
  accountId: string;
  platform: string;
  accountName: string | null;
  posts: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  viewsInRange: number;
  engagementRate: number;
  topPostId: string | null;
};

export type AnalyticsOverview = {
  kpis: {
    totalPosts: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    growth: number | null;
  };
  timeSeries: Array<{ date: string; views: number; engagement: number }>;
  platformBreakdown: Array<{ name: string; value: number; color: string }>;
  lastSyncedAt: string | null;
};

/* ------------------------------- Activity ------------------------------- */

export type Activity = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
};
