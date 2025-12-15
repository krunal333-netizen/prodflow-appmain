import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Shoot, ShootType, FloorType, Expense, Model } from '../types';
import { SHOOT_TYPES, FLOOR_TYPES, EXPENSE_CATEGORIES, PROFILE_TYPES } from '../constants';
import { Card, Input, Select, Button, Modal } from '../components/UI';
import { Calendar, Plus, MapPin, Film, Sparkles, Users, Calculator, Trash2, Wallet, Paperclip, Printer, Eye, X, Download, FileCheck, ShoppingBag, ClipboardList, Layers } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { analyzeBudget } from '../services/geminiService';

// Helper to map categories to Print Heads
const getPrintHead = (category: string): string => {
  const foodGroup = ['Lunch', 'Breakfast', 'Tea-Coffee', 'Snacks', 'Drinks', 'Groceries', 'Cutlery', 'Food'];
  if (foodGroup.includes(category)) return 'Food';
  if (category === 'Travelling' || category === 'Transportation') return 'Transportation';
  if (category === 'Decoration' || category === 'Props' || category === 'Furniture') return 'Decoration & Props';
  return category;
};

// Helper to get Row Color based on type for the Excel-like look
const getRowColorClass = (type: string) => {
  switch (type) {
    case 'talent': 
    case 'location':
    case 'deco':
      return 'bg-[#d1e7dd] print:bg-[#d1e7dd]'; // Greenish
    case 'food':
    case 'transport':
      return 'bg-[#fff3cd] print:bg-[#fff3cd]'; // Yellowish
    default:
      return 'bg-white';
  }
};

// Helper to get correct rate based on Shoot Type
const getModelRateForShoot = (model: Model, shootType: ShootType): number => {
  if (!model.charges) return 0;
  
  switch(shootType) {
    case ShootType.INDOOR_REELS: return model.charges.indoorReels;
    case ShootType.OUTDOOR_REELS: return model.charges.outdoorReels;
    case ShootType.STORE_REELS: return model.charges.storeReels;
    case ShootType.LIVE: return model.charges.live;
    case ShootType.ADVT: return model.charges.advt;
    case ShootType.YOUTUBE_INFLUENCER: return model.charges.youtubeInfluencer;
    case ShootType.YOUTUBE_VIDEO: return model.charges.youtubeVideo;
    case ShootType.YOUTUBE_SHORTS: return model.charges.youtubeShorts;
    case ShootType.OTHER: 
    default: return model.charges.custom ?? (model.charges as any).special ?? 0;
  }
};

export const ShootScheduler: React.FC = () => {
  const { shoots, addShoot, updateShoot, models, floorManagers, firms, currentUser, pageFirmMap } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'budget'>('details');
  const [formData, setFormData] = useState<Shoot | null>(null);
  
  // Print State
  const [printMode, setPrintMode] = useState(false);
  const [printType, setPrintType] = useState<'APPROX' | 'FINAL'>('APPROX');
  
  // Budget State
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ 
    category: 'Food', 
    estimatedAmount: 0, 
    actualAmount: 0, 
    description: '',
    paymentStatus: 'Pending',
    paidAmount: 0
  });
  const [resourceCost, setResourceCost] = useState(0); 

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // File Preview
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  const initialShoot: Shoot = {
    id: '',
    title: '',
    type: ShootType.INDOOR_REELS,
    page: '', 
    date: new Date().toISOString().split('T')[0],
    locationType: 'Indoor',
    locationName: '',
    floors: [],
    modelIds: [],
    floorManagerIds: [],
    crew: [],
    budget: 0,
    expenses: [],
    status: 'Planned',
    productDetails: ''
  };

  // Calculate Fixed Resource Costs (Models + Crew)
  useEffect(() => {
    if (!formData) return;
    let rCost = 0;
    
    // Models
    formData.modelIds.forEach(mid => {
      const model = models.find(m => m.id === mid);
      if (model) {
        const rate = getModelRateForShoot(model, formData.type);
        rCost += (rate || 0);
        rCost += (model.travelCharges || 0);
      }
    });

    // Outsourced Crew
    formData.floorManagerIds.forEach(fid => {
       const staff = floorManagers.find(f => f.id === fid);
       if (staff && staff.staffType === 'Outsource') {
          rCost += (staff.rate || 0);
          rCost += (staff.travelCharges || 0);
       }
    });
    setResourceCost(rCost);
  }, [formData, models, floorManagers]);

  const openNewShoot = () => {
    setFormData({ ...initialShoot, id: uuidv4() });
    setAiAnalysis(null);
    setActiveTab('details');
    setIsModalOpen(true);
  };

  const openEditShoot = (shoot: Shoot) => {
    setFormData(shoot);
    setAiAnalysis(null);
    setActiveTab('details');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData) return;
    const exists = shoots.find(s => s.id === formData.id);
    if (exists) updateShoot(formData);
    else addShoot(formData);
    setIsModalOpen(false);
  };

  const toggleFloor = (floor: FloorType) => {
    if (!formData) return;
    const current = formData.floors;
    const updated = current.includes(floor) ? current.filter(f => f !== floor) : [...current, floor];
    setFormData({ ...formData, floors: updated });
  };

  const toggleModel = (id: string) => {
    if (!formData) return;
    const current = formData.modelIds;
    const updated = current.includes(id) ? current.filter(m => m !== id) : [...current, id];
    setFormData({ ...formData, modelIds: updated });
  };

  const toggleFloorManager = (id: string) => {
    if (!formData) return;
    const current = formData.floorManagerIds || []; 
    const updated = current.includes(id) ? current.filter(fid => fid !== id) : [...current, id];
    setFormData({ ...formData, floorManagerIds: updated });
  };

  // --- EXPENSE MANAGEMENT ---

  const addManualExpense = () => {
    if (!formData || !newExpense.estimatedAmount || !newExpense.description) return;
    const expense: Expense = {
      id: uuidv4(),
      description: newExpense.description,
      estimatedAmount: Number(newExpense.estimatedAmount),
      actualAmount: 0,
      paidAmount: 0,
      category: newExpense.category || 'Custom',
      paymentStatus: 'Pending',
      date: new Date().toISOString().split('T')[0],
      attachments: []
    };
    setFormData({
      ...formData,
      expenses: [...formData.expenses, expense]
    });
    setNewExpense({ category: 'Food', estimatedAmount: 0, actualAmount: 0, description: '', paymentStatus: 'Pending', paidAmount: 0 });
  };

  const updateExpense = (id: string, field: keyof Expense, value: any) => {
    if (!formData) return;
    const updatedExpenses = formData.expenses.map(exp => {
      if (exp.id === id) {
        if (field === 'paymentStatus' && value === 'Full') {
           return { ...exp, paymentStatus: 'Full' as const, paidAmount: exp.actualAmount > 0 ? exp.actualAmount : exp.estimatedAmount };
        }
        return { ...exp, [field]: value };
      }
      return exp;
    });
    setFormData({ ...formData, expenses: updatedExpenses as Expense[] });
  };

  const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const updatedExpenses = formData.expenses.map(exp => 
          exp.id === id ? { ...exp, attachments: [...exp.attachments, base64] } : exp
        );
        setFormData({ ...formData, expenses: updatedExpenses });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeExpense = (id: string) => {
    if (!formData) return;
    setFormData({ ...formData, expenses: formData.expenses.filter(e => e.id !== id) });
  };

  // --- ANALYSIS & PRINT ---

  const runAiAnalysis = async () => {
    if (!formData) return;
    setIsAnalyzing(true);
    const result = await analyzeBudget(formData, models);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handlePrintReport = (type: 'APPROX' | 'FINAL') => {
    setPrintType(type);
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 500);
  };

  // --- PRINT DATA PREPARATION ---
  const preparePrintRows = () => {
    if (!formData) return [];
    let rows: any[] = [];
    let sr = 1;

    // 1. Models (Green)
    formData.modelIds.forEach(mid => {
       const m = models.find(mo => mo.id === mid);
       if (m) {
          const fee = getModelRateForShoot(m, formData.type);
          rows.push({
             sr: sr++,
             head: 'Model',
             details: `${m.name} (${formData.type})`,
             estAmount: fee,
             actAmount: fee, // Usually fixed
             paid: fee, 
             remarks: '',
             type: 'talent'
          });
          if (m.travelCharges > 0) {
             rows.push({
                sr: '',
                head: '',
                details: 'Traveling',
                estAmount: m.travelCharges,
                actAmount: m.travelCharges,
                paid: m.travelCharges,
                remarks: 'Approx',
                type: 'talent'
             });
          }
       }
    });

    // 2. Location (Green)
    if (formData.locationName) {
       const locExp = formData.expenses.find(e => e.category === 'Location');
       const est = locExp ? locExp.estimatedAmount : 0;
       const act = locExp ? locExp.actualAmount : 0;
       const paid = locExp ? locExp.paidAmount : 0;
       rows.push({
          sr: sr++,
          head: 'Location Rent',
          details: formData.locationName,
          estAmount: est > 0 ? est : '',
          actAmount: act > 0 ? act : '',
          paid: paid > 0 ? paid : '',
          remarks: locExp?.paymentStatus === 'Advance' ? 'Advance Paid' : '',
          type: 'location'
       });
    }

    // 3. Decoration (Green)
    const decoExpenses = formData.expenses.filter(e => ['Decoration', 'Props', 'Furniture'].includes(e.category));
    decoExpenses.forEach(e => {
       rows.push({
          sr: sr++,
          head: 'Decoration',
          details: e.description,
          estAmount: e.estimatedAmount,
          actAmount: e.actualAmount,
          paid: e.paidAmount,
          remarks: e.paymentStatus === 'Advance' ? 'Advance' : '',
          type: 'deco'
       });
    });

    // 4. Food Aggregation (Yellow)
    const foodExpenses = formData.expenses.filter(e => getPrintHead(e.category) === 'Food');
    if (foodExpenses.length > 0) {
       const totalEst = foodExpenses.reduce((sum, e) => sum + e.estimatedAmount, 0);
       const totalAct = foodExpenses.reduce((sum, e) => sum + e.actualAmount, 0);
       const totalPaid = foodExpenses.reduce((sum, e) => sum + e.paidAmount, 0);
       
       const details = [...new Set(foodExpenses.map(e => e.category))].join('+');
       rows.push({
          sr: sr++,
          head: 'Food',
          details: details,
          estAmount: totalEst,
          actAmount: totalAct,
          paid: totalPaid,
          remarks: foodExpenses.some(e => e.paymentStatus === 'Advance') ? 'Advance Payment' : '',
          type: 'food'
       });
    }

    // 5. Transportation (Yellow)
    const transExpenses = formData.expenses.filter(e => getPrintHead(e.category) === 'Transportation');
    transExpenses.forEach(e => {
       rows.push({
          sr: sr++,
          head: 'Transportation',
          details: e.description,
          estAmount: e.estimatedAmount,
          actAmount: e.actualAmount,
          paid: e.paidAmount,
          remarks: e.paymentStatus === 'Advance' ? 'Advance Payment' : '',
          type: 'transport'
       });
    });
    
    // 6. Other Expenses (Yellow/Default)
    const otherExpenses = formData.expenses.filter(e => 
      !['Location', 'Decoration', 'Props', 'Furniture', ...['Lunch', 'Breakfast', 'Tea-Coffee', 'Snacks', 'Drinks', 'Groceries', 'Cutlery', 'Food', 'Travelling', 'Transportation']].includes(e.category)
    );
    otherExpenses.forEach(e => {
      rows.push({
        sr: sr++,
        head: e.category,
        details: e.description,
        estAmount: e.estimatedAmount,
        actAmount: e.actualAmount,
        paid: e.paidAmount,
        remarks: '',
        type: 'food'
      });
    });

    // 7. Crew (White)
    formData.floorManagerIds.forEach(fid => {
       const fm = floorManagers.find(f => f.id === fid);
       if (fm) {
          const rate = fm.staffType === 'Outsource' ? fm.rate : 0;
          rows.push({
             sr: sr++,
             head: fm.role, 
             details: fm.name,
             estAmount: rate > 0 ? rate : '',
             actAmount: rate > 0 ? rate : '',
             paid: rate > 0 ? rate : '',
             remarks: '',
             type: 'crew'
          });
          if ((fm.travelCharges || 0) > 0) {
             rows.push({
                sr: '',
                head: '',
                details: 'Crew Travel',
                estAmount: fm.travelCharges,
                actAmount: fm.travelCharges,
                paid: fm.travelCharges,
                remarks: 'Approx',
                type: 'crew'
             });
          }
       }
    });

    return rows;
  };

  const printRows = preparePrintRows();
  
  // Calculate Totals based on Type
  const calculateTotal = (key: 'estAmount' | 'actAmount' | 'paid') => {
    return printRows.reduce((sum, row) => sum + (typeof row[key] === 'number' ? row[key] : 0), 0);
  };

  const totalAmount = printType === 'APPROX' ? calculateTotal('estAmount') : calculateTotal('actAmount');
  const paidAmount = calculateTotal('paid');
  
  // --- TOTALS for Modal ---
  const operationalEst = formData ? formData.expenses.reduce((s, e) => s + e.estimatedAmount, 0) : 0;
  const operationalAct = formData ? formData.expenses.reduce((s, e) => s + e.actualAmount, 0) : 0;
  const totalEst = resourceCost + operationalEst;
  const totalAct = resourceCost + operationalAct;
  const totalPaid = formData ? formData.expenses.reduce((s, e) => s + e.paidAmount, 0) : 0;

  // Resolve Firm for Print Header - Dynamic from Context
  const printFirmId = formData?.page ? pageFirmMap[formData.page] : null;
  const printFirm = firms.find(f => f.id === printFirmId) || firms[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Schedule</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage upcoming shoots and financial planning</p>
          </div>
        </div>
        <Button onClick={openNewShoot}>
          <Plus size={18} /> Schedule Shoot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        {shoots.map(shoot => (
          <Card key={shoot.id} className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors" action={
            <Button variant="ghost" size="sm" onClick={() => openEditShoot(shoot)}>Details</Button>
          }>
            <div className="flex justify-between items-start mb-2">
              <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold rounded uppercase tracking-wide">{shoot.type}</span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${shoot.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'}`}>{shoot.status}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{shoot.title}</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-4">
               {shoot.page && <div className="flex items-center gap-2"><Layers size={14} /> {shoot.page}</div>}
               <div className="flex items-center gap-2"><Calendar size={14} /> {shoot.date}</div>
               <div className="flex items-center gap-2"><MapPin size={14} /> {shoot.locationName}</div>
               {currentUser?.role === 'ADMIN' && (
                 <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                    <Wallet size={14} className="text-gray-400" /> 
                    Est: ₹{(shoot.expenses.reduce((a,b)=>a+b.estimatedAmount,0) + 10000).toLocaleString()} 
                    <span className="text-xs text-gray-400 ml-1 font-normal">(Approx)</span>
                 </div>
               )}
            </div>
            <div className="flex -space-x-2 overflow-hidden">
               {shoot.modelIds.slice(0, 4).map(mid => {
                 const m = models.find(mo => mo.id === mid);
                 return m ? <div key={mid} className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300" title={m.name}>{m.name[0]}</div> : null;
               })}
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData?.id ? "Shoot Management" : "Schedule New Shoot"}>
        {formData && (
          <div className="flex flex-col h-[80vh]">
            
            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6 shrink-0 no-print">
              <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Shoot Details</button>
              {currentUser?.role === 'ADMIN' && (
                <button onClick={() => setActiveTab('budget')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'budget' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Budget & Expenses</button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-20 no-print px-1">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Basic Details Inputs */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-2">
                     <Select 
                        label="Brand Page / Profile" 
                        options={PROFILE_TYPES} 
                        value={formData.page || ''} 
                        onChange={e => setFormData({...formData, page: e.target.value})} 
                        className="font-bold text-indigo-700 dark:text-indigo-300"
                     />
                     <p className="text-xs text-gray-500 mt-1.5 ml-1">This filters available models to only show those linked to the selected page.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Shoot Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Summer Collection Promo" />
                    <Select label="Shoot Type" options={SHOOT_TYPES} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ShootType})} />
                    <Input label="Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                      <Select label="Location Type" options={['Indoor', 'Outdoor', 'Store']} value={formData.locationType} onChange={e => setFormData({...formData, locationType: e.target.value as any})} />
                      <Input label="Location Name" value={formData.locationName} onChange={e => setFormData({...formData, locationName: e.target.value})} placeholder="Studio A / City Park" />
                    </div>
                  </div>
                  
                  {/* Floor Categories */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block ml-1">Floor and Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {FLOOR_TYPES.map(floor => (
                        <button key={floor} onClick={() => toggleFloor(floor)} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${formData.floors.includes(floor) ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300 shadow-sm' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>{floor}</button>
                      ))}
                    </div>
                  </div>

                  {/* Models & Crew Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                         <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Users size={18} /> Select Models</h4>
                         <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 font-medium">{formData.page ? `Filtering: ${formData.page}` : 'Select Page first'}</span>
                      </div>
                      <div className="flex flex-col gap-3">
                         <div className="relative group">
                            <select 
                              className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-100 dark:focus:ring-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              onChange={(e) => {
                                if (e.target.value) toggleModel(e.target.value);
                                e.target.value = "";
                              }}
                              disabled={!formData.page}
                            >
                                <option value="">{formData.page ? '+ Add Model to Shoot...' : 'Select Brand Page above...'}</option>
                                {models
                                  .filter(m => (!formData.page || (Array.isArray(m.profileType) ? m.profileType.includes(formData.page) : m.profileType === formData.page))) // Filter by selected page
                                  .filter(m => !formData.modelIds.includes(m.id)) // Filter out already selected
                                  .map(model => (
                                  <option key={model.id} value={model.id}>
                                      {model.name} (₹{getModelRateForShoot(model, formData.type)})
                                  </option>
                                ))}
                            </select>
                         </div>

                         <div className="flex flex-wrap gap-2 mt-2">
                            {formData.modelIds.map(mid => {
                               const model = models.find(m => m.id === mid);
                               if (!model) return null;
                               return (
                                  <span key={mid} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border shadow-sm bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/40">
                                     <span className="font-medium">{model.name}</span>
                                     <button onClick={() => toggleModel(mid)} className="hover:text-indigo-900 dark:hover:text-indigo-100 ml-1 font-bold p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800/50">&times;</button>
                                  </span>
                               );
                            })}
                            {formData.modelIds.length === 0 && (
                               <span className="text-sm text-gray-400 italic p-1">No models selected</span>
                            )}
                         </div>
                      </div>
                    </div>
                    
                    <div className="border border-teal-200 dark:border-teal-800/30 rounded-xl p-5 bg-teal-50/30 dark:bg-teal-900/10">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Users size={18} className="text-teal-600 dark:text-teal-400"/> Assigned Crew</h4>
                      <div className="flex flex-col gap-3">
                        <select className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-teal-500 focus:ring-[3px] focus:ring-teal-100 dark:focus:ring-teal-900/30 transition-all" onChange={(e) => { if(e.target.value) toggleFloorManager(e.target.value); e.target.value = ""; }}>
                           <option value="">+ Assign Staff Member...</option>
                           {floorManagers.filter(fm => !formData.floorManagerIds?.includes(fm.id)).map(fm => (<option key={fm.id} value={fm.id}>{fm.name} ({fm.role})</option>))}
                        </select>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.floorManagerIds?.map(fid => {
                              const fm = floorManagers.find(f => f.id === fid);
                              return fm ? (<span key={fid} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all"><span className="font-medium">{fm.name}</span><button onClick={() => toggleFloorManager(fid)} className="hover:text-red-600 ml-1 font-bold p-0.5">&times;</button></span>) : null;
                            })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product & Shoot Details */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 ml-1">
                      <ShoppingBag size={16} /> Product & Shoot Brief
                    </label>
                    <textarea
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-100 dark:focus:ring-indigo-900/50 focus:outline-none min-h-[120px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm transition-all mx-[1px]"
                      value={formData.productDetails || ''}
                      onChange={e => setFormData({...formData, productDetails: e.target.value})}
                      placeholder="Enter product list, SKUs, styling notes, or specific shoot requirements..."
                    />
                  </div>
                </div>
              )}

              {/* BUDGET & EXPENSES TAB (ADMIN ONLY) */}
              {activeTab === 'budget' && currentUser?.role === 'ADMIN' && (
                <div className="space-y-6">
                  {/* Top Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Allocated Budget</p>
                        <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: Number(e.target.value)})} className="text-center font-bold text-xl bg-transparent w-full focus:outline-none text-gray-900 dark:text-white border-b border-dashed border-gray-300 dark:border-gray-600 focus:border-indigo-500 pb-1" />
                     </div>
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-center shadow-sm">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Est.</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">₹{totalEst.toLocaleString()}</p>
                     </div>
                     <div className={`p-4 rounded-xl border text-center shadow-sm ${totalAct > formData.budget && formData.budget > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1">Total Actual</p>
                        <p className="text-xl font-bold">₹{totalAct.toLocaleString()}</p>
                     </div>
                     <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800 text-center shadow-sm">
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Total Paid</p>
                        <p className="text-xl font-bold text-purple-700 dark:text-purple-300">₹{totalPaid.toLocaleString()}</p>
                     </div>
                  </div>

                  {/* Add New Expense Form (Approx Budget Planning) */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                     <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <Calculator size={18} /> Add Budget Item / Expense
                     </h3>
                     <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-1/4">
                           <Select label="Category" options={EXPENSE_CATEGORIES} value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} />
                        </div>
                        <div className="w-full md:w-1/3">
                           <Input label="Description" placeholder="e.g. Lunch 15 pax" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                        </div>
                        <div className="w-full md:w-1/4">
                           <Input label="Approx Cost (₹)" type="number" value={newExpense.estimatedAmount || ''} onChange={e => setNewExpense({...newExpense, estimatedAmount: Number(e.target.value)})} />
                        </div>
                        <Button onClick={addManualExpense} disabled={!newExpense.estimatedAmount} className="w-full md:w-auto h-[46px]">Add Item</Button>
                     </div>
                  </div>

                  {/* Unified Expense Grid */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                              <tr>
                                 <th className="px-5 py-4">Item</th>
                                 <th className="px-5 py-4 text-right">Approx (₹)</th>
                                 <th className="px-5 py-4 text-right">Actual (₹)</th>
                                 <th className="px-5 py-4">Payment Status</th>
                                 <th className="px-5 py-4 text-right">Paid (₹)</th>
                                 <th className="px-5 py-4 text-center">Docs</th>
                                 <th className="px-5 py-4 text-center">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {/* Fixed Resource Row */}
                              <tr className="bg-blue-50/30 dark:bg-blue-900/10">
                                 <td className="px-5 py-4">
                                    <div className="font-bold text-gray-800 dark:text-white">Fixed Resources</div>
                                    <div className="text-xs text-gray-500">Talent & Crew Charges</div>
                                 </td>
                                 <td className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-300">₹{resourceCost.toLocaleString()}</td>
                                 <td className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-300">₹{resourceCost.toLocaleString()}</td>
                                 <td className="px-5 py-4"><span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-medium">Managed in Invoice</span></td>
                                 <td className="px-5 py-4 text-right">-</td>
                                 <td className="px-5 py-4 text-center">-</td>
                                 <td className="px-5 py-4 text-center">-</td>
                              </tr>

                              {/* Dynamic Expenses */}
                              {formData.expenses.map((exp) => (
                                 <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                    <td className="px-5 py-3 max-w-[200px]">
                                       <div className="font-medium text-gray-900 dark:text-white truncate">{exp.description}</div>
                                       <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{exp.category}</div>
                                    </td>
                                    <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400 font-medium">
                                       ₹{exp.estimatedAmount.toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3">
                                       <input type="number" value={exp.actualAmount || ''} placeholder="0" className="w-24 px-2 py-1.5 text-right border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" onChange={(e) => updateExpense(exp.id, 'actualAmount', Number(e.target.value))} />
                                    </td>
                                    <td className="px-5 py-3">
                                       <select value={exp.paymentStatus} onChange={(e) => updateExpense(exp.id, 'paymentStatus', e.target.value as any)} className={`text-xs px-2.5 py-1.5 rounded-lg border-none font-bold focus:ring-0 cursor-pointer ${exp.paymentStatus === 'Full' ? 'bg-green-100 text-green-700' : exp.paymentStatus === 'Advance' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                                          <option value="Pending">Pending</option>
                                          <option value="Advance">Advance</option>
                                          <option value="Part">Part Payment</option>
                                          <option value="Full">Full Payment</option>
                                       </select>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                       <input type="number" value={exp.paidAmount || ''} placeholder="0" className="w-24 px-2 py-1.5 text-right border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" onChange={(e) => updateExpense(exp.id, 'paidAmount', Number(e.target.value))} />
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                       <div className="flex justify-center items-center gap-1">
                                          <label className="cursor-pointer text-gray-400 hover:text-indigo-600 transition-colors p-1.5 hover:bg-indigo-50 rounded-full">
                                             <Paperclip size={18} />
                                             <input type="file" className="hidden" onChange={(e) => handleFileUpload(exp.id, e)} accept="image/*,application/pdf" />
                                          </label>
                                          {exp.attachments.length > 0 && (
                                             <button onClick={() => setPreviewDoc(exp.attachments[0])} className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-full">
                                                <Eye size={18} />
                                             </button>
                                          )}
                                       </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                       <button onClick={() => removeExpense(exp.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-full transition-colors">
                                          <Trash2 size={18} />
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                              
                              {formData.expenses.length === 0 && (
                                 <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm italic">No budget items added yet.</td></tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                     <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={runAiAnalysis} disabled={isAnalyzing}>
                           <Sparkles size={16} /> {isAnalyzing ? 'Analyzing...' : 'Analyze Risks'}
                        </Button>
                        <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                        <Button variant="secondary" size="sm" onClick={() => handlePrintReport('APPROX')}>
                           <Printer size={16} /> Print Est. Budget
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handlePrintReport('FINAL')} className="text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20">
                           <FileCheck size={16} /> Print Final Report
                        </Button>
                     </div>
                     {aiAnalysis && (
                        <div className="text-sm font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800">
                           AI Risk Assessment: <strong>{aiAnalysis.riskLevel}</strong>
                        </div>
                     )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-5 pb-5 px-6 border-t border-gray-100 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800 z-10 no-print gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Shoot Plan</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
            <div className="bg-white rounded-lg overflow-hidden max-w-4xl max-h-[90vh] w-full relative">
               <iframe src={previewDoc} className="w-full h-[80vh]" />
               <button className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow" onClick={() => setPreviewDoc(null)}>Close</button>
            </div>
         </div>
      )}

      {/* EXCEL-LIKE PRINT FORMAT */}
      {printMode && formData && (
         <div className="fixed inset-0 bg-white z-[100] p-8 overflow-auto text-black flex items-center justify-center">
            <div className="w-[210mm] border border-black shadow-none text-sm font-sans">
               {/* Title Header */}
               <div className="text-center font-bold text-xl border-b border-black py-2 uppercase">
                  {printFirm.name} ({printFirm.storeName}) <br/>
                  {formData.type} {printType === 'APPROX' ? 'Approx Budget' : 'Final Expense Report'} <br/>
                  <span className="text-sm font-normal normal-case">{formData.date}</span>
               </div>
               
               {/* Product Brief Section for Print */}
               {formData.productDetails && (
                  <div className="border-b border-black p-2 bg-gray-50">
                     <div className="font-bold underline mb-1">Shoot & Product Brief:</div>
                     <div className="whitespace-pre-wrap text-xs">{formData.productDetails}</div>
                  </div>
               )}

               {/* Table */}
               <div className="grid grid-cols-12 border-b border-black font-bold text-center bg-gray-200">
                  <div className="col-span-1 border-r border-black py-1">Sr No</div>
                  <div className="col-span-4 border-r border-black py-1">Head</div>
                  <div className="col-span-4 border-r border-black py-1">Details</div>
                  <div className="col-span-2 border-r border-black py-1">Amount</div>
                  <div className="col-span-1 py-1">Remarks</div>
               </div>

               {printRows.map((row, index) => (
                  <div key={index} className={`grid grid-cols-12 border-b border-black ${getRowColorClass(row.type)}`}>
                     <div className="col-span-1 border-r border-black py-1 px-2 text-center">{row.sr}</div>
                     <div className="col-span-4 border-r border-black py-1 px-2 font-medium">{row.head}</div>
                     <div className="col-span-4 border-r border-black py-1 px-2">{row.details}</div>
                     <div className="col-span-2 border-r border-black py-1 px-2 text-right">
                        {printType === 'APPROX' 
                           ? (row.estAmount ? row.estAmount.toLocaleString() : '') 
                           : (row.actAmount ? row.actAmount.toLocaleString() : '')}
                     </div>
                     <div className="col-span-1 py-1 px-2 text-xs text-center">{row.remarks}</div>
                  </div>
               ))}

               {/* Filling Empty Rows to look like Excel */}
               {[...Array(Math.max(0, 15 - printRows.length))].map((_, i) => (
                  <div key={`empty-${i}`} className="grid grid-cols-12 border-b border-black min-h-[24px]">
                     <div className="col-span-1 border-r border-black"></div>
                     <div className="col-span-4 border-r border-black"></div>
                     <div className="col-span-4 border-r border-black"></div>
                     <div className="col-span-2 border-r border-black"></div>
                     <div className="col-span-1"></div>
                  </div>
               ))}

               {/* Total */}
               <div className="grid grid-cols-12 font-bold text-lg bg-white">
                  <div className="col-span-9 border-r border-black py-2 px-4 text-right">
                     {printType === 'APPROX' ? 'Approx Total' : 'Final Total'}
                  </div>
                  <div className="col-span-2 border-r border-black py-2 px-2 text-right">{totalAmount.toLocaleString()}</div>
                  <div className="col-span-1"></div>
               </div>

               {printType === 'FINAL' && (
                 <div className="grid grid-cols-12 font-bold text-sm bg-gray-50 border-t border-black mt-2">
                     <div className="col-span-9 py-1 px-4 text-right">Total Paid:</div>
                     <div className="col-span-2 py-1 px-2 text-right">{paidAmount.toLocaleString()}</div>
                     <div className="col-span-1"></div>
                 </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};