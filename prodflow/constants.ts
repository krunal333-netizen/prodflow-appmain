
import { FloorType, ShootType } from "./types";

export const SHOOT_TYPES = Object.values(ShootType);
export const FLOOR_TYPES = Object.values(FloorType);
export const STAFF_TYPES = ['Inhouse', 'Outsource', 'Store'];

export const PROFILE_TYPES = [
  'G3Surat',
  'G3Mens',
  'G3Kids',
  'G3Fashion',
  'G3NXT',
  'Youtube',
  'Live'
];

export const CREW_ROLES = [
  'Floor Manager',
  'Makeup Artist',
  'Helper',
  'DOP',
  'Videographer',
  'Photographer',
  'Light Boy',
  'Stylist',
  'Editor',
  'Creative Director',
  'Assistant'
];

export const EXPENSE_CATEGORIES = [
  'Location',
  'Food',
  'Lunch',
  'Breakfast',
  'Tea-Coffee',
  'Groceries',
  'Cutlery',
  'Travelling',
  'Transportation',
  'Decoration',
  'Props',
  'Jewellery',
  'Footwear',
  'Snacks',
  'Drinks',
  'Equipment',
  'Custom'
];

// Configuration for Firms and Page Mappings
export const FIRM_IDS = {
  KS_TRADING: 'firm_ks_trading',
  SS_SALES: 'firm_ss_sales'
};

export const INITIAL_FIRMS = [
  {
    id: FIRM_IDS.KS_TRADING,
    name: 'K S Trading',
    storeName: 'G3+',
    address: 'Plot no.F7 to F8, Sayan textile park, Nr.RJD textile park,\nHazira road, icchapore, surat - 394510',
    phone: '+91 98765 43210',
    email: 'accounts@g3plus.com',
    logoUrl: '', 
    gstin: ''
  },
  {
    id: FIRM_IDS.SS_SALES,
    name: 'S S Sales',
    storeName: 'G3NXT',
    address: 'Ghod Dod Road, Surat - 395007',
    phone: '+91 98765 43211',
    email: 'accounts@g3nxt.com',
    logoUrl: '',
    gstin: ''
  }
];

// Maps Brand Pages to their parent Firm ID
export const PAGE_TO_FIRM_MAP: Record<string, string> = {
  'G3Surat': FIRM_IDS.KS_TRADING,
  'G3Mens': FIRM_IDS.KS_TRADING,
  'G3Kids': FIRM_IDS.KS_TRADING,
  'Youtube': FIRM_IDS.KS_TRADING,
  'G3Fashion': FIRM_IDS.KS_TRADING, // Defaulting to KS Trading
  'Live': FIRM_IDS.KS_TRADING, // Defaulting to KS Trading
  'G3NXT': FIRM_IDS.SS_SALES,
};
