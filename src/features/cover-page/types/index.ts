export interface Template {
  id: string;
  templateKey?: string;
  name: string;
  description: string;
  type: 'front' | 'back';
  isDefault: boolean;
  html: string;
  lexicalJson: any;
  createdAt: string;
  updatedAt: string;
}
