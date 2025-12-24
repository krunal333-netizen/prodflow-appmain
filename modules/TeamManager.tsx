
import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { FloorManager, StaffType } from '../types';
import { CREW_ROLES, STAFF_TYPES, PER_MODEL_ROLES } from '../constants';
import { Card, Input, Button, Modal, Select, ConfirmationModal } from '../components/UI';
import { 
  Briefcase, Plus, Edit2, User, Trash2, BadgeCheck, Building, Plane, Sparkles, Search, 
  Filter, X, Smartphone, Wallet, Users, MoreHorizontal, Loader2, Video, Zap, 
  MapPin, CreditCard, Landmark, ShieldCheck, Upload, FileText, Eye, MoreVertical,
  Printer, Mail, Info, UserCheck
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const TeamManager: React.FC = () => {
  const { floorManagers, addFloorManager, updateFloorManager, deleteFloorManager, globalSearch, setGlobalSearch, notify } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingStaff, setViewingStaff] = useState<FloorManager | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [filterType, setFilterType] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  
  const docInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [staffToDelete, setStaffToDelete] = useState<FloorManager | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialForm: FloorManager = {
    id: '',
    name: '',
    phone: '+91 ',
    rate: 0,
    charges: { indoor: 0, outdoor: 0, live: 0, custom: 0 },
    travelCharges: 0,
    role: 'Floor Manager',
    staffType: 'Outsource',
    address: '',
    pan: '',
    gstin: '',
    documents: [],
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: ''
    }
  };

  const [formData, setFormData] = useState<FloorManager>(initialForm);

  const openNew = () => {
    setFormData({ ...initialForm, id: uuidv4() });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (fm: FloorManager) => {
    setFormData({
      ...initialForm,
      ...fm,
      charges: fm.charges || { indoor: 0, outdoor: 0, live: 0, custom: 0 },
      bankDetails: fm.bankDetails || { bankName: '', accountNumber: '', ifscCode: '', branchName: '' },
      documents: fm.documents || []
    });
    setEditingId(fm.id);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const openView = (fm: FloorManager) => {
    setViewingStaff(fm);
    setIsViewModalOpen(true);
    setActiveMenuId(null);
  };

  const initiateDelete = (fm: FloorManager) => {
    setStaffToDelete(fm);
    setActiveMenuId(null);
  };

  const confirmDeleteStaff = async () => {
    if (staffToDelete) {
      setIsDeleting(true);
      try {
        await deleteFloorManager(staffToDelete.id);
        notify('Crew record removed');
        setStaffToDelete(null);
      } catch (e) {
        console.error("Failed to delete staff", e);
        notify('Failed to delete staff', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSave = () => {
    if (editingId) {
      updateFloorManager(formData);
      notify('Crew profile updated');
    } else {
      addFloorManager(formData);
      notify('New member onboarded successfully');
    }
    setIsModalOpen(false);
  };

  const updateCharges = (type: 'indoor' | 'outdoor' | 'live' | 'custom', val: string) => {
     setFormData(prev => ({
        ...prev,
        charges: { ...prev.charges!, [type]: Number(val) }
     }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, documents: [...prev.documents, reader.result as string] }));
      };
      reader.readAsDataURL(file as Blob);
    });
    notify(`Uploaded ${files.length} document(s)`);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
    notify('Document removed');
  };

  const getStaffTypeColor = (type: StaffType) => {
    switch (type) {
      case 'Inhouse': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Outsource': return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20';
      case 'Store': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
      default: return 'bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300';
    }
  };

  const filteredCrew = useMemo(() => {
    return floorManagers.filter(fm => {
      const searchLower = globalSearch.toLowerCase();
      const matchesSearch = fm.name.toLowerCase().includes(searchLower) || fm.role.toLowerCase().includes(searchLower) || fm.phone.toLowerCase().includes(searchLower);
      const matchesType = filterType === 'All' || fm.staffType === filterType;
      const matchesRole = filterRole === 'All' || fm.role === filterRole;
      return matchesSearch && matchesType && matchesRole;
    });
  }, [floorManagers, globalSearch, filterType, filterRole]);

  const isPerModelRole = PER_MODEL_ROLES.includes(formData.role);

  return (
    <div className="space-y-8 animate-pageInUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-teal-50 dark:bg-teal-900/30 rounded-2xl text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/50 shadow-sm">
            <Briefcase size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-lightText dark:text-white font-display tracking-tight leading-none">Crew Directory</h1>
            <p className="text-lightTextSecondary dark:text-gray-400 text-sm font-medium mt-1.5 tracking-wide">Manage production staff and creative experts</p>
          </div>
        </div>
        <Button onClick={openNew} size="md" className="w-full md:w-auto shadow-lg shadow-teal-500/10">
          <Plus size={18} strokeWidth={3} /> New Member
        </Button>
      </div>

      <Card className="no-print border-none bg-white dark:bg-navy-800 shadow-soft relative z-[50]">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2.5} />
            <input 
              type="text" 
              placeholder="Search by name, role or phone..." 
              className="w-full h-[50px] pl-11 pr-4 border border-lightBorder dark:border-navy-700 rounded-xl focus:ring-4 focus:ring-lightPrimary/5 focus:border-lightPrimary outline-none bg-white dark:bg-navy-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-bold text-sm transition-all shadow-sm"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-52">
               <Select icon={Filter} options={['All', ...STAFF_TYPES]} value={filterType} onChange={(e) => setFilterType(e.target.value)} placeholder="Employment Type" />
            </div>
            <div className="w-full sm:w-52">
               <Select icon={BadgeCheck} options={['All', ...CREW_ROLES]} value={filterRole} onChange={(e) => setFilterRole(e.target.value)} placeholder="All Roles" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
        {filteredCrew.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 font-bold italic bg-white/20 dark:bg-navy-800/20 rounded-2xl border-2 border-dashed border-lightBorder dark:border-navy-700">No matching crew found.</div>
        ) : (
          filteredCrew.map(fm => (
            <Card key={fm.id} noPadding className="group relative overflow-visible border-none hover:shadow-xl transition-all h-full flex flex-col">
               <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-14 h-14 rounded-2xl bg-lightBgSecondary dark:bg-navy-900 flex items-center justify-center text-teal-600 border border-lightBorder dark:border-navy-700 shadow-sm relative">
                        <User size={28} />
                        {fm.documents?.length > 0 && (
                          <div className="absolute -top-2 -right-2 bg-lightSuccess text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                             {fm.documents.length}
                          </div>
                        )}
                     </div>
                     
                     {/* Action Dropdown */}
                     <div className="relative">
                        <button 
                           onClick={() => setActiveMenuId(activeMenuId === fm.id ? null : fm.id)}
                           className="p-2 text-lightTextSecondary hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                        >
                           <MoreVertical size={20} />
                        </button>
                        
                        {activeMenuId === fm.id && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenuId(null)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-lightBorder dark:border-navy-700 z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                               <button onClick={() => openView(fm)} className="w-full text-left px-4 py-3 text-xs font-bold text-lightText dark:text-white hover:bg-lightBgSecondary dark:hover:bg-navy-900 flex items-center gap-3">
                                  <Eye size={16} className="text-teal-500" /> View Profile
                               </button>
                               <button onClick={() => openEdit(fm)} className="w-full text-left px-4 py-3 text-xs font-bold text-lightText dark:text-white hover:bg-lightBgSecondary dark:hover:bg-navy-900 flex items-center gap-3">
                                  <Edit2 size={16} className="text-indigo-500" /> Edit Details
                               </button>
                               <button onClick={() => initiateDelete(fm)} className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 border-t border-lightBorder dark:border-navy-700">
                                  <Trash2 size={16} /> Remove Record
                               </button>
                            </div>
                          </>
                        )}
                     </div>
                  </div>
                  
                  <h3 className="font-black text-lightText dark:text-white capitalize truncate">{fm.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">{fm.role}</span>
                     <div className="w-1 h-1 rounded-full bg-lightBorder"></div>
                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStaffTypeColor(fm.staffType)}`}>{fm.staffType}</span>
                  </div>

                  <div className="mt-auto space-y-2.5 pt-4 border-t border-lightBorder dark:border-navy-700/50">
                     <div className="flex items-center justify-between text-[11px] font-bold">
                        <div className="flex items-center gap-2 text-lightTextSecondary">
                           <Smartphone size={12} />
                           <span>{fm.phone}</span>
                        </div>
                        <span className="text-lightText dark:text-white">₹{fm.rate.toLocaleString()}</span>
                     </div>
                  </div>
               </div>
            </Card>
          ))
        )}
      </div>

      {/* Crew Profile Detail Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Crew Profile Bio-Data">
        {viewingStaff && (
          <div className="p-0 flex flex-col bg-white dark:bg-navy-900">
             <div className="p-8 border-b border-lightBorder dark:border-navy-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 shadow-inner">
                      <User size={40} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-lightText dark:text-white tracking-tight leading-none mb-2">{viewingStaff.name}</h2>
                      <div className="flex flex-wrap gap-2">
                         <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-teal-200 text-teal-600">{viewingStaff.role}</span>
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStaffTypeColor(viewingStaff.staffType)}`}>{viewingStaff.staffType}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-3">
                   <Button variant="secondary" onClick={() => window.print()} className="h-10 text-xs"><Printer size={16} /> Print</Button>
                   <Button onClick={() => openEdit(viewingStaff)} className="h-10 text-xs"><Edit2 size={16} /> Update Member</Button>
                </div>
             </div>

             <div className="p-8 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {/* Contact & Identity */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-lightBorder dark:border-navy-700 pb-2">
                        <Info size={16} className="text-teal-500" />
                        <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Member Info</h4>
                      </div>
                      <div className="space-y-4">
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Direct Contact</p>
                            <p className="text-sm font-black text-lightText dark:text-white">{viewingStaff.phone || 'N/A'}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Address</p>
                            <p className="text-xs font-bold text-lightText dark:text-white leading-relaxed">{viewingStaff.address || 'Address not registered.'}</p>
                         </div>
                      </div>
                   </div>

                   {/* Rate Card */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-lightBorder dark:border-navy-700 pb-2">
                        <Wallet size={16} className="text-emerald-500" />
                        <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Remuneration Card</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">{PER_MODEL_ROLES.includes(viewingStaff.role) ? 'Base Per Model Rate' : 'Base Shift Rate'}</p>
                            <p className="text-sm font-black text-lightText dark:text-white">₹{viewingStaff.rate.toLocaleString()}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Travel Allowance</p>
                            <p className="text-sm font-black text-emerald-600">₹{viewingStaff.travelCharges?.toLocaleString() || '0'}</p>
                         </div>
                         {viewingStaff.charges && (
                           <>
                             <div className="col-span-2 pt-2 border-t border-lightBorder dark:border-navy-700/50 flex gap-6">
                                <div>
                                   <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Studio</p>
                                   <p className="text-xs font-black text-lightText dark:text-white">₹{viewingStaff.charges.indoor.toLocaleString()}</p>
                                </div>
                                <div>
                                   <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Outdoor</p>
                                   <p className="text-xs font-black text-lightText dark:text-white">₹{viewingStaff.charges.outdoor.toLocaleString()}</p>
                                </div>
                                <div>
                                   <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Live</p>
                                   <p className="text-xs font-black text-lightText dark:text-white">₹{viewingStaff.charges.live?.toLocaleString() || '0'}</p>
                                </div>
                             </div>
                           </>
                         )}
                      </div>
                   </div>
                </div>

                {/* Compliance & Banking Banner */}
                <div className="p-8 bg-teal-50 dark:bg-navy-800/50 rounded-2xl border border-teal-100 dark:border-navy-700 grid grid-cols-1 md:grid-cols-4 gap-8">
                   <div className="flex flex-col">
                      <p className="text-[9px] font-black text-teal-500 uppercase tracking-widest mb-2">PAN Card</p>
                      <p className="text-sm font-black text-lightText dark:text-white uppercase tracking-widest">{viewingStaff.pan || 'NOT LISTED'}</p>
                   </div>
                   <div className="flex flex-col">
                      <p className="text-[9px] font-black text-teal-500 uppercase tracking-widest mb-2">GSTIN</p>
                      <p className="text-sm font-black text-lightText dark:text-white uppercase truncate">{viewingStaff.gstin || 'NOT REGISTERED'}</p>
                   </div>
                   <div className="flex flex-col">
                      <p className="text-[9px] font-black text-teal-500 uppercase tracking-widest mb-2">Bank A/C No.</p>
                      <p className="text-sm font-black text-lightText dark:text-white tracking-widest font-sans">{viewingStaff.bankDetails?.accountNumber || 'N/A'}</p>
                   </div>
                   <div className="flex flex-col">
                      <p className="text-[9px] font-black text-teal-500 uppercase tracking-widest mb-2">Bank / IFSC</p>
                      <p className="text-[10px] font-black text-lightText dark:text-white uppercase">{viewingStaff.bankDetails?.bankName} ({viewingStaff.bankDetails?.ifscCode || 'N/A'})</p>
                   </div>
                </div>

                {/* Document Gallery */}
                {viewingStaff.documents.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-lightBorder dark:border-navy-700">
                     <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Identity Documents ({viewingStaff.documents.length})</h4>
                     <div className="flex flex-wrap gap-4">
                        {viewingStaff.documents.map((doc, idx) => (
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Update Member Profile" : "Onboard Crew Member"}>
        <div className="p-8 space-y-10 pb-12 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Full Legal Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Rahul Sharma" />
            <Input label="Direct Contact Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 " />
            <Select label="Primary Production Role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} options={CREW_ROLES} />
            <Select label="Employment Status" value={formData.staffType} onChange={e => setFormData({...formData, staffType: e.target.value as StaffType})} options={STAFF_TYPES} />
            <Input label="Physical Address" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full physical address..." icon={MapPin} />
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-3 ml-1">
                <Wallet size={16} className="text-teal-600" />
                <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Commercial Rate Card</h4>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-lightBgSecondary/40 dark:bg-navy-900/40 rounded-2xl border border-lightBorder dark:border-navy-700">
               <Input 
                 label={isPerModelRole ? "Base Per Model Rate" : "Standard Shift Rate (Base)"} 
                 type="number" 
                 value={formData.rate || ''} 
                 onChange={e => setFormData({...formData, rate: Number(e.target.value)})} 
                 placeholder="0.00" 
                 icon={isPerModelRole ? UserCheck : CreditCard} 
               />
               <Input label="Travel Allowance / TA" type="number" value={formData.travelCharges || ''} onChange={e => setFormData({...formData, travelCharges: Number(e.target.value)})} placeholder="0.00" icon={Plane} />
               
               {isPerModelRole && (
                 <div className="col-span-full space-y-4 pt-4 border-t border-lightBorder dark:border-navy-700/50">
                    <div className="flex items-center gap-2 mb-2">
                       <Sparkles size={14} className="text-amber-500" />
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-lightTextSecondary">Per Model Rates (Platform Specific)</h5>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                       <Input label="Studio Per Model" type="number" value={formData.charges?.indoor || ''} onChange={e => updateCharges('indoor', e.target.value)} placeholder="0" icon={Video} />
                       <Input label="Outdoor Per Model" type="number" value={formData.charges?.outdoor || []} onChange={e => updateCharges('outdoor', e.target.value)} placeholder="0" icon={MapPin} />
                       <Input label="Live Per Model" type="number" value={formData.charges?.live || ''} onChange={e => updateCharges('live', e.target.value)} placeholder="0" icon={Zap} />
                       <Input label="Custom / Special" type="number" value={formData.charges?.custom || ''} onChange={updateCharges.bind(null, 'custom') as any} placeholder="0" icon={Sparkles} />
                    </div>
                 </div>
               )}
             </div>
          </div>

          {/* Compliance & Banking */}
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

          {/* Document Vault */}
          <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                       <Upload size={18} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-lightTextSecondary">Document Vault</h4>
                 </div>
                 <button onClick={() => docInputRef.current?.click()} className="text-[9px] font-black text-lightPrimary uppercase tracking-widest hover:underline">+ Upload File</button>
                 <input type="file" multiple className="hidden" ref={docInputRef} onChange={handleFileUpload} />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                 {formData.documents.map((doc, i) => (
                    <div key={i} className="group relative w-full aspect-square rounded-xl bg-lightBgSecondary dark:bg-navy-900 border border-lightBorder dark:border-navy-700 overflow-hidden shadow-sm">
                       <img src={doc} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                          <button onClick={() => removeDocument(i)} className="p-1.5 bg-red-500 text-white rounded-lg hover:scale-110 transition-all"><X size={14} /></button>
                       </div>
                    </div>
                 ))}
                 <button onClick={() => docInputRef.current?.click()} className="w-full aspect-square rounded-xl border-2 border-dashed border-lightBorder dark:border-navy-700 flex flex-col items-center justify-center text-lightTextSecondary hover:border-lightPrimary/40 hover:bg-lightPrimary/5 transition-all gap-2">
                    <Plus size={20} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-center">Add Doc</span>
                 </button>
              </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-lightBorder dark:border-navy-700">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 font-black uppercase tracking-widest text-[11px]">Discard</Button>
            <Button onClick={handleSave} className="flex-1 shadow-lg shadow-teal-500/20 font-black uppercase tracking-widest text-[11px]">Save Profile</Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        onConfirm={confirmDeleteStaff}
        title="Remove Crew Member"
        message={`Are you sure you want to remove "${staffToDelete?.name}"?`}
        isProcessing={isDeleting}
      />
    </div>
  );
};
