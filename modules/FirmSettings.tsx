
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Input, Button, ConfirmationModal } from '../components/UI';
import { Building2, Save, Upload, Trash2, ShieldCheck, CheckCircle2, AlertTriangle, Store, ImageIcon, Sparkles, Loader2, FileSearch } from 'lucide-react';
import { Firm } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { extractFirmDetailsFromImage } from '../services/geminiService';

export const FirmSettings: React.FC = () => {
  const { firms, updateFirm, addFirm, deleteFirm, currentUser, notify } = useApp();
  const [selectedFirmId, setSelectedFirmId] = useState<string>('');
  const [formData, setFormData] = useState<Firm | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isNewFirm, setIsNewFirm] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [firmToDelete, setFirmToDelete] = useState<Firm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Restricted Access Check
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-lightTextSecondary">
        <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-full text-red-500 mb-6">
           <ShieldCheck size={48} />
        </div>
        <h2 className="text-2xl font-black text-lightText dark:text-white uppercase tracking-tight mb-2">Access Restricted</h2>
        <p className="text-sm font-bold max-w-xs text-center">Only administrators can manage firm profiles and legal identities.</p>
      </div>
    );
  }

  useEffect(() => {
    if (firms.length > 0 && !selectedFirmId && !isNewFirm) {
       setSelectedFirmId(firms[0].id);
    }
  }, [firms, selectedFirmId, isNewFirm]);

  useEffect(() => {
    if (isNewFirm) return; 
    const found = firms.find(f => f.id === selectedFirmId);
    if (found) setFormData(found);
  }, [selectedFirmId, firms, isNewFirm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleScanDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const extracted = await extractFirmDetailsFromImage(base64, file.type);
        
        setFormData({
          ...formData,
          name: extracted.name || formData.name,
          storeName: extracted.storeName || formData.storeName,
          address: extracted.address || formData.address,
          phone: extracted.phone || formData.phone,
          gstin: extracted.gstin || formData.gstin,
        });
        notify('Information extracted successfully');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Scanning failed", error);
      notify('AI Scan failed. Please check your document.', 'error');
    } finally {
      setIsScanning(false);
      if (scanInputRef.current) scanInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (formData) {
      if (isNewFirm) {
         await addFirm(formData);
         setIsNewFirm(false);
         setSelectedFirmId(formData.id);
         notify('New organization profile created');
      } else {
         await updateFirm(formData);
         notify('Organization details updated');
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleCreateNew = () => {
    setIsNewFirm(true);
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

  const initiateDelete = () => {
    if (formData && firms.length > 1) {
      setFirmToDelete(formData);
    } else {
      notify("At least one organization profile must remain", 'error');
    }
  };

  const confirmDeleteFirm = async () => {
    if (firmToDelete) {
      setIsDeleting(true);
      try {
        await deleteFirm(firmToDelete.id);
        notify('Organization profile removed');
        setFirmToDelete(null);
        setSelectedFirmId('');
      } catch (e) {
        console.error("Delete failed", e);
        notify('Failed to delete organization', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-pageInUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-3xl font-black text-lightText dark:text-white font-display tracking-tight leading-none">Organization Profile</h1>
          <p className="text-lightTextSecondary dark:text-gray-400 text-sm font-medium mt-1.5 tracking-wide">Manage your legal entity and billing identities</p>
        </div>
        <div className="flex bg-white dark:bg-navy-800 p-1 rounded-xl border border-lightBorder dark:border-navy-700 shadow-sm overflow-x-auto no-scrollbar">
          {firms.map(f => (
            <button 
              key={f.id}
              onClick={() => { setIsNewFirm(false); setSelectedFirmId(f.id); }}
              className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedFirmId === f.id && !isNewFirm ? 'bg-lightPrimary text-white shadow-md' : 'text-lightTextSecondary hover:bg-lightBgSecondary'}`}
            >
              {f.storeName || f.name}
            </button>
          ))}
          <button 
            onClick={handleCreateNew}
            className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${isNewFirm ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-600 hover:bg-emerald-50'}`}
          >
            + Add New Firm
          </button>
        </div>
      </div>

      <Card className="border-none shadow-soft overflow-visible relative" noPadding>
        {isScanning && (
          <div className="absolute inset-0 z-[100] bg-white/80 dark:bg-navy-900/80 backdrop-blur-md flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
             <div className="relative">
                <Loader2 size={48} className="text-lightPrimary animate-spin" />
                <Sparkles size={20} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
             </div>
             <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-lightText dark:text-white">AI Capture in Progress...</p>
             <p className="mt-1 text-xs font-bold text-lightTextSecondary">Extracting legal details from your document</p>
          </div>
        )}

        <div className="p-10 space-y-10">
          <div className="flex justify-between items-center pb-6 border-b border-lightBorder dark:border-navy-700/50">
             <div className="flex items-center gap-3">
                <FileSearch className="text-lightPrimary" size={20} />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-lightTextSecondary">Data Input Mode</h3>
             </div>
             <div className="flex gap-3">
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
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
                   Scan ID or PDF
                </Button>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10">
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative group">
                 <div className="w-40 h-40 rounded-3xl bg-lightBgSecondary dark:bg-navy-900 border-2 border-dashed border-lightBorder dark:border-navy-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-lightPrimary">
                    {formData?.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="flex flex-col items-center text-lightTextSecondary gap-2 opacity-30">
                         <ImageIcon size={32} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Logo Placeholder</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-lightPrimary/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white">
                       <Upload size={24} className="mb-2" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Update Logo</span>
                       <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                 </div>
              </div>
              <p className="mt-4 text-[9px] font-black text-lightTextSecondary uppercase tracking-[0.2em] text-center max-w-[140px]">This logo will appear on all generated POs and Invoices.</p>
            </div>

            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <Input label="Firm Display Name" name="storeName" value={formData?.storeName || ''} onChange={handleChange} placeholder="e.g. G3+" />
                 <Input label="Legal Entity Name" name="name" value={formData?.name || ''} onChange={handleChange} placeholder="e.g. K S Trading" />
              </div>
              
              <div className="space-y-1.5">
                 <label className="text-xs font-black text-lightTextSecondary uppercase tracking-widest ml-1">Legal Address</label>
                 <textarea 
                    name="address"
                    value={formData?.address || ''}
                    onChange={handleChange as any}
                    className="w-full min-h-[100px] border border-lightBorder dark:border-navy-700 rounded-xl px-4 py-3 bg-white dark:bg-navy-900 text-lightText dark:text-white font-bold text-sm focus:ring-4 focus:ring-lightPrimary/10 outline-none transition-all resize-none shadow-sm"
                    placeholder="Enter full physical address for tax purposes..."
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <Input label="Primary Phone" name="phone" value={formData?.phone || ''} onChange={handleChange} placeholder="+91..." />
                 <Input label="Tax ID / GSTIN" name="gstin" value={formData?.gstin || ''} onChange={handleChange} placeholder="ID-12345678" />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button onClick={handleSave} className="flex-1 h-14 bg-lightPrimary shadow-xl shadow-lightPrimary/20 font-black uppercase tracking-widest text-xs">
                   {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                   {isNewFirm ? 'Create Legal Profile' : 'Commit Changes'}
                </Button>
                {!isNewFirm && firms.length > 1 && (
                  <Button 
                    onClick={initiateDelete} 
                    variant="ghost" 
                    className="h-14 px-6 text-lightDanger hover:bg-red-50 border border-transparent hover:border-red-100"
                  >
                    <Trash2 size={20} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800">
            <AlertTriangle className="text-amber-500 mb-3" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">Billing Warning</p>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-500/80 leading-relaxed">Ensure address matches GST registration exactly to avoid compliance issues.</p>
         </div>
         <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-navy-800">
            <ShieldCheck className="text-indigo-500 mb-3" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-amber-400 mb-1">Security Audit</p>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-500/80 leading-relaxed">System logs all changes to firm identities for compliance tracking.</p>
         </div>
         <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <Store className="text-emerald-500 mb-3" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-amber-400 mb-1">Global Presence</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500/80 leading-relaxed">Multi-firm setup allows for distinct billing pipelines per platform.</p>
         </div>
      </div>

      <ConfirmationModal 
        isOpen={!!firmToDelete}
        onClose={() => setFirmToDelete(null)}
        onConfirm={confirmDeleteFirm}
        title="Remove Organization Profile"
        message={`Are you sure you want to delete the organization profile for "${firmToDelete?.storeName || firmToDelete?.name}"? This will disable document generation for all brands mapped to this legal entity.`}
        isProcessing={isDeleting}
      />
    </div>
  );
};
