export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface KnowledgeItem {
  question: string;
  answer: string;
}

export enum UploadTab {
  MANUAL = 'manual',
  UPLOAD = 'upload'
}