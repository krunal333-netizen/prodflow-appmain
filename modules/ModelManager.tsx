import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Model } from '../types';
import { PROFILE_TYPES } from '../constants';
import { Card, Input, Button, Modal, Select } from '../components/UI';
import { Users, Plus, Edit2, Search, FileText, Instagram, Phone, Camera, Sparkles, Loader2, Filter, Upload, X, Eye, CreditCard, Printer } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { extractDataFromImage } from '../services/geminiService';

export const ModelManager: React.FC = () => {
  const { models, addModel, updateModel, firms } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConnection, setFilterConnection] = useState('All');
  const [filterProfile, setFilterProfile] = useState('All');
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [isExtractingStats, setIsExtractingStats] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Joining Form Print State
  const [showJoiningForm, setShowJoiningForm] = useState(false);
  const [joiningFormFirmId, setJoiningFormFirmId] = useState<string>('');

  // Set default firm for joining form
  useEffect(() => {
     if (!joiningFormFirmId && firms.length > 0) {
        setJoiningFormFirmId(firms[0].id);
     }
  }, [firms, joiningFormFirmId]);

  const initialModel: Model = {
    id: '',
    name: '',
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
    // Handle migration from 'special' to 'custom' for legacy data
    const existingCharges = model.charges || {};
    // Check if 'custom' exists, otherwise fallback to 'special' if it exists in old data
    const customCharge = (existingCharges as any).custom !== undefined 
      ? (existingCharges as any).custom 
      : ((existingCharges as any).special || 0);

    setFormData({ 
      ...initialModel, 
      ...model, 
      profileType: Array.isArray(model.profileType) ? model.profileType : [model.profileType],
      charges: { 
        ...initialModel.charges, 
        ...existingCharges,
        custom: customCharge 
      },
      bankDetails: { ...initialModel.bankDetails, ...(model.bankDetails || {}) }
    });
    setEditingModel(model);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingModel) {
      updateModel(formData);
    } else {
      addModel(formData);
    }
    setIsModalOpen(false);
  };

  const handlePrintJoiningForm = () => {
    setShowJoiningForm(true);
    setTimeout(() => {
      window.print();
      setShowJoiningForm(false);
    }, 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, documents: [...prev.documents, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsExtractingStats(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const extractedText = await extractDataFromImage(base64, 'MEASUREMENTS');
        if (extractedText) {
          setFormData(prev => ({
            ...prev,
            measurements: prev.measurements ? `${prev.measurements}\n${extractedText}` : extractedText
          }));
        } else {
          alert("Could not extract data from the image.");
        }
        setIsExtractingStats(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMeasurementRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          measurementRefImage: reader.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredModels = models.filter(m => {
    const searchLower = searchTerm.toLowerCase();
    
    // Handle array profileType for filtering
    const mProfileTypes = Array.isArray(m.profileType) ? m.profileType : [m.profileType];
    const profileString = mProfileTypes.join(', ').toLowerCase();

    const matchesSearch = 
      m.name.toLowerCase().includes(searchLower) || 
      profileString.includes(searchLower) || 
      (m.instagram && m.instagram.toLowerCase().includes(searchLower));
    
    const matchesConnection = filterConnection === 'All' || m.connectionType === filterConnection;
    const matchesProfile = filterProfile === 'All' || mProfileTypes.includes(filterProfile);

    return matchesSearch && matchesConnection && matchesProfile;
  });
  
  // Resolve Firm for Print
  const printFirm = firms.find(f => f.id === joiningFormFirmId) || firms[0];

  const handleProfileToggle = (profile: string) => {
    setFormData(prev => {
      const current = prev.profileType;
      if (current.includes(profile)) {
        return { ...prev, profileType: current.filter(p => p !== profile) };
      } else {
        return { ...prev, profileType: [...current, profile] };
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-600 dark:text-pink-400">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Talent Management</h1>
            <p className="text-gray-500 dark:text-gray-400">Models, Influencers & Actors Database</p>
          </div>
        </div>
        <Button onClick={openNewModel}>
          <Plus size={18} /> Add New Talent
        </Button>
      </div>

      <Card className="no-print">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by Name, Profile, or Handle..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48 relative">
               <Filter className="absolute left-3 top-2.5 text-gray-400" size={20} />
               <select
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                  value={filterProfile}
                  onChange={(e) => setFilterProfile(e.target.value)}
               >
                 <option value="All">All Profiles</option>
                 {PROFILE_TYPES.map(profile => (
                   <option key={profile} value={profile}>{profile}</option>
                 ))}
               </select>
            </div>
            <div className="w-full sm:w-48 relative">
               <Filter className="absolute left-3 top-2.5 text-gray-400" size={20} />
               <select
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                  value={filterConnection}
                  onChange={(e) => setFilterConnection(e.target.value)}
               >
                 <option value="All">All Connections</option>
                 <option value="Freelance">Freelance</option>
                 <option value="Model Agency">Model Agency</option>
               </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                <th className="p-4 font-semibold">Name & Contact</th>
                <th className="p-4 font-semibold">Profile & Source</th>
                <th className="p-4 font-semibold">Base Rates</th>
                <th className="p-4 font-semibold">Measurements</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredModels.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">No models found matching your filters.</td></tr>
              ) : (
                filteredModels.map(model => (
                  <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {model.phone && <span className="flex items-center gap-1"><Phone size={10} /> {model.phone}</span>}
                        {model.instagram && <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400"><Instagram size={10} /> {model.instagram}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(model.profileType) ? model.profileType : [model.profileType]).map((pt, i) => (
                             <span key={i} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                               {pt}
                             </span>
                          ))}
                        </div>
                        {model.connectionType && (
                          <span className={`px-2 py-0.5 rounded text-xs border ${
                            model.connectionType === 'Model Agency' 
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800' 
                              : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800'
                          }`}>
                            {model.connectionType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 text-sm">
                       {/* Display lowest non-zero rate */}
                       <div>Starts at ₹{
                          (() => {
                             const rates = (Object.values(model.charges || {}) as number[]).filter(v => v > 0);
                             return rates.length > 0 ? Math.min(...rates) : 0;
                          })()
                       }</div>
                       <div className="text-xs text-gray-400">
                          Reels: ₹{model.charges?.indoorReels || 0} (In) / ₹{model.charges?.outdoorReels || 0} (Out)
                       </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 text-sm">
                      <div className="truncate max-w-xs">{model.measurements}</div>
                      {model.measurementRefImage && (
                        <div className="mt-1">
                           <button 
                              onClick={(e) => { e.stopPropagation(); setPreviewImage(model.measurementRefImage || null); }}
                              className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                           >
                              <Eye size={10} /> View Size Card
                           </button>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditModel(model)}>
                        <Edit2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
           <div className="relative max-w-3xl max-h-full">
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <X size={32} />
              </button>
              <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
           </div>
        </div>
      )}

      {/* Joining Form Print View Overlay */}
      {showJoiningForm && printFirm && (
        <div className="fixed inset-0 bg-white z-[200] p-0 m-0 flex items-center justify-center font-sans text-black overflow-auto">
           <div className="w-[210mm] min-h-[297mm] border-[3px] border-black p-8 relative box-border">
              {/* Header */}
              <div className="text-center mb-8">
                 <h1 className="text-2xl font-bold underline mb-2 uppercase">{printFirm.name}</h1>
                 <p className="text-sm font-medium whitespace-pre-line">{printFirm.address}</p>
                 <h2 className="text-xl font-bold mt-8">NEW MODEL / INFLUENCER FORM</h2>
              </div>

              {/* Form Content Table-less Layout */}
              <div className="space-y-4 text-sm font-bold mt-12 px-4">
                 <div className="flex justify-between items-end border-b border-gray-200 pb-1">
                    <span className="w-1/3">MODEL / INFLUENCER NAME :</span>
                    <span className="w-2/3 text-right uppercase">{formData.name}</span>
                 </div>
                 
                 <div className="flex justify-between items-end border-b border-gray-200 pb-1">
                    <span className="w-1/3">ADDRESS :</span>
                    <span className="w-2/3 text-right uppercase">{formData.address || '-'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-gray-200 pb-1">
                    <span className="w-1/3">GST NUMBER :</span>
                    <span className="w-2/3 text-right uppercase">{formData.gstin || '-'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-gray-200 pb-1">
                    <span className="w-1/3">PAN NUMBER :</span>
                    <span className="w-2/3 text-right uppercase">{formData.pan || '-'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-gray-200 pb-1">
                    <span className="w-1/3">TELEPHONE NUMBER :</span>
                    <span className="w-2/3 text-right uppercase">{formData.phone}</span>
                 </div>

                 {/* MSME REMOVED AS REQUESTED */}

                 <div className="flex justify-between items-end border-b border-gray-200 pb-1">
                    <span className="w-1/3">MAIL ID :</span>
                    <span className="w-2/3 text-right lowercase">{formData.email || '-'}</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-gray-200 pb-1">
                    <span className="w-1/3">CREDIT DAYS :</span>
                    <span className="w-2/3 text-right uppercase">{formData.creditDays || '7'} days</span>
                 </div>

                 <div className="flex justify-between items-end border-b border-gray-200 pb-1">
                    <span className="w-1/3">LEDGER CREATE DATE :</span>
                    <span className="w-2/3 text-right uppercase">{new Date(formData.joinDate).toLocaleDateString('en-GB').replace(/\//g, '.')}</span>
                 </div>

                 <div className="mt-8 mb-2">
                    <span>BANK DETAILS AS PER INVOICE :</span>
                 </div>

                 <div className="pl-4 space-y-2">
                    <div className="flex justify-between items-end">
                       <span className="w-1/3">ACCOUNT NAME</span>
                       <span className="w-2/3 text-right uppercase">{formData.bankDetails?.accountNumber ? formData.name : '-'}</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="w-1/3">ACCOUNT NUMBER</span>
                       <span className="w-2/3 text-right uppercase">{formData.bankDetails?.accountNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="w-1/3">IFSC CODE</span>
                       <span className="w-2/3 text-right uppercase">{formData.bankDetails?.ifscCode || '-'}</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="w-1/3">BRANCH NAME</span>
                       <span className="w-2/3 text-right uppercase">{formData.bankDetails?.branchName || '-'}</span>
                    </div>
                 </div>

                 <div className="flex justify-between items-end pt-12 mt-12">
                    <span className="w-1/3">MANAGER NAME :</span>
                    <span className="w-2/3 text-right border-b border-black"></span>
                 </div>

                 <div className="flex justify-between items-end pt-4">
                    <span className="w-1/3">DEPARTMENT :</span>
                    <span className="w-2/3 text-right border-b border-black"></span>
                 </div>
              </div>
           </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingModel ? "Edit Talent" : "New Talent Onboarding"}>
        <div className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Linked Profiles</label>
              <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-xl min-h-[48px] bg-white dark:bg-gray-800">
                {PROFILE_TYPES.map(profile => (
                  <button
                    key={profile}
                    onClick={() => handleProfileToggle(profile)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      formData.profileType.includes(profile)
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {profile}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Select 
                label="Connected Via" 
                options={['Model Agency', 'Freelance']} 
                value={formData.connectionType || 'Freelance'} 
                onChange={e => setFormData({...formData, connectionType: e.target.value as any})} 
             />
             <Input 
                label="Contact No." 
                value={formData.phone || ''} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                placeholder="+91..."
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input 
                label="Email ID" 
                value={formData.email || ''} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="email@example.com"
             />
             <Input 
                label="Instagram Profile" 
                value={formData.instagram || ''} 
                onChange={e => setFormData({...formData, instagram: e.target.value})} 
                placeholder="@username"
             />
          </div>

          <Input 
             label="Full Address (For Form)" 
             value={formData.address || ''} 
             onChange={e => setFormData({...formData, address: e.target.value})} 
             placeholder="House No, Street, City, State - Zip"
          />

          {/* Charges Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
             <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <Sparkles size={16} className="text-amber-500" /> Professional Charges (₹)
             </h3>
             
             {/* Reels Group */}
             <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Reels & Short Form</p>
                <div className="grid grid-cols-3 gap-3">
                   <Input 
                     label="Indoor Reels" type="number" 
                     value={formData.charges.indoorReels || ''} 
                     onChange={e => setFormData({...formData, charges: {...formData.charges, indoorReels: Number(e.target.value)}})} 
                   />
                   <Input 
                     label="Outdoor Reels" type="number" 
                     value={formData.charges.outdoorReels || ''} 
                     onChange={e => setFormData({...formData, charges: {...formData.charges, outdoorReels: Number(e.target.value)}})} 
                   />
                   <Input 
                     label="Store Reels" type="number" 
                     value={formData.charges.storeReels || ''} 
                     onChange={e => setFormData({...formData, charges: {...formData.charges, storeReels: Number(e.target.value)}})} 
                   />
                </div>
             </div>

             {/* YouTube & Others */}
             <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">YouTube & Promo</p>
                <div className="grid grid-cols-3 gap-3">
                   <Input 
                     label="YT Video" type="number" 
                     value={formData.charges.youtubeVideo || ''} 
                     onChange={e => setFormData({...formData, charges: {...formData.charges, youtubeVideo: Number(e.target.value)}})} 
                   />
                   <Input 
                     label="YT Shorts" type="number" 
                     value={formData.charges.youtubeShorts || ''} 
                     onChange={e => setFormData({...formData, charges: {...formData.charges, youtubeShorts: Number(e.target.value)}})} 
                   />
                   <Input 
                     label="YT Influencer" type="number" 
                     value={formData.charges.youtubeInfluencer || ''} 
                     onChange={e => setFormData({...formData, charges: {...formData.charges, youtubeInfluencer: Number(e.target.value)}})} 
                   />
                </div>
             </div>

             {/* Additional */}
             <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Additional & Travel</p>
                <div className="grid grid-cols-3 gap-3">
                   <Input 
                     label="Advt. Shoot" type="number" 
                     value={formData.charges.advt || ''} 
                     onChange={e => setFormData({...formData, charges: {...formData.charges, advt: Number(e.target.value)}})} 
                   />
                   <Input 
                     label="Live Session" type="number" 
                     value={formData.charges.live || ''} 
                     onChange={e => setFormData({...formData, charges: {...formData.charges, live: Number(e.target.value)}})} 
                   />
                   <Input 
                     label="Custom Shoot" type="number" 
                     value={formData.charges.custom || ''} 
                     onChange={e => setFormData({...formData, charges: {...formData.charges, custom: Number(e.target.value)}})} 
                   />
                </div>
                <div className="mt-3">
                   <Input 
                     label="Travel Charges (Flat)" type="number" 
                     value={formData.travelCharges || ''} 
                     onChange={e => setFormData({...formData, travelCharges: Number(e.target.value)})} 
                   />
                </div>
             </div>
          </div>

          {/* Bank Details Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
             <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <CreditCard size={16} className="text-blue-600 dark:text-blue-400" /> Bank & Tax Details (For Form & Accounts)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Input 
                 label="PAN Card No." 
                 value={formData.pan || ''} 
                 onChange={e => setFormData({...formData, pan: e.target.value})} 
                 placeholder="ABCDE1234F"
               />
               <Input 
                 label="GSTIN (Optional)" 
                 value={formData.gstin || ''} 
                 onChange={e => setFormData({...formData, gstin: e.target.value})} 
               />
               <Input 
                 label="Bank Name" 
                 value={formData.bankDetails?.bankName || ''} 
                 onChange={e => setFormData({...formData, bankDetails: { ...formData.bankDetails!, bankName: e.target.value }})} 
               />
               <Input 
                 label="Branch Name" 
                 value={formData.bankDetails?.branchName || ''} 
                 onChange={e => setFormData({...formData, bankDetails: { ...formData.bankDetails!, branchName: e.target.value }})} 
                 placeholder="e.g. Kargi Grant, Dehradun"
               />
               <Input 
                 label="Account Number" 
                 value={formData.bankDetails?.accountNumber || ''} 
                 onChange={e => setFormData({...formData, bankDetails: { ...formData.bankDetails!, accountNumber: e.target.value }})} 
               />
               <Input 
                 label="IFSC Code" 
                 value={formData.bankDetails?.ifscCode || ''} 
                 onChange={e => setFormData({...formData, bankDetails: { ...formData.bankDetails!, ifscCode: e.target.value }})} 
               />
               <Input 
                 label="Credit Days" 
                 type="number"
                 value={formData.creditDays || 7} 
                 onChange={e => setFormData({...formData, creditDays: Number(e.target.value)})} 
               />
               <Input 
                 label="Join Date (Ledger Date)" 
                 type="date"
                 value={formData.joinDate} 
                 onChange={e => setFormData({...formData, joinDate: e.target.value})} 
               />
             </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Measurements & Stats</label>
              <div className="flex gap-2">
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium transition-colors border border-gray-200 dark:border-gray-600" title="Upload Reference Image">
                  <Upload size={12} />
                  Upload Ref
                  <input type="file" accept="image/*" className="hidden" onChange={handleMeasurementRefUpload} />
                </label>
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-medium transition-colors border border-indigo-200 dark:border-indigo-800" title="Extract Text from Image">
                  {isExtractingStats ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {isExtractingStats ? 'Scanning...' : 'Scan Data'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleStatsImageUpload} disabled={isExtractingStats} />
                </label>
              </div>
            </div>
            <textarea 
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[80px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
              value={formData.measurements}
              onChange={e => setFormData({...formData, measurements: e.target.value})}
              placeholder="Height, Bust, Waist, Hips, Shoe Size..."
            />
            {formData.measurementRefImage && (
              <div className="mt-2 relative inline-block group">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Verification Image Linked:</div>
                <img 
                  src={formData.measurementRefImage} 
                  alt="Ref" 
                  className="h-24 w-auto rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-90" 
                  onClick={() => setPreviewImage(formData.measurementRefImage || null)}
                />
                <button 
                  onClick={() => setFormData({...formData, measurementRefImage: undefined})}
                  className="absolute top-6 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-opacity"
                  title="Remove reference"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Remarks / Notes</label>
            <textarea 
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[60px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
              value={formData.remarks}
              onChange={e => setFormData({...formData, remarks: e.target.value})}
            />
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Upload Documents (PAN, ID, Bank Proof)</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {formData.documents.map((doc, idx) => (
                <div key={idx} className="w-16 h-16 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded flex items-center justify-center text-gray-400 overflow-hidden relative group">
                  {doc.startsWith('data:image') ? (
                    <img src={doc} alt="Doc" className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={24} />
                  )}
                </div>
              ))}
              <label className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition-colors">
                <Plus size={24} />
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 pt-4 mt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 w-full md:w-auto">
               <select 
                 className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 value={joiningFormFirmId}
                 onChange={(e) => setJoiningFormFirmId(e.target.value)}
               >
                 {firms.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                 ))}
               </select>
               <Button variant="secondary" onClick={handlePrintJoiningForm} className="whitespace-nowrap">
                  <Printer size={16} /> Print Form
               </Button>
            </div>
            <Button onClick={handleSave} className="w-full md:w-auto">Save Talent Profile</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};