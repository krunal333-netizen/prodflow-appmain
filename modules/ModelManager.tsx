
import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Model, BankDetails } from '../types';
import { PROFILE_TYPES } from '../constants';
import { Card, Input, Button, Modal, Select, ConfirmationModal } from '../components/UI';
import { 
  Users, Plus, Edit2, Search, FileText, Instagram, Trash2, Link, MapPin, 
  ExternalLink, User, Smartphone, CheckCircle2, Banknote, Video, Tv, 
  ShoppingBag, Youtube, Plane, Filter, Zap, ShieldCheck, CreditCard, 
  Landmark, Upload, X, ImageIcon, Eye, Sparkles, Loader2, FileSearch,
  MoreVertical, Printer, Info, Hash, Mail, Layers, Copy, Check, Star
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { extractModelDetailsFromImage } from '../services/geminiService';

export const ModelManager: React.FC = () => {
  const { models, addModel, updateModel, deleteModel, globalSearch, setGlobalSearch, notify } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filterConnection, setFilterConnection] = useState('All');
  
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [viewingModel, setViewingModel] = useState<Model | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const docInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');

  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialModel: Model = {
    id: '',
    name: '',
    billingName: '',
    address: '',
    email: '',
    gstin: '',
    creditDays: 7,
    profileType: [],
    connectionType: 'Freelance',
    instagram: '',
    phone: '+91 ',
    measurements: '',
    measurementRefImage: '',
    charges: {
      indoorReels: 0,
      outdoorReels: 0,
      storeReels: 0,
      live: 0,
      advt: 0,
      youtubeInfluencer: 0,
      youtubeVideo: 0,
      youtubeShorts: 0,
      custom: 0
    },
    travelCharges: 0,
    documents: [],
    gallery: [],
    primaryImage: '',
    remarks: '',
    joinDate: new Date().toISOString().split('T')[0],
    pan: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: ''
    }
  };

  const [formData, setFormData] = useState<Model>(initialModel);

  const openNewModel = () => {
    setFormData({ ...initialModel, id: uuidv4() });
    setEditingModel(null);
    setIsModalOpen(true);
  };

  const openEditModel = (model: Model) => {
    // Explicitly define charges to satisfy strict TypeScript requirement
    const charges: ModelCharges = {
      indoorReels: model.charges?.indoorReels ?? 0,
      outdoorReels: model.charges?.outdoorReels ?? 0,
      storeReels: model.charges?.storeReels ?? 0,
      live: model.charges?.live ?? 0,
      advt: model.charges?.advt ?? 0,
      youtubeInfluencer: model.charges?.youtubeInfluencer ?? 0,
      youtubeVideo: model.charges?.youtubeVideo ?? 0,
      youtubeShorts: model.charges?.youtubeShorts ?? 0,
      custom: model.charges?.custom ?? 0
    };

    // Explicitly define bankDetails to satisfy strict TypeScript requirement (TS2322)
    const bankDetails: BankDetails = {
      bankName: model.bankDetails?.bankName ?? '',
      accountNumber: model.bankDetails?.accountNumber ?? '',
      ifscCode: model.bankDetails?.ifscCode ?? '',
      branchName: model.bankDetails?.branchName ?? ''
    };

    setFormData({
      ...initialModel,
      ...model,
      charges,
      bankDetails,
      profileType: Array.isArray(model.profileType) ? model.profileType : [model.profileType],
      documents: model.documents || [],
      gallery: model.gallery || [],
      primaryImage: model.primaryImage || ''
    });
    setEditingModel(model);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const openViewModel = (model: Model) => {
    setViewingModel(model);
    setIsViewModalOpen(true);
    setActiveMenuId(null);
    setIsCopied(false);
  };

  const handleCopyMeasurements = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      notify('Measurements copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const isValueBlank = (val: any) => {
    if (val === null || val === undefined) return true;
    const s = String(val).trim();
    return s === '' || s === '+91' || s === '+91 ' || s === '0';
  };

  const handleScanDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    const filesArray = Array.from(files) as File[];

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setScanProgress(`Processing file ${i + 1} of ${filesArray.length}...`);
        
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const extracted = await extractModelDetailsFromImage(base64, file.type);
        
        setFormData(prev => {
          const updated = { ...prev };
          if (isValueBlank(updated.name) && !isValueBlank(extracted.name)) updated.name = extracted.name!;
          if (isValueBlank(updated.phone) && !isValueBlank(extracted.phone)) updated.phone = extracted.phone!;
          if (isValueBlank(updated.address) && !isValueBlank(extracted.address)) updated.address = extracted.address!;
          if (isValueBlank(updated.pan) && !isValueBlank(extracted.pan)) updated.pan = extracted.pan!.toUpperCase();
          
          if (!isValueBlank(extracted.measurements)) {
            if (isValueBlank(updated.measurements)) {
              updated.measurements = extracted.measurements!;
            } else if (!updated.measurements.toLowerCase().includes(extracted.measurements!.toLowerCase())) {
              updated.measurements = `${updated.measurements}\n${extracted.measurements}`;
            }
          }

          if (extracted.bankDetails) {
            const currentBank = { ...(updated.bankDetails || initialModel.bankDetails!) };
            const newBank = extracted.bankDetails;
            if (isValueBlank(currentBank.bankName) && !isValueBlank(newBank.bankName)) currentBank.bankName = newBank.bankName!;
            if (isValueBlank(currentBank.accountNumber) && !isValueBlank(newBank.accountNumber)) currentBank.accountNumber = newBank.accountNumber!;
            if (isValueBlank(currentBank.ifscCode) && !isValueBlank(newBank.ifscCode)) currentBank.ifscCode = newBank.ifscCode!.toUpperCase();
            if (isValueBlank(currentBank.branchName) && !isValueBlank(newBank.branchName)) currentBank.branchName = newBank.branchName!;
            updated.bankDetails = currentBank;
          }
          return updated;
        });
      }
      notify('AI processing complete');
    } catch (error) {
      console.error("Scanning failed", error);
      notify("AI Scan failed for one or more files.", "error");
    } finally {
      setIsScanning(false);
      setScanProgress('');
      if (scanInputRef.current) scanInputRef.current.value = '';
    }
  };

  const initiateDelete = (model: Model) => {
    setModelToDelete(model);
    setActiveMenuId(null);
  };

  const confirmDeleteModel = async () => {
    if (modelToDelete) {
      setIsDeleting(true);
      try {
        await deleteModel(modelToDelete.id);
        notify('Talent record removed');
        setModelToDelete(null);
      } catch (e) {
        console.error("Failed to delete talent", e);
        notify('Failed to delete talent', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSave = () => {
    if (editingModel) {
      updateModel(formData);
      notify('Talent profile updated');
    } else {
      addModel(formData);
      notify('New talent registered successfully');
    }
    setIsModalOpen(false);
  };

  const handleChargeChange = (field: keyof Model['charges'], val: string) => {
    setFormData(prev => ({
      ...prev,
      charges: { ...prev.charges, [field]: Number(val) }
    }));
  };

  const handleProfileToggle = (profile: string) => {
    setFormData(prev => {
      const current = prev.profileType || [];
      const next = current.includes(profile) ? current.filter(p => p !== profile) : [...current, profile];
      return { ...prev, profileType: next };
    });
  };

  const toggleProfileFilter = (profile: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profile) 
        ? prev.filter(p => p !== profile) 
        : [...prev, profile]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'documents' | 'gallery') => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => {
          const newData = [...prev[field], reader.result as string];
          let primaryImg = prev.primaryImage;
          if (field === 'gallery' && !primaryImg) {
            primaryImg = reader.result as string;
          }
          return { ...prev, [field]: newData, primaryImage: primaryImg };
        });
      };
      reader.readAsDataURL(file as Blob);
    });
    notify(`Uploaded ${files.length} images to ${field}`);
    e.target.value = '';
  };

  const removeMedia = (index: number, field: 'documents' | 'gallery') => {
    setFormData(prev => {
      const filtered = prev[field].filter((_, i) => i !== index);
      let primary = prev.primaryImage;
      if (field === 'gallery' && primary === prev.gallery[index]) {
        primary = filtered.length > 0 ? filtered[0] : '';
      }
      return { ...prev, [field]: filtered, primaryImage: primary };
    });
    notify('Item removed');
  };

  const setPrimaryImage = (url: string) => {
    setFormData(prev => ({ ...prev, primaryImage: url }));
    notify('Primary image updated');
  };

  const filteredModels = models.filter(m => {
    const searchLower = globalSearch.toLowerCase();
    const mProfileTypes = Array.isArray(m.profileType) ? m.profileType : [m.profileType];
    const profileString = mProfileTypes.join(', ').toLowerCase();
    
    const matchesSearch = m.name.toLowerCase().includes(searchLower) || profileString.includes(searchLower) || (m.instagram && m.instagram.toLowerCase().includes(searchLower));
    const matchesConnection = filterConnection === 'All' || m.connectionType === filterConnection;
    const matchesProfile = selectedProfiles.length === 0 || selectedProfiles.every(p => mProfileTypes.includes(p));
    
    return matchesSearch && matchesConnection && matchesProfile;
  });

  const getProfileColor = (profile: string) => {
    switch (profile) {
      case 'G3Surat': return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'G3NXT': return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case 'G3Mens': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'G3Kids': return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'G3Fashion': return 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800';
      case 'Youtube': return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'G3+ Live': return 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800';
      case 'G3NXT Live': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      default: return 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-pink-100 dark:bg-pink-900/30 rounded-2xl text-pink-600 dark:text-pink-400 border border-pink-200/50 dark:border-pink-800/50 shadow-sm">
            <Users size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-lightText dark:text-white font-display tracking-tight leading-none">Talent Management</h1>
            <p className="text-lightTextSecondary dark:text-gray-400 text-sm font-medium mt-1.5 tracking-wide">Models, influencers and actors database</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={openNewModel} className="shadow-lg shadow-pink-500/20">
            <Plus size={18} strokeWidth={3} /> Add New Talent
          </Button>
        </div>
      </div>

      <Card className="no-print border-none bg-white dark:bg-navy-800 shadow-soft relative z-[50]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder="Search by name, profile, or handle..." 
                className="w-full h-[50px] pl-11 pr-4 border border-lightBorder dark:border-navy-700 rounded-xl focus:ring-4 focus:ring-lightPrimary/5 focus:border-lightPrimary outline-none bg-white dark:bg-navy-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-bold text-sm transition-all shadow-sm"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-64">
               <Select
                  icon={Link}
                  options={['All', 'Freelance', 'Model Agency']}
                  value={filterConnection}
                  onChange={(e) => setFilterConnection(e.target.value)}
                  placeholder="All Sources"
               />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-lightBorder dark:border-navy-700/50">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Layers size={14} className="text-lightPrimary" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-lightTextSecondary">Simultaneous Platform Filters</h4>
                </div>
                {selectedProfiles.length > 0 && (
                  <button 
                    onClick={() => setSelectedProfiles([])}
                    className="text-[10px] font-black uppercase tracking-widest text-lightDanger hover:underline"
                  >
                    Clear Filters ({selectedProfiles.length})
                  </button>
                )}
             </div>
             <div className="flex flex-wrap gap-2 pb-1">
                <button
                  onClick={() => setSelectedProfiles([])}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedProfiles.length === 0 ? 'bg-lightPrimary text-white border-lightPrimary shadow-md' : 'bg-white dark:bg-navy-900 text-lightTextSecondary border-lightBorder dark:border-navy-700 hover:border-lightPrimary/40'}`}
                >
                  All Platforms
                </button>
                {PROFILE_TYPES.map(p => (
                  <button
                    key={p}
                    onClick={() => toggleProfileFilter(p)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedProfiles.includes(p) ? 'bg-lightPrimary text-white border-lightPrimary shadow-md' : 'bg-white dark:bg-navy-900 text-lightTextSecondary border-lightBorder dark:border-navy-700 hover:border-lightPrimary/40'}`}
                  >
                    {p}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {filteredModels.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 font-bold italic bg-white/20 dark:bg-navy-800/20 rounded-2xl border-2 border-dashed border-lightBorder dark:border-navy-700">
            {selectedProfiles.length > 0 ? 'No talent found matching ALL selected platforms simultaneously.' : 'No matching talent found.'}
          </div>
        ) : (
          filteredModels.map(model => (
            <Card key={model.id} noPadding className="group relative overflow-visible border-none hover:shadow-xl transition-all h-full flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                   <div className="w-16 h-16 rounded-2xl bg-lightBgSecondary dark:bg-navy-900 flex items-center justify-center text-lightPrimary shrink-0 border border-lightBorder dark:border-navy-700 shadow-sm relative overflow-hidden">
                      {model.primaryImage ? (
                        <img src={model.primaryImage} className="w-full h-full object-cover" alt={model.name} />
                      ) : (
                        <User size={32} />
                      )}
                      {model.gallery?.length > 0 && (
                        <div className="absolute -top-2 -right-2 bg-lightPrimary text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50 z-10">
                           {model.gallery.length}
                        </div>
                      )}
                   </div>
                   
                   <div className="relative">
                      <button 
                         onClick={() => setActiveMenuId(activeMenuId === model.id ? null : model.id)}
                         className="p-2 text-lightTextSecondary hover:text-lightPrimary hover:bg-lightPrimary/5 rounded-lg transition-all"
                      >
                         <MoreVertical size={20} />
                      </button>
                      
                      {activeMenuId === model.id && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-lightBorder dark:border-navy-700 z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                             <button onClick={() => openViewModel(model)} className="w-full text-left px-4 py-3 text-xs font-bold text-lightText dark:text-white hover:bg-lightBgSecondary dark:hover:bg-navy-900 flex items-center gap-3">
                                <Eye size={16} className="text-blue-500" /> View Profile
                             </button>
                             <button onClick={() => openEditModel(model)} className="w-full text-left px-4 py-3 text-xs font-bold text-lightText dark:text-white hover:bg-lightBgSecondary dark:hover:bg-navy-900 flex items-center gap-3">
                                <Edit2 size={16} className="text-indigo-500" /> Edit Details
                             </button>
                             <button onClick={() => initiateDelete(model)} className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 border-t border-lightBorder dark:border-navy-700">
                                <Trash2 size={16} /> Remove Record
                             </button>
                          </div>
                        </>
                      )}
                   </div>
                </div>

                <h3 className="text-lg font-black text-lightText dark:text-white mb-1 capitalize truncate">{model.name}</h3>
                {model.billingName && (
                  <p className="text-[10px] font-bold text-lightTextSecondary -mt-1 mb-2 italic">C/O {model.billingName}</p>
                )}
                
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(Array.isArray(model.profileType) ? model.profileType : [model.profileType]).map((pt, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getProfileColor(pt)}`}>
                      {pt}
                    </span>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-lightBorder dark:border-navy-700/50 mt-auto">
                   <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-lightTextSecondary uppercase tracking-widest">Base Rate</span>
                      <span className="text-lightText dark:text-white font-black text-sm">₹{model.charges?.custom?.toLocaleString() || '0'}+</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 text-[11px] font-bold">
                      <div className="flex items-center gap-2 text-lightTextSecondary">
                        <Smartphone size={12} className="text-indigo-500" />
                        <span className="text-lightText dark:text-white/80">{model.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-lightTextSecondary">
                        <Instagram size={12} className="text-pink-500" />
                        <span className="text-lightText dark:text-white/80 truncate">{model.instagram || 'N/A'}</span>
                      </div>
                   </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Talent Profile Bio-Data">
        {viewingModel && (
          <div className="p-0 flex flex-col bg-white dark:bg-navy-900">
             <div className="p-8 border-b border-lightBorder dark:border-navy-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-2xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 shadow-inner overflow-hidden border border-pink-200">
                      {viewingModel.primaryImage ? (
                        <img src={viewingModel.primaryImage} className="w-full h-full object-cover" alt={viewingModel.name} />
                      ) : (
                        <User size={40} />
                      )}
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-lightText dark:text-white tracking-tight leading-none mb-2">{viewingModel.name}</h2>
                      <div className="flex flex-wrap gap-2">
                         {viewingModel.profileType.map(pt => (
                           <span key={pt} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getProfileColor(pt)}`}>{pt}</span>
                         ))}
                         <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-gray-50 text-gray-600 dark:bg-navy-800 dark:text-gray-400">{viewingModel.connectionType}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-3">
                   <Button variant="secondary" onClick={() => window.print()} className="h-10 text-xs"><Printer size={16} /> Print</Button>
                   <Button onClick={() => openEditModel(viewingModel)} className="h-10 text-xs"><Edit2 size={16} /> Update Details</Button>
                </div>
             </div>

             <div className="p-8 space-y-12">
                {viewingModel.gallery?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em] border-b border-lightBorder dark:border-navy-700 pb-2">Portfolio Gallery</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       {viewingModel.gallery.map((img, idx) => (
                         <div key={idx} className="aspect-[3/4] rounded-xl border border-lightBorder dark:border-navy-700 overflow-hidden shadow-sm bg-white relative group cursor-zoom-in">
                            <img src={img} className="w-full h-full object-cover" alt={`Portfolio ${idx}`} />
                            {img === viewingModel.primaryImage && (
                              <div className="absolute top-2 right-2 bg-lightPrimary p-1.5 rounded-lg shadow-lg text-white">
                                <Star size={12} fill="currentColor" />
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-lightBorder dark:border-navy-700 pb-2">
                        <Info size={16} className="text-indigo-500" />
                        <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Contact Intel</h4>
                      </div>
                      <div className="space-y-4">
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Billing Alias</p>
                            <p className="text-sm font-black text-lightText dark:text-white">{viewingModel.billingName || 'Self'}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Direct Phone</p>
                            <p className="text-sm font-black text-lightText dark:text-white">{viewingModel.phone || 'N/A'}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Email Access</p>
                            <p className="text-sm font-black text-lightText dark:text-white">{viewingModel.email || 'N/A'}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Digital Presence</p>
                            <p className="text-sm font-black text-pink-600">{viewingModel.instagram || 'N/A'}</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-lightBorder dark:border-navy-700 pb-2">
                        <Banknote size={16} className="text-emerald-500" />
                        <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Rate Card (Base)</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Studio</p>
                            <p className="text-xs font-black text-lightText dark:text-white">₹{viewingModel.charges.indoorReels.toLocaleString()}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Outdoor</p>
                            <p className="text-xs font-black text-lightText dark:text-white">₹{viewingModel.charges.outdoorReels.toLocaleString()}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Live</p>
                            <p className="text-xs font-black text-lightText dark:text-white">₹{viewingModel.charges.live.toLocaleString()}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Advt.</p>
                            <p className="text-xs font-black text-lightText dark:text-white">₹{viewingModel.charges.advt.toLocaleString()}</p>
                         </div>
                         <div className="col-span-2 pt-2 border-t border-lightBorder dark:border-navy-700/50">
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Travel Allowance</p>
                            <p className="text-xs font-black text-emerald-600">₹{viewingModel.travelCharges.toLocaleString()}</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-lightBorder dark:border-navy-700 pb-2">
                        <div className="flex items-center gap-2">
                          <Hash size={16} className="text-purple-500" />
                          <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Physical Stats</h4>
                        </div>
                        {viewingModel.measurements && (
                           <button 
                             onClick={() => handleCopyMeasurements(viewingModel.measurements)}
                             className="text-[9px] font-black text-lightPrimary uppercase tracking-widest hover:underline flex items-center gap-1 transition-all"
                           >
                             {isCopied ? <Check size={10} strokeWidth={3} className="text-lightSuccess" /> : <Copy size={10} />}
                             {isCopied ? 'Copied!' : 'Copy Stats'}
                           </button>
                        )}
                      </div>
                      <div className="bg-lightBgSecondary/40 dark:bg-navy-800 p-4 rounded-xl border border-lightBorder dark:border-navy-700 relative group">
                         <p className="text-xs font-bold text-lightText dark:text-white whitespace-pre-line leading-relaxed italic">
                            {viewingModel.measurements || 'No measurements listed.'}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-indigo-50 dark:bg-navy-800/50 rounded-2xl border border-indigo-100 dark:border-navy-700 grid grid-cols-1 md:grid-cols-4 gap-8">
                   <div className="flex flex-col">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">PAN Card</p>
                      <p className="text-sm font-black text-lightText dark:text-white uppercase tracking-widest">{viewingModel.pan || 'PAN NOT LISTED'}</p>
                   </div>
                   <div className="flex flex-col">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Bank Identity</p>
                      <p className="text-sm font-black text-lightText dark:text-white uppercase truncate">{viewingModel.bankDetails?.bankName || 'N/A'}</p>
                   </div>
                   <div className="flex flex-col">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Account No.</p>
                      <p className="text-sm font-black text-lightText dark:text-white tracking-widest font-sans">{viewingModel.bankDetails?.accountNumber || 'N/A'}</p>
                   </div>
                   <div className="flex flex-col">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">IFSC Routing</p>
                      <p className="text-sm font-black text-lightText dark:text-white uppercase">{viewingModel.bankDetails?.ifscCode || 'N/A'}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Registered Address</h4>
                   <p className="text-sm font-bold text-lightText dark:text-white opacity-80 max-w-2xl">{viewingModel.address || 'No physical address provided.'}</p>
                </div>

                {viewingModel.documents.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-lightBorder dark:border-navy-700">
                     <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Document Vault ({viewingModel.documents.length})</h4>
                     <div className="flex flex-wrap gap-4">
                        {viewingModel.documents.map((doc, idx) => (
                           <div key={idx} className="w-24 h-24 rounded-xl border border-lightBorder dark:border-navy-700 overflow-hidden shadow-sm bg-white p-1">
                              {doc.startsWith('data:application/pdf') ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                                   <FileText className="text-red-500" size={24} />
                                   <span className="text-[8px] font-black mt-1">PDF</span>
                                </div>
                              ) : (
                                <img src={doc} className="w-full h-full object-cover rounded-lg" alt={`Doc ${idx}`} />
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingModel ? "Edit Talent Profile" : "Register New Talent"}>
        <div className="p-0 flex flex-col relative h-[80vh]">
          {isScanning && (
            <div className="absolute inset-0 z-[100] bg-white/80 dark:bg-navy-900/80 backdrop-blur-md flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
               <div className="relative">
                  <Loader2 size={48} className="text-lightPrimary animate-spin" />
                  <Sparkles size={20} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
               </div>
               <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-lightText dark:text-white">AI Analyzing Documents...</p>
               <p className="mt-1 text-xs font-bold text-lightTextSecondary">{scanProgress}</p>
            </div>
          )}

          <div className="p-8 space-y-12 pb-20 overflow-y-auto custom-scrollbar flex-1">
             <div className="flex justify-between items-center pb-6 border-b border-lightBorder dark:border-navy-700/50">
               <div className="flex items-center gap-3">
                  <FileSearch className="text-lightPrimary" size={20} />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-lightTextSecondary">Smart Onboarding</h3>
               </div>
               <div className="flex gap-3">
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" 
                    multiple
                    className="hidden" 
                    ref={scanInputRef}
                    onChange={handleScanDocument}
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => scanInputRef.current?.click()}
                    className="h-10 border-lightPrimary/20 text-lightPrimary hover:bg-lightPrimary/5"
                  >
                     <Sparkles size={16} className="text-amber-400" />
                     Scan Image or PDF (Select Multiple)
                  </Button>
               </div>
            </div>

             <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 flex items-center justify-center">
                      <User size={18} />
                   </div>
                   <h4 className="text-xs font-black text-lightTextSecondary uppercase tracking-[0.2em]">Basic Identity</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <Input label="Talent Legal Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Baby Hetvi" />
                      <Input 
                        label="Parent / Billing Name (Optional)" 
                        value={formData.billingName || ''} 
                        onChange={e => setFormData({...formData, billingName: e.target.value})} 
                        placeholder="e.g. Prashant Shah"
                        icon={ShieldCheck}
                      />
                   </div>
                   <div className="space-y-4">
                      <Input label="Instagram Handle" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} placeholder="@username" icon={Instagram} />
                      <Input label="Contact Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91..." icon={Smartphone} />
                   </div>
                   <div className="col-span-full md:col-span-1">
                      <Select label="Source Agency" value={formData.connectionType || 'Freelance'} onChange={e => setFormData({...formData, connectionType: e.target.value as any})} options={['Freelance', 'Model Agency']} icon={Link} />
                   </div>
                   <div className="col-span-full md:col-span-1">
                      <Input label="Address" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Enter full address..." icon={MapPin} />
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 flex items-center justify-center">
                         <ImageIcon size={18} />
                      </div>
                      <h4 className="text-xs font-black text-lightTextSecondary uppercase tracking-[0.2em]">Portfolio Gallery</h4>
                   </div>
                   <button onClick={() => galleryInputRef.current?.click()} className="text-[9px] font-black text-lightPrimary uppercase tracking-widest hover:underline">+ Upload Shots</button>
                   <input type="file" multiple className="hidden" ref={galleryInputRef} onChange={(e) => handleFileUpload(e, 'gallery')} accept="image/*" />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6 bg-lightBgSecondary/40 dark:bg-navy-900/40 rounded-2xl border border-lightBorder dark:border-navy-700">
                   {formData.gallery.map((img, i) => (
                      <div key={i} className="group relative w-full aspect-[3/4] rounded-xl bg-white border border-lightBorder dark:border-navy-700 overflow-hidden shadow-sm">
                         <img src={img} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                            <button 
                              onClick={() => setPrimaryImage(img)} 
                              className={`p-2 rounded-lg transition-all ${formData.primaryImage === img ? 'bg-amber-500 text-white' : 'bg-white/20 text-white hover:bg-amber-400'}`}
                              title="Set as Primary"
                            >
                               <Star size={16} fill={formData.primaryImage === img ? "currentColor" : "none"} />
                            </button>
                            <button 
                              onClick={() => removeMedia(i, 'gallery')} 
                              className="p-2 bg-red-500 text-white rounded-lg hover:scale-110 transition-all"
                              title="Delete Image"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                         {formData.primaryImage === img && (
                           <div className="absolute top-2 right-2 bg-amber-500 p-1 rounded-md shadow-lg text-white">
                              <CheckCircle2 size={10} />
                           </div>
                         )}
                      </div>
                   ))}
                   <button 
                     onClick={() => galleryInputRef.current?.click()}
                     className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-lightBorder dark:border-navy-700 flex flex-col items-center justify-center text-lightTextSecondary hover:border-lightPrimary/40 hover:bg-lightPrimary/5 transition-all gap-2"
                   >
                      <Plus size={24} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">Portfolio Shot</span>
                   </button>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                      <ExternalLink size={18} />
                 </div>
                 <h4 className="text-xs font-black text-lightTextSecondary uppercase tracking-[0.2em]">Assigned Platforms</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROFILE_TYPES.map(p => (
                  <button
                    key={p}
                    onClick={() => handleProfileToggle(p)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.profileType.includes(p) ? 'bg-lightPrimary text-white border-lightPrimary shadow-lg shadow-lightPrimary/20' : 'bg-white dark:bg-navy-900 text-lightTextSecondary border-lightBorder dark:border-navy-700 hover:border-lightPrimary/40'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                    <Banknote size={18} />
                 </div>
                 <h4 className="text-xs font-black text-lightTextSecondary uppercase tracking-[0.2em]">Commercial Rate Card</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-lightBgSecondary/40 dark:bg-navy-900/40 rounded-2xl border border-lightBorder dark:border-navy-700">
                <Input label="Studio Reels Rate" type="number" value={formData.charges.indoorReels || ''} onChange={e => handleChargeChange('indoorReels', e.target.value)} placeholder="0" icon={Video} />
                <Input label="Outdoor Reels Rate" type="number" value={formData.charges.outdoorReels || ''} onChange={e => handleChargeChange('outdoorReels', e.target.value)} placeholder="0" icon={MapPin} />
                <Input label="Store Reels Rate" type="number" value={formData.charges.storeReels || ''} onChange={e => handleChargeChange('storeReels', e.target.value)} placeholder="0" icon={ShoppingBag} />
                <Input label="Live Stream Rate" type="number" value={formData.charges.live || ''} onChange={e => handleChargeChange('live', e.target.value)} placeholder="0" icon={Zap} />
                <Input label="Advt. Shoot Rate" type="number" value={formData.charges.advt || ''} onChange={e => handleChargeChange('advt', e.target.value)} placeholder="0" icon={Tv} />
                <Input label="YT Video Rate" type="number" value={formData.charges.youtubeVideo || ''} onChange={e => handleChargeChange('youtubeVideo', e.target.value)} placeholder="0" icon={Youtube} />
                <Input label="Base / Custom Rate" type="number" value={formData.charges.custom || ''} onChange={e => handleChargeChange('custom', e.target.value)} placeholder="0" />
                <Input label="Travel Allowance" type="number" value={formData.travelCharges || ''} onChange={e => setFormData({...formData, travelCharges: Number(e.target.value)})} placeholder="0" icon={Plane} />
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                    <Landmark size={18} />
                 </div>
                 <h4 className="text-xs font-black text-lightTextSecondary uppercase tracking-[0.2em]">Compliance & Banking</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-lightBgSecondary/40 dark:bg-navy-900/40 rounded-2xl border border-lightBorder dark:border-navy-700">
                <Input label="PAN Card Number" value={formData.pan || ''} onChange={e => setFormData({...formData, pan: e.target.value.toUpperCase()})} placeholder="ABCDE1234F" icon={ShieldCheck} />
                <Input label="GSTIN (If Applicable)" value={formData.gstin || ''} onChange={e => setFormData({...formData, gstin: e.target.value.toUpperCase()})} placeholder="GSTIN-000..." />
                <Input label="Bank Name" value={formData.bankDetails?.bankName || ''} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, bankName: e.target.value}})} placeholder="HDFC Bank" icon={Landmark} />
                <Input label="Account Number" value={formData.bankDetails?.accountNumber || ''} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, accountNumber: e.target.value}})} placeholder="50100..." icon={CreditCard} />
                <Input label="IFSC Code" value={formData.bankDetails?.ifscCode || ''} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, ifscCode: e.target.value.toUpperCase()}})} placeholder="HDFC000..." />
                <Input label="Branch Name" value={formData.bankDetails?.branchName || ''} onChange={e => setFormData({...formData, bankDetails: {...formData.bankDetails!, branchName: e.target.value}})} placeholder="City Center" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <FileText size={16} className="text-indigo-500" />
                   <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest">Physical Intel</h4>
                </div>
                <textarea 
                  value={formData.measurements} 
                  onChange={e => setFormData({...formData, measurements: e.target.value})}
                  className="w-full min-h-[140px] bg-white dark:bg-navy-900 border border-lightBorder dark:border-navy-700 rounded-xl p-4 text-sm font-bold focus:ring-4 focus:ring-lightPrimary/10 outline-none transition-all resize-none shadow-sm"
                  placeholder="Height: 5'8... Bust: 34... Waist: 26..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Upload size={16} className="text-purple-500" />
                      <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest">Document Vault</h4>
                   </div>
                   <button onClick={() => docInputRef.current?.click()} className="text-[9px] font-black text-lightPrimary uppercase tracking-widest hover:underline">+ Upload File</button>
                   <input type="file" multiple className="hidden" ref={docInputRef} onChange={(e) => handleFileUpload(e, 'documents')} />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                   {formData.documents.map((doc, i) => (
                      <div key={i} className="group relative w-full aspect-square rounded-xl bg-lightBgSecondary dark:bg-navy-900 border border-lightBorder dark:border-navy-700 overflow-hidden shadow-sm">
                         {doc.startsWith('data:application/pdf') ? (
                           <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                             <FileText size={24} className="text-red-500" />
                             <span className="text-[8px] font-black uppercase mt-1 text-center px-1 truncate">PDF DOC</span>
                           </div>
                         ) : (
                           <img src={doc} className="w-full h-full object-cover" alt={`Doc ${i}`} />
                         )}
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                            <button onClick={() => removeMedia(i, 'documents')} className="p-1.5 bg-red-500 text-white rounded-lg hover:scale-110 transition-all"><X size={14} /></button>
                         </div>
                      </div>
                   ))}
                   <button 
                     onClick={() => docInputRef.current?.click()}
                     className="w-full aspect-square rounded-xl border-2 border-dashed border-lightBorder dark:border-navy-700 flex flex-col items-center justify-center text-lightTextSecondary hover:border-lightPrimary/40 hover:bg-lightPrimary/5 transition-all gap-2"
                   >
                      <Plus size={20} />
                      <span className="text-[8px] font-black uppercase tracking-widest text-center px-1">Add Image</span>
                   </button>
                </div>
              </div>
           </div>
          </div>

          <div className="p-8 bg-white dark:bg-navy-800 border-t border-lightBorder dark:border-navy-700 flex gap-4">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 font-black uppercase tracking-widest text-[11px]">Discard</Button>
              <Button onClick={handleSave} className="flex-1 bg-lightPrimary shadow-2xl shadow-lightPrimary/20 font-black uppercase tracking-widest text-[11px]">Commit Talent Record</Button>
           </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!modelToDelete}
        onClose={() => setModelToDelete(null)}
        onConfirm={confirmDeleteModel}
        title="Delete Talent"
        message={`Are you sure you want to remove "${modelToDelete?.name}" from the database?`}
        isProcessing={isDeleting}
      />
    </div>
  );
};
