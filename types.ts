export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum LeadStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  ACCEPTED = 'ACCEPTED',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum LeadType {
  HOT = 'HOT',
  WARM = 'WARM',
  COLD = 'COLD',
}

export interface UserPermissions {
  canEdit: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  permissions?: UserPermissions;
  password?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface SocialLink {
  type: 'Instagram' | 'Website' | 'Social' | 'Other';
  url: string;
}

export interface InteractionLog {
  id: string;
  type: 'COMMENT' | 'SMS' | 'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP';
  content: string;
  createdBy: string;
  createdAt: string;
}

export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Lead {
  id: string;
  userId: string;
  userName?: string; 
  assignedTo?: string;
  assignedToName?: string;
  assignedToEmail?: string; 
  
  ownerName: string;
  mainPoc?: string;
  mobile: string;
  email: string;
  
  latitude?: number;
  longitude?: number;

  crNumber: string;
  crFileName?: string;
  crFileData?: string;
  industry: string;
  subIndustry?: string;
  platform?: string;
  acquirer?: string;
  gmv?: string;
  leadSource?: string;
  
  serviceNeeded: string;
  socialLinks: SocialLink[];
  remarks: string;
  remarksLocked: boolean;
  adminComments?: string;
  
  status: LeadStatus;
  leadType: LeadType;
  isFavorite: boolean; 
  interactionLog: InteractionLog[];
  
  createdAt: string;
  updatedAt: string;
  syncStatus?: SyncStatus;
}

export interface Meeting {
  id: string;
  userId: string;
  title: string;
  date: string; 
  time: string;
  description?: string;
  imageData?: string;
  reminder: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  dueDate: string; 
  isCompleted: boolean;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  newToday: number;
  newThisMonth: number;
  leadsByIndustry: { name: string; value: number }[];
  leadsByService: { name: string; value: number }[];
  leadsByStatus: { name: string; value: number }[]; 
  upcomingMeetings: Meeting[];
  pendingTasks: Lead[];
  favoriteLeads: Lead[];
}

export interface FormConfig {
  industries: { name: string; subIndustries: string[] }[];
  platforms: string[];
  acquirers: string[];
  leadSources: string[];
  gmvRanges: string[];
}

export interface SMTPConfig {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    secure?: boolean;
    encryption?: 'ssl' | 'tls' | 'starttls' | 'none';
    fromAddress?: string;
    fromName?: string;
}

export interface AppSettings {
  id: string;
  appName: string;
  appIconUrl: string;
  config?: FormConfig;
  smtpConfig?: SMTPConfig;
}

export const DEFAULT_CONFIG: FormConfig = {
  industries: [
    { name: 'Retail', subIndustries: ['Fashion', 'Grocery', 'Electronics', 'Home & Decor', 'Other'] },
    { name: 'F&B', subIndustries: ['Restaurant', 'Cafe', 'Cloud Kitchen', 'Bakery', 'Catering'] },
    { name: 'Services', subIndustries: ['Consulting', 'Agency', 'Legal', 'Cleaning', 'Maintenance'] },
    { name: 'Healthcare', subIndustries: ['Clinic', 'Pharmacy', 'Hospital', 'Wellness Center'] },
    { name: 'Real Estate', subIndustries: ['Agency', 'Developer', 'Property Management'] },
    { name: 'Other', subIndustries: ['Other'] }
  ],
  platforms: ['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Wix', 'Custom Code', 'None/Offline'],
  acquirers: ['Bank Muscat', 'NBO', 'Thawani', 'ONEIC', 'Network International', 'Cybersource', 'None'],
  leadSources: ['Organic', 'Self', 'Google Ads', 'Social Media', 'Referral', 'Event', 'Cold Call'],
  gmvRanges: ['0 - 5,000 OMR', '5,000 - 20,000 OMR', '20,000 - 50,000 OMR', 'More than 50,000 OMR']
};

export const SERVICES = [
  'Ecommerce website',
  'Business website',
  'Profile website',
  'POS',
  'Payment Gateway'
];