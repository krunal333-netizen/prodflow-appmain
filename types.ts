
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
  INDOOR_REELS = 'Indoor Reels',
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
  username: string; // Email
  password?: string; // Optional: Only for creation forms, not stored
  role: 'ADMIN' | 'USER';
  name: string;
}

export interface Firm {
  id: string;
  name: string; // Legal Name (e.g. K S Trading)
  storeName?: string; // Brand/Store Name (e.g. G3+)
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  gstin?: string;
}

export type StaffType = 'Inhouse' | 'Outsource' | 'Store';

export interface FloorManager {
  id: string;
  name: string;
  phone: string;
  rate: number;
  travelCharges?: number;
  role: string;
  staffType: StaffType;
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
  custom: number; // Renamed from special
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
}

export interface Model {
  id: string;
  name: string;
  address?: string; // Added for Joining Form
  email?: string;   // Added for Joining Form
  gstin?: string;   // Added for Joining Form
  creditDays?: number; // Added for Joining Form
  profileType: string[]; // Changed to Array for Multi-Select
  connectionType?: 'Model Agency' | 'Freelance';
  instagram?: string;
  phone?: string;
  measurements: string;
  measurementRefImage?: string;
  charges: ModelCharges;
  travelCharges: number;
  documents: string[];
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

export interface Shoot {
  id: string;
  title: string;
  type: ShootType;
  page?: string; 
  date: string;
  locationType: 'Indoor' | 'Outdoor' | 'Store';
  locationName: string;
  floors: FloorType[];
  modelIds: string[];
  floorManagerIds: string[];
  crew: CrewMember[];
  budget: number;
  expenses: Expense[];
  status: 'Planned' | 'Completed' | 'Cancelled';
  productDetails?: string; 
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  date: string;
  estimatedAmount: number;
  actualAmount: number;
  paymentStatus: 'Pending' | 'Advance' | 'Part' | 'Full';
  paidAmount: number;
  attachments: string[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  tdsRate?: number;
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