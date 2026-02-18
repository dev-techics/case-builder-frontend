export interface Template {
  id: string;
  name: string;
  description: string;
  type: 'front' | 'back';
  templateKey: string;
  isDefault: boolean;
  html: string;
  lexicalJson: any;
  createdAt: string;
  updatedAt: string;
}
