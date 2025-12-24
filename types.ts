
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  FIRMS = 'FIRMS',
  MODELS = 'MODELS',
  TEAM = 'TEAM',
  SHOOTS = 'SHOOTS',
  BILLING = 'BILLING',
  USERS = 'USERS',
}

export enum ShootType {
  STUDIO_REELS = 'Studio Reels',
  OUTDOOR_REELS = 'Outdoor Reels',
  STORE_REELS = 'Store Reels',
  LIVE = 'Live',
  ADVT = 'Advt.',
  YOUTUBE_INFLUENCER = 'YouTube Influencer',
  YOUTUBE_VIDEO = 'YouTube Video',
  YOUTUBE_SHORTS = 'YouTube Shorts',
  OTHER = 'Other',
}

export enum FloorType {
  SAREE = 'Saree',
  SALWAR = 'Salwar',
  LEHENGA = 'Lehenga',
  KURTI = 'Kurti',
  MENS_ETHNIC = 'Mens Ethnic',
  GIRLS = 'Girls',
  BOYS = 'Boys',
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'ADMIN' | 'USER';
  name: string;
}

export interface CategoryPermission {
  category: string;
  visible: boolean;
  editable: boolean;
}

export interface AccessConfig {
  userPermissions: CategoryPermission[];
}

export interface Firm {
  id: string;
  name: string;
  storeName?: string;
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  gstin?: string;
}

export type StaffType = 'Inhouse' | 'Outsource' | 'Store';

export interface CrewCharges {
  indoor: number;
  outdoor: number;
  live?: number;
  custom: number;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
}

export interface FloorManager {
  id: string;
  name: string;
  phone: string;
  rate: number;
  charges?: CrewCharges;
  travelCharges?: number;
  role: string;
  staffType: StaffType;
  address?: string;
  pan?: string;
  gstin?: string;
  bankDetails?: BankDetails;
  documents: string[];
}

export interface ModelCharges {
  indoorReels: number;
  outdoorReels: number;
  storeReels: number;
  live: number;
  advt: number;
  youtubeInfluencer: number;
  youtubeVideo: number;
  youtubeShorts: number;
  custom: number;
}

export interface Model {
  id: string;
  name: string;
  billingName?: string; 
  address?: string;
  email?: string;
  gstin?: string;
  creditDays?: number;
  profileType: string[];
  connectionType?: 'Model Agency' | 'Freelance';
  instagram?: string;
  phone?: string;
  measurements: string;
  measurementRefImage?: string;
  charges: ModelCharges;
  travelCharges: number;
  documents: string[];
  gallery: string[];
  primaryImage?: string;
  remarks: string;
  joinDate: string;
  pan?: string;
  bankDetails?: BankDetails;
}

export interface CrewMember {
  role: string;
  name: string;
  rate: number;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  date: string;
  estimatedAmount: number;
  actualAmount: number;
  paymentStatus: 'Pending' | 'Advance' | 'Cash' | 'Part' | 'Full';
  paidAmount: number;
  remark?: string;
  attachments: string[];
  linkedId?: string; 
}

export interface Shoot {
  id: string;
  title: string;
  campaignDetails?: string;
  moodBoard?: string[];
  type: ShootType;
  page?: string; 
  date: string;
  locationType: 'Studio' | 'Outdoor' | 'Store';
  locationName: string;
  floors: FloorType[];
  modelIds: string[];
  floorManagerIds: string[];
  crew: CrewMember[];
  budget: number; 
  expenses: Expense[];
  status: 'Planning' | 'Scheduled' | 'In Progress' | 'Completed' | 'Postponed' | 'Cancelled';
  productDetails?: string; 
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  tdsRate?: number;
  isNote?: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  shootId: string;
  firmId: string;
  recipientName?: string; 
  recipientId?: string;
  billingCategory?: 'Service' | 'Travel';
  items: InvoiceItem[];
  total: number;
  type: 'INVOICE' | 'PO';
}
