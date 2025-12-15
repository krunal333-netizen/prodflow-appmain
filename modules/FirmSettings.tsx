import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Input, Button } from '../components/UI';
import { Building2, Save, Upload, Store, Layers, ArrowRight, Plus } from 'lucide-react';
import { Firm } from '../types';
import { PROFILE_TYPES } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export const FirmSettings: React.FC = () => {
  const { firms, updateFirm, addFirm, pageFirmMap, updatePageMapping } = useApp();
  const [selectedFirmId, setSelectedFirmId] = useState<string>('');
  const [formData, setFormData] = useState<Firm | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isNewFirm, setIsNewFirm] = useState(false);

  // Initialize with first firm if available
  useEffect(() => {
    if (firms.length > 0 && !selectedFirmId && !isNewFirm) {
       setSelectedFirmId(firms[0].id);
    }
  }, [firms, selectedFirmId, isNewFirm]);

  // Load existing firm data
  useEffect(() => {
    if (isNewFirm) return; // Don't load if creating new
    const found = firms.find(f => f.id === selectedFirmId);
    if (found) setFormData(found);
  }, [selectedFirmId, firms, isNewFirm]);

  const handleCreateNew = () => {
     setIsNewFirm(true);
     setSelectedFirmId('NEW');
     setFormData({
        id: uuidv4(),
        name: '',
        storeName: '',
        address: '',
        phone: '',
        email: '',
        logoUrl: '',
        gstin: ''
     });
  };

  const handleSelectFirm = (id: string) => {
     setIsNewFirm(false);
     setSelectedFirmId(id);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsSaved(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => prev ? ({ ...prev, logoUrl: reader.result as string }) : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (formData) {
      if (isNewFirm) {
         addFirm(formData);
         setIsNewFirm(false);
         setSelectedFirmId(formData.id);
      } else {
         updateFirm(formData);
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  if (!formData && !isNewFirm) return <div className="p-8 text-center text-gray-500">Loading Firm Data...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Firm Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage branding and billing details for your stores</p>
        </div>
      </div>

      {/* Firm Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {firms.map(firm => (
           <button
             key={firm.id}
             onClick={() => handleSelectFirm(firm.id)}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedFirmId === firm.id ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
           >
              <Store size={16} />
              {firm.storeName}
           </button>
        ))}
        <button
           onClick={handleCreateNew}
           className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isNewFirm ? 'bg-indigo-600 text-white shadow' : 'text-indigo-600 dark:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
           <Plus size={16} /> Add Firm
        </button>
      </div>

      <Card title={isNewFirm ? "Create New Firm Profile" : `Edit Profile: ${formData?.storeName} (${formData?.name})`}>
        {formData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 flex flex-col items-center gap-4">
            <div className="w-40 h-40 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 relative group">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 dark:text-gray-500 text-xs">Upload Logo</span>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <label className="cursor-pointer text-white text-xs text-center p-2">
                    <Upload size={20} className="mx-auto mb-1" />
                    Change Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                 </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Appears on Invoices & POs</p>
          </div>

          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <Input label="Store Name (Brand)" name="storeName" value={formData.storeName || ''} onChange={handleChange} placeholder="e.g. G3+" />
               <Input label="Legal Firm Name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. K S Trading" />
            </div>
            
            <Input label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Full business address" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              <Input 
                label="Email ID" 
                name="email" 
                type="email"
                value={formData.email || ''} 
                onChange={handleChange} 
                placeholder="billing@company.com" 
              />
            </div>
            <Input label="GSTIN / Tax ID" name="gstin" value={formData.gstin || ''} onChange={handleChange} placeholder="Optional" />
            
            <div className="pt-4 flex items-center gap-4">
              <Button onClick={handleSave} className="w-full md:w-auto">
                <Save size={18} />
                {isNewFirm ? 'Create Firm' : 'Save Changes'}
              </Button>
              {isSaved && <span className="text-green-600 dark:text-green-400 font-medium animate-pulse">Saved Successfully!</span>}
            </div>
          </div>
        </div>
        )}
      </Card>

      {!isNewFirm && (
      <Card title="Page to Firm Mapping">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
           Configure which Firm (Legal Entity) should be used for billing when a specific Brand Page is selected during a Shoot.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {PROFILE_TYPES.map(page => {
             const assignedFirmId = pageFirmMap[page] || firms[0]?.id;
             
             return (
               <div key={page} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Layers size={18} />
                     </div>
                     <span className="font-bold text-gray-700 dark:text-gray-300">{page}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <ArrowRight size={14} className="text-gray-400" />
                     <select 
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={assignedFirmId}
                        onChange={(e) => updatePageMapping(page, e.target.value)}
                     >
                        {firms.map(f => (
                           <option key={f.id} value={f.id}>{f.storeName} ({f.name})</option>
                        ))}
                     </select>
                  </div>
               </div>
             );
           })}
        </div>
      </Card>
      )}
    </div>
  );
};