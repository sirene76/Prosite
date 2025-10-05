export interface DashboardWebsite {
  _id: string;
  name: string;
  status?: string;
  templateId?: string;
  plan?: string;
  thumbnailUrl?: string;
  previewImage?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}
