export interface GeneratedImage {
  id: string;
  base64: string; // The full data URI (data:image/png;base64,...)
  prompt: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GenerationRequest {
  prompt: string;
  referenceImage?: string; // Base64 string for remixing
}