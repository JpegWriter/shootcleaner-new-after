// Global type definitions for ShootCleaner Premium

export interface ImageAnalysisResult {
  filename: string
  decision: 'keep' | 'reject' | 'review'
  confidence: number
  rationale: string
  artisticScore?: number
  badges?: string[]
  technicalIssues?: string[]
  styleNotes?: string
  similarTo?: string[]
  commands?: ImageMagickCommand[]
  timestamp: string
  id?: string
}

export interface ImageMagickCommand {
  operation: string
  params?: string[]
  parameters?: Record<string, any>
  description?: string
}

export interface VisionAnalysisResult {
  images: ImageAnalysisResult[]
  sessionId: string
  totalProcessed: number
  averageConfidence: number
  summary?: string
  createdAt: string
}

export interface EnhancementResult {
  success: boolean
  outputPath?: string
  error?: string
  command?: string
  originalPath: string
  enhancementType: string
}

export interface ProcessedImage {
  id: string
  name: string
  originalPath: string
  previewPath: string
  hdPath: string
  isRaw: boolean
  metadata: {
    camera: string
    lens: string
    iso: number
    aperture: string
    shutter: string
    focal: string
    date: string
    originalWidth: number
    originalHeight: number
    fileSize: string
    format: string
    colorSpace: string
    whiteBalance: string
  }
}

export interface ImportProgress {
  overall: number
  current: number
  fileName: string
  stage: string
}

export interface ImportSettings {
  previewMaxSize: number
  hdMaxSize: number
  jpegQuality: number
  previewQuality: number
}

export interface UserProfile {
  openaiApiKey?: string
  portfolioLinks: string[]
  favoriteImages: File[]
  presets: any[]
  rejectCriteria: {
    commonIssues: string[]
    customRules: string
  }
  completedAt: string
  lastUpdated: string
}

export interface Album {
  id: string
  name: string
  coverImage?: string
  imageCount: number
  createdAt: string
  updatedAt: string
  importSettings?: ImportSettings
  cullingStats?: CullingStats;
}

export interface ImportSettings {
  includeSubfolders: boolean;
  fileTypes: ('RAW' | 'JPEG' | 'PNG' | 'TIFF')[];
  backupOriginals: boolean;
  generatePreviews: boolean;
  sessionType: 'wedding' | 'portrait' | 'landscape' | 'event' | 'other';
}

export interface CullingStats {
  totalImages: number;
  kept: number;
  rejected: number;
  review: number;
  duplicates: number;
  blurred: number;
  closedEyes: number;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt';
  openaiApiKey?: string;
  openaiAssistantId: string;
  defaultImportSettings: ImportSettings;
  cullingPreferences: CullingPreferences;
}

export interface CullingPreferences {
  autoRejectBlurred: boolean;
  autoRejectClosedEyes: boolean;
  autoRejectDuplicates: boolean;
  confidenceThreshold: number;
  batchSize: number;
}

export interface AIProfile {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  settings: {
    style: string;
    creativity: number;
    technical: boolean;
    artistic: boolean;
  };
  isCustom: boolean;
  createdAt: string;
}

export interface LicenseInfo {
  key: string;
  status: 'active' | 'expired' | 'invalid';
  expiresAt?: string;
  features: string[];
  maxAlbums: number;
  maxImagesPerMonth: number;
}

export interface ProcessingQueue {
  id: string;
  type: 'import' | 'analyze' | 'enhance' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  totalItems: number;
  processedItems: number;
  errorMessage?: string;
  createdAt: string;
}

// Processing Result
export interface ProcessingResult {
  success: boolean
  outputPath: string
  metadata?: ProcessedImage['metadata']
  error?: string
  processingTime?: number
  settings?: any
}

// Enhancement Settings
export interface EnhancementSettings {
  brightness: number
  contrast: number
  saturation: number
  exposure: number
  highlights: number
  shadows: number
  temperature: number
  tint: number
  sharpening: number
  noiseReduction: number
  format: 'jpeg' | 'png' | 'tiff' | 'webp'
  quality: number
  resize: boolean
  width: number
  height: number
  maintainAspectRatio: boolean
}

// Photo Session Management
export type SessionStatus = 'active' | 'processing' | 'completed' | 'archived'

export interface PhotoSession {
  id: string
  name: string
  date: Date
  location: string
  client: string
  status: SessionStatus
  imageCount: number
  selectedCount: number
  rating: number
  tags: string[]
  albums: string[]
  createdAt: Date
  updatedAt: Date
  description?: string
  notes?: string
}

// Electron API types
export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getName: () => Promise<string>;
  showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>;
  showItemInFolder: (path: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  processImages: (images: any[]) => Promise<any>;
  analyzeWithOpenAI: (imageData: any) => Promise<ImageAnalysisResult>;
  getSettings: () => Promise<UserSettings>;
  setSettings: (settings: UserSettings) => Promise<void>;
  validateLicense: (licenseKey: string) => Promise<LicenseInfo>;
  getLicenseInfo: () => Promise<LicenseInfo>;
  
  // ImageMagick processing
  checkImageMagick: () => Promise<{ available: boolean, version?: string, error?: string, message: string }>;
  processImageMagick: (params: { inputPath: string, outputPath: string, commands: any[] }) => Promise<any>;
  batchProcessImages: (params: { images: any[], settings: any }) => Promise<any>;
  downloadFile: (filePath: string, filename: string) => Promise<void>;
}

// Extend Window interface for Electron APIs
declare global {
  interface Window {
    electron: any;
    api: ElectronAPI;
  }
}
