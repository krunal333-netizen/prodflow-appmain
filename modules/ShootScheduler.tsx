
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Shoot, ShootType, Expense, Model, FloorManager, CrewMember, FloorType } from '../types';
import { SHOOT_TYPES, EXPENSE_CATEGORIES, PER_MODEL_ROLES, PROFILE_TYPES, FLOOR_TYPES } from '../constants';
import { Card, Input, Select, Button, Modal, ConfirmationModal } from '../components/UI';
import { 
  Calendar, Plus, MapPin, Trash2, X, Briefcase, Video, Edit2, Target, Search, 
  Filter, Printer, DollarSign, Calculator, Lock, TrendingUp, AlertCircle, 
  Save, CheckCircle2, ShoppingBag, Youtube, Zap, Globe, PlusCircle, 
  MoreVertical, Eye, Info, Receipt, Users, Layers, FileText, Image as ImageIcon, Upload, Sparkles, Loader2, AlertTriangle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { analyzeBudget } from '../services/geminiService';

export const ShootScheduler: React.FC = () => {
  const { shoots, addShoot, updateShoot, deleteShoot, models, floorManagers, currentUser, accessConfig, notify } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'team' | 'ledger'>('details');
  const [formData, setFormData] = useState<Shoot | null>(null);
  const [viewingShoot, setViewingShoot] = useState<Shoot | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const moodBoardInputRef = useRef<HTMLInputElement>(null);

  // AI Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // Delete State
  const [shootToDelete, setShootToDelete] = useState<Shoot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isAdmin = currentUser?.role === 'ADMIN';

  const initialShoot: Shoot = {
    id: '',
    title: '',
    campaignDetails: '',
    moodBoard: [],
    type: ShootType.STUDIO_REELS,
    page: PROFILE_TYPES[0],
    date: new Date().toISOString().split('T')[0],
    locationType: 'Studio',
    locationName: 'Main Studio',
    floors: [],
    modelIds: [],
    floorManagerIds: [],
    crew: [],
    budget: 0,
    expenses: [],
    status: 'Planning'
  };

  const getStatusColor = (status: Shoot['status']) => {
    switch (status) {
      case 'Planning':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20';
      case 'Scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20';
      case 'In Progress':
        return 'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/20';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20';
      case 'Postponed':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const openNewShoot = () => {
    setFormData({ ...initialShoot, id: uuidv4() });
    setLastSaved(null);
    setActiveTab('details');
    setIsModalOpen(true);
  };

  const openEditShoot = (shoot: Shoot) => {
    const validModelIds = (shoot.modelIds || []).filter(id => models.some(m => m.id === id));
    const validFmIds = (shoot.floorManagerIds || []).filter(id => floorManagers.some(fm => fm.id === id));
    
    setFormData({
      ...initialShoot,
      ...shoot,
      modelIds: validModelIds,
      floorManagerIds: validFmIds,
      expenses: shoot.expenses || [],
      moodBoard: shoot.moodBoard || []
    });
    setLastSaved(null);
    setActiveTab('details');
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const openViewShoot = (shoot: Shoot) => {
    setViewingShoot(shoot);
    setAuditResult(null);
    setIsViewModalOpen(true);
    setActiveMenuId(null);
  };

  const handleAiAudit = async () => {
    if (!viewingShoot) return;
    setIsAuditing(true);
    try {
      const result = await analyzeBudget(viewingShoot, models);
      setAuditResult(result);
      notify('AI Budget analysis generated');
    } catch (err) {
      console.error("AI Audit failed", err);
      notify('AI Analysis failed', 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  const syncFinancials = (currentShoot: Shoot): Expense[] => {
    const newExpenses: Expense[] = [];
    const modelCount = currentShoot.modelIds.length;
    
    currentShoot.modelIds.forEach(mId => {
      const model = models.find(m => m.id === mId);
      if (model) {
        let rate = 0;
        const type = currentShoot.type;
        
        if (type === ShootType.LIVE) rate = model.charges.live;
        else if (type === ShootType.STUDIO_REELS) rate = model.charges.indoorReels;
        else if (type === ShootType.OUTDOOR_REELS) rate = model.charges.outdoorReels;
        else if (type === ShootType.STORE_REELS) rate = model.charges.storeReels;
        else if (type === ShootType.ADVT) rate = model.charges.advt;
        else if (type === ShootType.YOUTUBE_INFLUENCER) rate = model.charges.youtubeInfluencer;
        else if (type === ShootType.YOUTUBE_VIDEO) rate = model.charges.youtubeVideo;
        else if (type === ShootType.YOUTUBE_SHORTS) rate = model.charges.youtubeShorts;
        
        if (rate === 0) {
          if (currentShoot.locationType === 'Outdoor') rate = model.charges.outdoorReels || model.charges.custom;
          else if (currentShoot.locationType === 'Studio') rate = model.charges.indoorReels || model.charges.custom;
          else rate = model.charges.custom || 0;
        }

        const existingFee = currentShoot.expenses.find(e => e.linkedId === model.id && e.category === 'Talent');
        newExpenses.push({
          id: existingFee?.id || uuidv4(),
          description: existingFee?.description || `MODEL: ${model.name}`,
          category: 'Talent',
          date: currentShoot.date,
          estimatedAmount: (existingFee && existingFee.estimatedAmount > 0) ? existingFee.estimatedAmount : rate,
          actualAmount: existingFee?.actualAmount || 0,
          paymentStatus: existingFee?.paymentStatus || 'Pending',
          paidAmount: existingFee?.paidAmount || 0,
          attachments: existingFee?.attachments || [],
          linkedId: model.id
        });

        if (model.travelCharges > 0) {
           const existingTravel = currentShoot.expenses.find(e => e.linkedId === `${model.id}_travel`);
           newExpenses.push({
             id: existingTravel?.id || uuidv4(),
             description: existingTravel?.description || `Travel: ${model.name}`,
             category: 'Travelling',
             date: currentShoot.date,
             estimatedAmount: (existingTravel && existingTravel.estimatedAmount > 0) ? existingTravel.estimatedAmount : model.travelCharges,
             actualAmount: existingTravel?.actualAmount || 0,
             paymentStatus: existingTravel?.paymentStatus || 'Pending',
             paidAmount: existingTravel?.paidAmount || 0,
             attachments: existingTravel?.attachments || [],
             linkedId: `${model.id}_travel`
           });
        }
      }
    });

    currentShoot.floorManagerIds.forEach(fmId => {
      const crew = floorManagers.find(fm => fm.id === fmId);
      if (crew) {
        let baseRate = 0;
        if (currentShoot.type === ShootType.LIVE && crew.charges?.live) baseRate = crew.charges.live;
        else if (currentShoot.locationType === 'Outdoor' && crew.charges?.outdoor) baseRate = crew.charges.outdoor;
        else if (currentShoot.locationType === 'Studio' && crew.charges?.indoor) baseRate = crew.charges.indoor;
        if (baseRate === 0) baseRate = crew.rate;

        const isPerModel = PER_MODEL_ROLES.includes(crew.role);
        const multiplier = isPerModel ? Math.max(1, modelCount) : 1;
        const totalEstimated = baseRate * multiplier;

        const existing = currentShoot.expenses.find(e => e.linkedId === crew.id && e.category !== 'Travelling');
        newExpenses.push({
          id: existing?.id || uuidv4(),
          description: existing?.description || `${crew.role.toUpperCase()}: ${crew.name}${isPerModel ? ` (${modelCount} Models)` : ''}`,
          category: crew.role, 
          date: currentShoot.date,
          estimatedAmount: (existing && existing.estimatedAmount > 0) ? existing.estimatedAmount : totalEstimated,
          actualAmount: existing?.actualAmount || 0,
          paymentStatus: existing?.paymentStatus || 'Pending',
          paidAmount: existing?.paidAmount || 0,
          attachments: existing?.attachments || [],
          linkedId: crew.id
        });

        if (crew.travelCharges && crew.travelCharges > 0) {
           const existingTravel = currentShoot.expenses.find(e => e.linkedId === `${crew.id}_travel`);
           newExpenses.push({
             id: existingTravel?.id || uuidv4(),
             description: existingTravel?.description || `Travel: ${crew.name}`,
             category: 'Travelling',
             date: currentShoot.date,
             estimatedAmount: (existingTravel && existingTravel.estimatedAmount > 0) ? existingTravel.estimatedAmount : crew.travelCharges,
             actualAmount: existingTravel?.actualAmount || 0,
             paymentStatus: existingTravel?.paymentStatus || 'Pending',
             paidAmount: existingTravel?.paidAmount || 0,
             attachments: existingTravel?.attachments || [],
             linkedId: `${crew.id}_travel`
           });
        }
      }
    });

    const linkedIds = new Set(newExpenses.map(ne => ne.linkedId));
    const manualOverheads = currentShoot.expenses.filter(e => !e.linkedId || !linkedIds.has(e.linkedId));

    return [...newExpenses, ...manualOverheads];
  };

  const handleTypeChange = (type: ShootType) => {
    if (!formData) return;
    setFormData({ ...formData, type });
    setLastSaved(null);
  };

  const handleLocationChange = (locationType: 'Studio' | 'Outdoor' | 'Store') => {
    if (!formData) return;
    setFormData({ ...formData, locationType });
    setLastSaved(null);
  };

  const handleMoodBoardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !formData) return;
    
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => prev ? ({
          ...prev,
          moodBoard: [...(prev.moodBoard || []), reader.result as string]
        }) : null);
        setLastSaved(null);
      };
      reader.readAsDataURL(file);
    });
    notify(`Moodboard updated with ${files.length} images`);
    if (moodBoardInputRef.current) moodBoardInputRef.current.value = '';
  };

  const removeMoodBoardImage = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      moodBoard: (formData.moodBoard || []).filter((_, i) => i !== index)
    });
    setLastSaved(null);
    notify('Image removed from moodboard');
  };

  const handleSave = () => {
    if (!formData) return;
    const finalExpenses = syncFinancials(formData);
    const shootToSave = { ...formData, expenses: finalExpenses };
    if (shoots.some(s => s.id === shootToSave.id)) {
      updateShoot(shootToSave);
      notify('Production ledger updated');
    } else {
      addShoot(shootToSave);
      notify('New production project initialized');
    }
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setFormData(shootToSave);
  };

  const initiateDelete = (shoot: Shoot) => {
    setShootToDelete(shoot);
    setActiveMenuId(null);
  };

  const confirmDeleteShoot = async () => {
    if (shootToDelete) {
      setIsDeleting(true);
      try {
        await deleteShoot(shootToDelete.id);
        notify('Production project deleted');
        setShootToDelete(null);
      } catch (e) {
        console.error("Failed to delete shoot", e);
        notify('Failed to delete project', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const addManualExpense = () => {
    if (!formData) return;
    const newExp: Expense = {
      id: uuidv4(),
      description: 'Manual Expense',
      category: 'Custom',
      date: formData.date,
      estimatedAmount: 0,
      actualAmount: 0,
      paymentStatus: 'Pending',
      paidAmount: 0,
      attachments: []
    };
    setFormData({ ...formData, expenses: [...formData.expenses, newExp] });
    setLastSaved(null);
  };

  const deleteExpense = (id: string) => {
    if (!formData) return;
    setFormData({ ...formData, expenses: formData.expenses.filter(e => e.id !== id) });
    setLastSaved(null);
    notify('Expense item removed');
  };

  const totals = useMemo(() => {
    if (!formData) return { estimated: 0, actual: 0 };
    return formData.expenses.reduce((acc, exp) => ({
      estimated: acc.estimated + (exp.estimatedAmount || 0),
      actual: acc.actual + (exp.actualAmount || 0)
    }), { estimated: 0, actual: 0 });
  }, [formData?.expenses]);

  const viewTotals = useMemo(() => {
    if (!viewingShoot) return { estimated: 0, actual: 0 };
    return viewingShoot.expenses.reduce((acc, exp) => ({
      estimated: acc.estimated + (exp.estimatedAmount || 0),
      actual: acc.actual + (exp.actualAmount || 0)
    }), { estimated: 0, actual: 0 });
  }, [viewingShoot]);

  return (
    <div className="space-y-8 animate-pageInUp">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-lightText dark:text-white font-display tracking-tight leading-none">Production Manager</h1>
          <p className="text-lightTextSecondary dark:text-gray-400 text-sm font-medium mt-1.5 tracking-wide">Unified scheduling & commercial tracking</p>
        </div>
        <Button onClick={openNewShoot} size="lg" className="shadow-2xl shadow-lightPrimary/20">
          <Plus size={20} strokeWidth={3} /> New Production
        </Button>
      </div>

      <Card className="border-none shadow-soft">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-lightTextSecondary" size={18} strokeWidth={2.5} />
            <input 
              type="text" 
              placeholder="Search production titles..." 
              className="w-full h-[50px] pl-11 pr-4 bg-white dark:bg-navy-900 border border-lightBorder dark:border-navy-700 rounded-lg focus:ring-4 focus:ring-lightPrimary/5 outline-none text-sm font-bold dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select 
              options={['All', 'Planning', 'Scheduled', 'In Progress', 'Completed', 'Postponed', 'Cancelled']}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Status Filter"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
        {shoots.filter(s => (statusFilter === 'All' || s.status === statusFilter) && s.title.toLowerCase().includes(searchTerm.toLowerCase())).map(shoot => (
          <Card key={shoot.id} noPadding className="hover:scale-[1.02] transition-all flex flex-col border-none shadow-soft h-full group">
            <div className="p-7 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-lightPrimary/10 text-lightPrimary flex items-center justify-center border border-lightPrimary/20">
                  <Video size={24} strokeWidth={2.5} />
                </div>
                
                {/* 3-Dot Responsive Action Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === shoot.id ? null : shoot.id)}
                    className="p-2 text-lightTextSecondary hover:text-lightPrimary hover:bg-lightPrimary/5 rounded-lg transition-all"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {activeMenuId === shoot.id && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenuId(null)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-lightBorder dark:border-navy-700 z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                         <button onClick={() => openViewShoot(shoot)} className="w-full text-left px-4 py-3 text-xs font-bold text-lightText dark:text-white hover:bg-lightBgSecondary dark:hover:bg-navy-900 flex items-center gap-3">
                            <Eye size={16} className="text-blue-500" /> View Summary
                         </button>
                         <button onClick={() => openEditShoot(shoot)} className="w-full text-left px-4 py-3 text-xs font-bold text-lightText dark:text-white hover:bg-lightBgSecondary dark:hover:bg-navy-900 flex items-center gap-3">
                            <Edit2 size={16} className="text-indigo-500" /> Edit Production
                         </button>
                         <button onClick={() => initiateDelete(shoot)} className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 border-t border-lightBorder dark:border-navy-700">
                            <Trash2 size={16} /> Delete Project
                         </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-black text-lightText dark:text-white mb-4 line-clamp-1">{shoot.title}</h3>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm font-bold text-lightTextSecondary">
                  <Calendar size={14} className="text-indigo-500" />
                  {new Date(shoot.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-lightTextSecondary">
                  <Globe size={14} className="text-emerald-500" />
                  <span>{shoot.page || 'Platform Not Assigned'}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-lightBorder dark:border-navy-700/50 flex justify-between items-center">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(shoot.status)}`}>
                  {shoot.status}
                </span>
                {isAdmin && (
                  <div className="text-right">
                    <p className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest leading-none mb-1">Budget</p>
                    <span className="font-black text-lightText dark:text-white">₹{shoot.budget.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Production Summary Read-Only Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Production Summary">
        {viewingShoot && (
          <div className="p-0 flex flex-col bg-white dark:bg-navy-900">
             {/* Header Section */}
             <div className="p-8 border-b border-lightBorder dark:border-navy-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shadow-inner">
                      <Video size={40} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-lightText dark:text-white tracking-tight leading-none mb-2">{viewingShoot.title}</h2>
                      <div className="flex flex-wrap gap-2">
                         <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-indigo-200 text-indigo-600">{viewingShoot.type}</span>
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStatusColor(viewingShoot.status)}`}>{viewingShoot.status}</span>
                         <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">{viewingShoot.page}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-3">
                   <Button variant="secondary" onClick={handleAiAudit} disabled={isAuditing} className="h-10 text-[10px] uppercase tracking-widest border-indigo-200 text-indigo-600">
                      {isAuditing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                      AI Budget Audit
                   </Button>
                   <Button variant="secondary" onClick={() => window.print()} className="h-10 text-xs"><Printer size={16} /> Print</Button>
                   <Button onClick={() => openEditShoot(viewingShoot)} className="h-10 text-xs"><Edit2 size={16} /> Update Plan</Button>
                </div>
             </div>

             <div className="p-8 space-y-12">
                {/* AI Audit Result Banner */}
                {auditResult && (
                  <div className="animate-in slide-in-from-top-4 fade-in duration-500 p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-navy-800 dark:to-navy-900 rounded-3xl border border-indigo-100 dark:border-navy-700 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-100 dark:border-navy-700 pb-3">
                      <div className="flex items-center gap-3">
                        <Sparkles size={18} className="text-amber-500" />
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Gemini AI Commercial Audit</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-lightTextSecondary">Risk Level:</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${auditResult.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{auditResult.riskLevel}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                       <div className="space-y-3">
                          <p className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest">Analysis Summary</p>
                          <p className="text-sm font-bold text-lightText dark:text-white leading-relaxed">{auditResult.analysis}</p>
                       </div>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest">Cost Protection</p>
                            <span className="text-xs font-black text-amber-600">₹{auditResult.estimatedHiddenCosts.toLocaleString()} Buffer Suggested</span>
                          </div>
                          <div className="space-y-2">
                            {auditResult.suggestions.map((s: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs font-bold text-lightTextSecondary">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* Campaign Description */}
                {viewingShoot.campaignDetails && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-lightBorder dark:border-navy-700 pb-2">
                      <FileText size={16} className="text-indigo-500" />
                      <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Campaign Narrative</h4>
                    </div>
                    <p className="text-sm font-medium text-lightText dark:text-white/80 leading-relaxed whitespace-pre-wrap">
                      {viewingShoot.campaignDetails}
                    </p>
                  </div>
                )}

                {/* Mood Board Gallery */}
                {viewingShoot.moodBoard && viewingShoot.moodBoard.length > 0 && (
                   <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-lightBorder dark:border-navy-700 pb-2">
                      <ImageIcon size={16} className="text-brand-500" />
                      <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Creative Mood Board</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {viewingShoot.moodBoard.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-lightBorder dark:border-navy-700 shadow-sm hover:shadow-md transition-shadow cursor-zoom-in">
                          <img src={img} className="w-full h-full object-cover" alt={`Mood ${idx}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                   {/* Logistics Section */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-lightBorder dark:border-navy-700 pb-2">
                        <Info size={16} className="text-indigo-500" />
                        <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Logistics Intel</h4>
                      </div>
                      <div className="space-y-4">
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Production Date</p>
                            <p className="text-sm font-black text-lightText dark:text-white">{new Date(viewingShoot.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Environment</p>
                            <p className="text-sm font-black text-lightText dark:text-white">{viewingShoot.locationType}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Venue Details</p>
                            <p className="text-sm font-black text-lightText dark:text-white">{viewingShoot.locationName}</p>
                         </div>
                      </div>
                   </div>

                   {/* Team Roster */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-lightBorder dark:border-navy-700 pb-2">
                        <Users size={16} className="text-emerald-500" />
                        <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Assigned Talent</h4>
                      </div>
                      <div className="space-y-2">
                         {viewingShoot.modelIds.length > 0 ? (
                           models.filter(m => viewingShoot.modelIds.includes(m.id)).map(m => (
                             <div key={m.id} className="flex items-center gap-3 p-2 bg-lightBgSecondary/40 dark:bg-navy-900 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-600">{m.name.charAt(0)}</div>
                                <span className="text-xs font-bold text-lightText dark:text-white truncate">{m.name}</span>
                             </div>
                           ))
                         ) : (
                           <p className="text-xs font-bold text-lightTextSecondary italic">No talent assigned.</p>
                         )}
                      </div>
                   </div>

                   {/* Crew Roster */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-lightBorder dark:border-navy-700 pb-2">
                        <Briefcase size={16} className="text-purple-500" />
                        <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Production Crew</h4>
                      </div>
                      <div className="space-y-2">
                         {viewingShoot.floorManagerIds.length > 0 ? (
                           floorManagers.filter(fm => viewingShoot.floorManagerIds.includes(fm.id)).map(fm => (
                             <div key={fm.id} className="flex items-center justify-between p-2 bg-lightBgSecondary/40 dark:bg-navy-800 rounded-lg">
                                <span className="text-xs font-bold text-lightText dark:text-white truncate">{fm.name}</span>
                                <span className="text-[9px] font-black uppercase text-lightTextSecondary">{fm.role}</span>
                             </div>
                           ))
                         ) : (
                           <p className="text-xs font-bold text-lightTextSecondary italic">No crew assigned.</p>
                         )}
                      </div>
                   </div>
                </div>

                {/* Categories Banner */}
                {viewingShoot.floors.length > 0 && (
                  <div className="p-6 bg-indigo-50 dark:bg-navy-800/50 rounded-2xl border border-indigo-100 dark:border-navy-700">
                    <div className="flex items-center gap-2 mb-4">
                       <Layers size={14} className="text-indigo-500" />
                       <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Target Categories</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {viewingShoot.floors.map(floor => (
                         <span key={floor} className="px-3 py-1 bg-white dark:bg-navy-900 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 dark:border-navy-700 shadow-sm">{floor}</span>
                       ))}
                    </div>
                  </div>
                )}

                {/* Commercial Ledger Section */}
                <div className="space-y-6">
                   <div className="flex items-center gap-2 border-b border-lightBorder dark:border-navy-700 pb-2">
                      <Receipt size={16} className="text-emerald-500" />
                      <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-[0.2em]">Production Ledger</h4>
                   </div>
                   <div className="bg-white dark:bg-navy-900 border border-lightBorder dark:border-navy-700 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-lightBgSecondary dark:bg-navy-800 text-[9px] font-black uppercase tracking-widest text-lightTextSecondary border-b border-lightBorder dark:border-navy-700">
                          <tr>
                            <th className="px-6 py-4">Item Details</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Est. Cost</th>
                            <th className="px-6 py-4 text-right">Actual Paid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-lightBorder dark:divide-navy-700">
                           {viewingShoot.expenses.map(exp => (
                             <tr key={exp.id} className="text-xs">
                                <td className="px-6 py-4 font-bold text-lightText dark:text-white uppercase tracking-tight">{exp.description}</td>
                                <td className="px-6 py-4 text-[9px] font-black text-lightTextSecondary uppercase">{exp.category}</td>
                                <td className="px-6 py-4">
                                   <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{exp.paymentStatus}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-black">₹{exp.estimatedAmount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-black text-lightPrimary">₹{exp.actualAmount.toLocaleString()}</td>
                             </tr>
                           ))}
                        </tbody>
                        <tfoot className="bg-lightBgSecondary/40 dark:bg-navy-800/40 border-t border-lightBorder dark:border-navy-700">
                           <tr className="font-black">
                              <td colSpan={3} className="px-6 py-5 text-right text-[10px] uppercase tracking-widest text-lightTextSecondary">Shoot Totals</td>
                              <td className="px-6 py-5 text-right text-sm">₹{viewTotals.estimated.toLocaleString()}</td>
                              <td className="px-6 py-5 text-right text-sm text-lightPrimary">₹{viewTotals.actual.toLocaleString()}</td>
                           </tr>
                        </tfoot>
                      </table>
                   </div>
                </div>

                <div className="pt-8 text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                   System Generated Production Sheet • ProdFlow Enterprise
                </div>
             </div>
          </div>
        )}
      </Modal>

      {/* Existing Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData?.title || "Production Workflow"}>
        <div className="flex flex-col h-full max-h-[85vh]">
          <div className="flex border-b border-lightBorder dark:border-navy-700 shrink-0 bg-white dark:bg-navy-800 px-6 sticky top-0 z-20">
             <button onClick={() => setActiveTab('details')} className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'details' ? 'border-lightPrimary text-lightPrimary' : 'border-transparent text-lightTextSecondary hover:text-lightText'}`}>Project Details</button>
             <button onClick={() => setActiveTab('team')} className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'team' ? 'border-lightPrimary text-lightPrimary' : 'border-transparent text-lightTextSecondary hover:text-lightText'}`}>Team Selection</button>
             <button onClick={() => setActiveTab('ledger')} className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'ledger' ? 'border-lightPrimary text-lightPrimary' : 'border-transparent text-lightTextSecondary hover:text-lightText'}`}>Unified Ledger</button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-lightBgSecondary/30 dark:bg-navy-900/30">
            {formData && activeTab === 'details' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Campaign Title" 
                    value={formData.title} 
                    onChange={e => {setFormData({...formData, title: e.target.value}); setLastSaved(null);}} 
                    placeholder="e.g. Wedding Lehenga 2025" 
                    className="md:col-span-2" 
                  />
                  
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-lightText dark:text-white ml-1 flex items-center gap-2">
                      <FileText size={14} className="text-lightPrimary" /> Campaign Details
                    </label>
                    <textarea 
                      className="w-full min-h-[120px] bg-white dark:bg-navy-800 border border-lightBorder dark:border-navy-700 rounded-lg p-4 text-sm font-bold focus:ring-4 focus:ring-lightPrimary/10 outline-none transition-all resize-none shadow-sm dark:text-white"
                      placeholder="Enter detailed narrative, shoot script, or campaign objectives..."
                      value={formData.campaignDetails || ''}
                      onChange={e => {setFormData({...formData, campaignDetails: e.target.value}); setLastSaved(null);}}
                    />
                  </div>

                  <Select label="Billing Profile / Brand" options={PROFILE_TYPES} value={formData.page || ''} onChange={e => {setFormData({...formData, page: e.target.value}); setLastSaved(null);}} icon={Globe} />
                  <Select label="Production Format / Type" options={SHOOT_TYPES} value={formData.type} onChange={e => handleTypeChange(e.target.value as ShootType)} icon={Target} />
                  <Input label="Production Date" type="date" value={formData.date} onChange={e => {setFormData({...formData, date: e.target.value}); setLastSaved(null);}} />
                  <Select label="Location Environment" options={['Studio', 'Outdoor', 'Store']} value={formData.locationType} onChange={e => handleLocationChange(e.target.value as any)} icon={MapPin} />
                  <Input label="Venue Details" value={formData.locationName} onChange={e => {setFormData({...formData, locationName: e.target.value}); setLastSaved(null);}} placeholder="Studio A, 3rd Floor" />
                  <Select label="Current Status" options={['Planning', 'Scheduled', 'In Progress', 'Completed', 'Postponed', 'Cancelled']} value={formData.status} onChange={e => {setFormData({...formData, status: e.target.value as any}); setLastSaved(null);}} />
                  {isAdmin && <Input label="Production Budget" type="number" value={formData.budget || ''} onChange={e => {setFormData({...formData, budget: Number(e.target.value)}); setLastSaved(null);}} placeholder="0.00" icon={DollarSign} />}
                </div>

                <div className="space-y-4 pt-4 border-t border-lightBorder dark:border-navy-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <ImageIcon size={16} className="text-brand-500" />
                       <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest">Creative Mood Board</h4>
                    </div>
                    <button 
                      onClick={() => moodBoardInputRef.current?.click()} 
                      className="text-[9px] font-black text-lightPrimary uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <Plus size={10} strokeWidth={3} /> Upload Reference
                    </button>
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      ref={moodBoardInputRef} 
                      onChange={handleMoodBoardUpload} 
                      accept="image/*"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {(formData.moodBoard || []).map((img, i) => (
                      <div key={i} className="group relative w-full aspect-square rounded-xl bg-lightBgSecondary dark:bg-navy-900 border border-lightBorder dark:border-navy-700 overflow-hidden shadow-sm">
                         <img src={img} className="w-full h-full object-cover" alt={`Mood ${i}`} />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <button 
                              onClick={() => removeMoodBoardImage(i)} 
                              className="p-1.5 bg-red-500 text-white rounded-lg hover:scale-110 transition-all"
                            >
                              <X size={14} />
                            </button>
                         </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => moodBoardInputRef.current?.click()}
                      className="w-full aspect-square rounded-xl border-2 border-dashed border-lightBorder dark:border-navy-700 flex flex-col items-center justify-center text-lightTextSecondary hover:border-lightPrimary/40 hover:bg-lightPrimary/5 transition-all gap-2"
                    >
                      <Upload size={20} />
                      <span className="text-[8px] font-black uppercase tracking-widest text-center px-1">Add Image</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {formData && activeTab === 'team' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-lightTextSecondary flex items-center gap-2"><Briefcase size={14} className="text-lightPrimary"/> Select Talent</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {models.map(model => (
                      <button 
                        key={model.id}
                        onClick={() => {
                          const ids = formData.modelIds.includes(model.id) ? formData.modelIds.filter(id => id !== model.id) : [...formData.modelIds, model.id];
                          setFormData({ ...formData, modelIds: ids });
                          setLastSaved(null);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${formData.modelIds.includes(model.id) ? 'bg-lightPrimary/5 border-lightPrimary shadow-sm' : 'bg-white dark:bg-neutral-900 border-lightBorder dark:border-navy-700 hover:border-lightPrimary/30'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-lightPrimary/10 flex items-center justify-center text-lightPrimary font-black text-xs">{model.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black truncate">{model.name}</p>
                          <p className="text-[9px] font-bold text-lightTextSecondary uppercase tracking-widest truncate">{model.billingName ? `C/O ${model.billingName}` : 'Individual'}</p>
                        </div>
                        {formData.modelIds.includes(model.id) && <div className="w-5 h-5 bg-lightPrimary rounded-full flex items-center justify-center text-white"><X size={12} className="rotate-45" /></div>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-lightTextSecondary flex items-center gap-2"><Briefcase size={14} className="text-teal-500"/> Select Production Crew</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {floorManagers.map(fm => (
                      <button 
                        key={fm.id}
                        onClick={() => {
                          const ids = formData.floorManagerIds.includes(fm.id) ? formData.floorManagerIds.filter(id => id !== fm.id) : [...formData.floorManagerIds, fm.id];
                          setFormData({ ...formData, floorManagerIds: ids });
                          setLastSaved(null);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${formData.floorManagerIds.includes(fm.id) ? 'bg-teal-50/50 border-teal-500 shadow-sm' : 'bg-white dark:bg-neutral-900 border-lightBorder dark:border-navy-700 hover:teal-500/30'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 font-black text-xs">{fm.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black truncate">{fm.name}</p>
                          <p className="text-[9px] font-bold text-lightTextSecondary uppercase tracking-widest truncate">{fm.role}</p>
                        </div>
                        {formData.floorManagerIds.includes(fm.id) && <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white"><X size={12} className="rotate-45" /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {formData && activeTab === 'ledger' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-xs font-black uppercase tracking-widest text-lightTextSecondary flex items-center gap-2"><DollarSign size={14} className="text-emerald-500"/> Expense Ledger</h4>
                   <Button size="sm" variant="secondary" onClick={addManualExpense} className="h-9">
                      <PlusCircle size={14} /> Add Extra Line Item
                   </Button>
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-lightBorder dark:border-navy-700 rounded-2xl overflow-hidden shadow-soft">
                   <table className="w-full text-left">
                      <thead className="bg-lightBgSecondary dark:bg-neutral-800 text-[10px] font-black uppercase tracking-widest text-lightTextSecondary border-b border-lightBorder dark:border-navy-700">
                        <tr>
                          <th className="px-6 py-4">Professional / Expense Item</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Approx (Est)</th>
                          <th className="px-6 py-4 w-28">Actual Paid</th>
                          <th className="px-6 py-4 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lightBorder dark:divide-neutral-700">
                        {formData.expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-lightBgSecondary/20 dark:hover:bg-neutral-900/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                {exp.linkedId ? (
                                  <span className="text-xs font-black text-lightText dark:text-white uppercase tracking-tight">{exp.description}</span>
                                ) : (
                                  <input 
                                    className="bg-transparent border-none p-0 text-xs font-black text-lightText dark:text-white focus:ring-0 uppercase tracking-tight w-full"
                                    value={exp.description}
                                    onChange={e => {
                                      const updated = formData.expenses.map(ex => ex.id === exp.id ? {...ex, description: e.target.value} : ex);
                                      setFormData({...formData, expenses: updated});
                                    }}
                                  />
                                )}
                                <span className="text-[9px] font-black uppercase tracking-widest text-lightPrimary">{exp.category}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <select 
                                className="text-[10px] font-black border border-lightBorder dark:border-navy-700 bg-white dark:bg-neutral-900 rounded px-2 py-1 outline-none disabled:opacity-50 cursor-pointer"
                                value={exp.paymentStatus}
                                onChange={e => {
                                  const updated = formData.expenses.map(ex => ex.id === exp.id ? {...ex, paymentStatus: e.target.value as any} : ex);
                                  setFormData({...formData, expenses: updated});
                                }}
                              >
                                {['Pending', 'Advance', 'Cash', 'Part', 'Full'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number" 
                                className="w-24 bg-transparent border-none focus:ring-0 p-0 text-xs font-black text-lightText dark:text-white"
                                value={exp.estimatedAmount || ''}
                                onChange={e => {
                                  const updated = formData.expenses.map(ex => ex.id === exp.id ? {...ex, estimatedAmount: Number(e.target.value)} : ex);
                                  setFormData({...formData, expenses: updated});
                                }}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number" 
                                className="w-20 bg-transparent border-none focus:ring-0 p-0 text-xs font-black text-lightPrimary"
                                value={exp.actualAmount || ''}
                                onChange={e => {
                                  const updated = formData.expenses.map(ex => ex.id === exp.id ? {...ex, actualAmount: Number(e.target.value)} : ex);
                                  setFormData({...formData, expenses: updated});
                                }}
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button onClick={() => deleteExpense(exp.id)} className="text-lightTextSecondary hover:text-lightDanger p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-lightBgSecondary/50 dark:bg-neutral-800/50">
                        <tr className="border-t-2 border-lightBorder dark:border-navy-700">
                          <td colSpan={2} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-lightText dark:text-white text-right">Ledger Totals</td>
                          <td className="px-6 py-4 font-black text-xs text-lightText dark:text-white">₹{totals.estimated.toLocaleString()}</td>
                          <td className="px-6 py-4 font-black text-xs text-lightPrimary">₹{totals.actual.toLocaleString()}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                   </table>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-lightBorder dark:border-navy-700 bg-white dark:bg-neutral-800 shrink-0 flex items-center justify-between">
             <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button>
             <div className="flex items-center gap-4">
               {lastSaved && (
                 <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
                    <CheckCircle2 size={12} className="text-lightSuccess" />
                    <span className="text-[10px] font-bold text-lightSuccess uppercase tracking-widest">Synced at {lastSaved}</span>
                 </div>
               )}
               <Button onClick={handleSave} className="px-10 h-[50px]"><Save size={16} /> Sync & Update Ledger</Button>
             </div>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!shootToDelete}
        onClose={() => setShootToDelete(null)}
        onConfirm={confirmDeleteShoot}
        title="Delete Production"
        message={`Are you sure you want to permanently delete the production "${shootToDelete?.title}"? This will remove all associated expense records and unissued billing drafts.`}
        isProcessing={isDeleting}
      />
    </div>
  );
};
