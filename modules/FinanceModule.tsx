
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Model, FloorManager, Shoot, ShootType, Invoice } from '../types';
import { Card, Button, Select, Modal, Input } from '../components/UI';
import { 
  FileText, Printer, Calculator, BarChart3, TrendingUp, DollarSign, X, Eye, 
  Landmark, User, Building2, Search, Filter, CheckCircle2, Percent, Plus, 
  Trash2, Save, Loader2, History, ArrowRight, Plane, Briefcase, Download 
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExtraItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
}

export const FinanceModule: React.FC = () => {
  const { shoots, firms, models, floorManagers, currentUser, pageFirmMap, invoices, addInvoice } = useApp();
  const [activeTab, setActiveTab] = useState<'generator' | 'registry'>('generator');
  const [selectedShootId, setSelectedShootId] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [invoiceType, setInvoiceType] = useState<'INVOICE' | 'PO'>('PO'); 
  const [billingCategory, setBillingCategory] = useState<'Service' | 'Travel'>('Service');
  const [tdsRate, setTdsRate] = useState<number>(10); 
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingHistoricalInvoice, setViewingHistoricalInvoice] = useState<Invoice | null>(null);
  
  const [historySearch, setHistorySearch] = useState('');

  // Extra editable rows state
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([
    { id: uuidv4(), description: '', qty: 1, rate: 0 }
  ]);

  const isAdmin = currentUser?.role === 'ADMIN';

  const selectedShoot = useMemo(() => shoots.find(s => s.id === selectedShootId), [shoots, selectedShootId]);
  
  const beneficiaries = useMemo(() => {
    if (!selectedShoot) return [];
    const shootModels = models.filter(m => selectedShoot.modelIds?.includes(m.id)).map(m => ({ label: `Model: ${m.name}${m.billingName ? ` (C/O ${m.billingName})` : ''}`, value: m.id }));
    const shootCrew = floorManagers.filter(fm => selectedShoot.floorManagerIds?.includes(fm.id)).map(fm => ({ label: `Crew: ${fm.name}`, value: fm.id }));
    return [...shootModels, ...shootCrew];
  }, [selectedShoot, models, floorManagers]);

  const activeFirm = useMemo(() => {
     if (!selectedShoot?.page) return firms[0]; 
     const firmId = pageFirmMap[selectedShoot.page];
     return firms.find(f => f.id === firmId) || firms[0];
  }, [selectedShoot, firms, pageFirmMap]);

  const handleExtraItemChange = (id: string, field: keyof ExtraItem, value: string | number) => {
    setExtraItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: field === 'description' ? value : Number(value) } : item
    ));
  };

  const addExtraRow = () => {
    setExtraItems(prev => [...prev, { id: uuidv4(), description: '', qty: 1, rate: 0 }]);
  };

  const removeExtraRow = (id: string) => {
    setExtraItems(prev => prev.filter(item => item.id !== id));
  };

  const draftData = useMemo(() => {
     if (viewingHistoricalInvoice) {
        const firm = firms.find(f => f.id === viewingHistoricalInvoice.firmId) || firms[0];
        const shoot = shoots.find(s => s.id === viewingHistoricalInvoice.shootId);
        const recipient = models.find(m => m.id === viewingHistoricalInvoice.recipientId) || 
                          floorManagers.find(fm => fm.id === viewingHistoricalInvoice.recipientId);
        
        if (!shoot) return null;

        const firstItem = viewingHistoricalInvoice.items[0];
        const extras = viewingHistoricalInvoice.items.slice(1).map(i => ({
            id: uuidv4(),
            description: i.description,
            qty: i.quantity,
            rate: i.rate
        }));

        const subtotal = viewingHistoricalInvoice.items.reduce((acc, i) => acc + i.amount, 0);
        const finalTotal = viewingHistoricalInvoice.total;
        const tdsAmount = subtotal - finalTotal;

        return {
            firm,
            recipient: recipient || { name: viewingHistoricalInvoice.recipientName || 'Unknown' } as any,
            baseAmount: firstItem?.rate || 0,
            baseDescription: firstItem?.description || '',
            extraItems: extras,
            subtotal,
            tdsRate: viewingHistoricalInvoice.billingCategory === 'Travel' ? 0 : (subtotal > 0 ? (tdsAmount / subtotal) * 100 : 0),
            tdsAmount,
            total: finalTotal,
            shoot,
            date: viewingHistoricalInvoice.date,
            docNumber: viewingHistoricalInvoice.number,
            isHistorical: true,
            billingCategory: viewingHistoricalInvoice.billingCategory || 'Service'
        };
     }

     if (!selectedShoot || !selectedRecipientId || !activeFirm) return null;
     const recipient = models.find(m => m.id === selectedRecipientId) || floorManagers.find(fm => fm.id === selectedRecipientId);
     
     let baseAmount = 0;
     let baseDescription = '';

     if (billingCategory === 'Service') {
        const expense = selectedShoot.expenses?.find(e => e.linkedId === selectedRecipientId && e.category !== 'Travelling');
        baseAmount = expense?.estimatedAmount || 0;
        baseDescription = `${selectedShoot.type}`;

        if (baseAmount === 0 && recipient && 'charges' in recipient) {
           const type = selectedShoot.type;
           const model = recipient as Model;
           if (type === ShootType.LIVE) baseAmount = model.charges.live;
           else if (type === ShootType.STUDIO_REELS) baseAmount = model.charges.indoorReels;
           else if (type === ShootType.OUTDOOR_REELS) baseAmount = model.charges.outdoorReels;
           else if (type === ShootType.STORE_REELS) baseAmount = model.charges.storeReels;
           else if (type === ShootType.ADVT) baseAmount = model.charges.advt;
           else if (type === ShootType.YOUTUBE_VIDEO) baseAmount = model.charges.youtubeVideo;
           else if (type === ShootType.YOUTUBE_SHORTS) baseAmount = model.charges.youtubeShorts;
           else if (type === ShootType.YOUTUBE_INFLUENCER) baseAmount = model.charges.youtubeInfluencer;
           if (baseAmount === 0) baseAmount = model.charges.custom || 0;
        }
     } else {
        const travelExpense = selectedShoot.expenses?.find(e => e.linkedId === `${selectedRecipientId}_travel` || (e.linkedId === selectedRecipientId && e.category === 'Travelling'));
        baseAmount = (travelExpense?.actualAmount && travelExpense.actualAmount > 0) ? travelExpense.actualAmount : (travelExpense?.estimatedAmount || 0);
        baseDescription = "Travel Allowance & Conveyance Reimbursement";
     }

     const validExtraItems = extraItems.filter(item => item.description.trim() !== '');
     const extraTotal = validExtraItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
     
     const subtotal = baseAmount + extraTotal;
     const effectiveTdsRate = billingCategory === 'Travel' ? 0 : tdsRate;
     const tdsAmount = (subtotal * effectiveTdsRate) / 100;
     const finalTotal = subtotal - tdsAmount;

     const firmInvoices = invoices.filter(i => i.firmId === activeFirm.id);
     const nextSeq = firmInvoices.length + 1;
     const mm = String(new Date().getMonth() + 1).padStart(2, '0');
     const nnnn = String(nextSeq).padStart(4, '0');
     const typePrefix = invoiceType === 'INVOICE' ? 'INV' : 'PO';
     const catSuffix = billingCategory === 'Travel' ? 'TRV' : 'SRV';
     
     const docNumber = `${typePrefix}-${mm}/${nnnn}/${catSuffix}`;
     const issueDateFormatted = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

     return {
        firm: activeFirm,
        recipient,
        baseAmount,
        baseDescription,
        extraItems: validExtraItems,
        subtotal: subtotal,
        tdsRate: effectiveTdsRate,
        tdsAmount: tdsAmount,
        total: finalTotal,
        shoot: selectedShoot,
        date: issueDateFormatted,
        docNumber: docNumber,
        isHistorical: false,
        billingCategory
     };
  }, [selectedShoot, selectedRecipientId, activeFirm, invoiceType, billingCategory, tdsRate, models, floorManagers, extraItems, invoices, viewingHistoricalInvoice, firms, shoots]);

  const handleRecordInvoice = async () => {
    if (!draftData || draftData.isHistorical) return;
    setIsSaving(true);
    try {
      const invoiceToSave: Invoice = {
        id: uuidv4(),
        number: draftData.docNumber,
        date: new Date().toISOString().split('T')[0],
        shootId: draftData.shoot.id,
        firmId: draftData.firm.id,
        recipientId: draftData.recipient?.id,
        recipientName: draftData.recipient?.name,
        billingCategory: draftData.billingCategory,
        items: [
          { description: draftData.baseDescription, quantity: 1, rate: draftData.baseAmount, amount: draftData.baseAmount },
          ...draftData.extraItems.map(item => ({
            description: item.description,
            quantity: item.qty,
            rate: item.rate,
            amount: item.qty * item.rate
          }))
        ],
        total: draftData.total,
        type: invoiceType
      };
      await addInvoice(invoiceToSave);
      alert(`${invoiceType} successfully recorded in ledger as ${draftData.docNumber}`);
      setIsPreviewOpen(false);
    } catch (error) {
      console.error("Failed to save document", error);
      alert("Error recording document. Please check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  const filteredHistory = useMemo(() => {
    return invoices.filter(i => {
      const search = historySearch.toLowerCase();
      return i.number.toLowerCase().includes(search) || 
             (i.recipientName && i.recipientName.toLowerCase().includes(search));
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, historySearch]);

  const openHistorical = (inv: Invoice) => {
    setViewingHistoricalInvoice(inv);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-10 animate-pageInUp">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <h1 className="text-3xl font-black text-lightText dark:text-white font-display tracking-tight leading-none">Billing & Commercials</h1>
          <p className="text-lightTextSecondary dark:text-gray-400 text-sm font-medium mt-1.5 tracking-wide">Document generation and automatic rate calculation</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white dark:bg-navy-800 p-1 rounded-xl border border-lightBorder dark:border-navy-700 shadow-sm shrink-0">
            <button onClick={() => setActiveTab('generator')} className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'generator' ? 'bg-lightPrimary text-white shadow-md' : 'text-lightTextSecondary'}`}>Generator</button>
            <button onClick={() => setActiveTab('registry')} className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'registry' ? 'bg-lightPrimary text-white shadow-md' : 'text-lightTextSecondary'}`}>
              <History size={14} /> History
            </button>
          </div>
          {activeTab === 'generator' && (
            <Button variant="secondary" onClick={() => setActiveTab('registry')} className="h-[50px] shadow-sm font-black uppercase tracking-widest text-[10px]">
              <History size={16} /> View Audit History
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'generator' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 no-print">
          <div className="xl:col-span-1 space-y-6">
            <Card title="Direct Draft Portal" action={<Calculator size={16} className="text-lightPrimary" />} noHeaderBorder className="border-none shadow-soft">
              <div className="space-y-6 mt-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest ml-1">Document Format</label>
                  <div className="flex bg-lightBgSecondary dark:bg-navy-900 p-1 rounded-xl border border-lightBorder dark:border-navy-700 shadow-sm">
                    <button onClick={() => setInvoiceType('PO')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${invoiceType === 'PO' ? 'bg-white dark:bg-navy-700 text-lightPrimary shadow-md' : 'text-lightTextSecondary'}`}>Purchase Order</button>
                    <button onClick={() => setInvoiceType('INVOICE')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${invoiceType === 'INVOICE' ? 'bg-white dark:bg-navy-700 text-lightPrimary shadow-md' : 'text-lightTextSecondary'}`}>Final Invoice</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest ml-1">Billing Category</label>
                  <div className="flex bg-lightBgSecondary dark:bg-navy-900 p-1 rounded-xl border border-lightBorder dark:border-navy-700 shadow-sm">
                    <button onClick={() => setBillingCategory('Service')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${billingCategory === 'Service' ? 'bg-white dark:bg-navy-700 text-indigo-600 shadow-md' : 'text-lightTextSecondary'}`}>
                      <Briefcase size={12} /> Professional Fee
                    </button>
                    <button onClick={() => setBillingCategory('Travel')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${billingCategory === 'Travel' ? 'bg-white dark:bg-navy-700 text-teal-600 shadow-md' : 'text-lightTextSecondary'}`}>
                      <Plane size={12} /> Travel Allowance
                    </button>
                  </div>
                </div>
                
                <Select label="Production Link" placeholder="Select active shoot..." value={selectedShootId} onChange={e => { setSelectedShootId(e.target.value); setSelectedRecipientId(''); }} options={shoots.map(s => ({ label: `${s.title} (${s.date})`, value: s.id }))} />
                
                <Select label="Beneficiary" placeholder="Choose talent or crew..." disabled={!selectedShootId} value={selectedRecipientId} onChange={e => setSelectedRecipientId(e.target.value)} options={beneficiaries} />
                
                <div className="relative">
                  <Input 
                    label="TDS Rate (%)" 
                    type="number" 
                    value={billingCategory === 'Travel' ? 0 : tdsRate} 
                    onChange={e => setTdsRate(Number(e.target.value))} 
                    disabled={billingCategory === 'Travel'}
                    icon={Percent}
                  />
                  {billingCategory === 'Travel' && (
                    <span className="absolute right-0 -top-1 text-[8px] font-black text-teal-600 uppercase tracking-widest">Nontaxable Reimbursement</span>
                  )}
                </div>

                <div className="pt-4 border-t border-lightBorder dark:border-navy-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest">Additional Items</h4>
                    <button onClick={addExtraRow} className="text-lightPrimary hover:text-lightPrimaryHover transition-colors">
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {extraItems.map((item, index) => (
                      <div key={item.id} className="group relative flex gap-2 items-end">
                        <div className="flex-1">
                          <Input 
                            placeholder={`Item ${index + 1} desc...`} 
                            value={item.description} 
                            onChange={e => handleExtraItemChange(item.id, 'description', e.target.value)} 
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="w-16">
                           <Input 
                            type="number"
                            placeholder="Rate"
                            value={item.rate || ''} 
                            onChange={e => handleExtraItemChange(item.id, 'rate', e.target.value)} 
                            className="h-9 text-xs"
                          />
                        </div>
                        <button 
                          onClick={() => removeExtraRow(item.id)}
                          className="mb-2 p-1 text-lightTextSecondary hover:text-lightDanger opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button disabled={!draftData} onClick={() => { setViewingHistoricalInvoice(null); setIsPreviewOpen(true); }} className="w-full h-14 bg-lightPrimary shadow-xl shadow-lightPrimary/20 font-black uppercase tracking-widest text-[11px]"><Eye size={18} /> Review Draft Record</Button>
              </div>
            </Card>
          </div>

          <div className="xl:col-span-2 space-y-6">
             <Card title="Financial Overview" noHeaderBorder className="border-none shadow-soft">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-lightBgSecondary dark:bg-navy-900/50 rounded-2xl">
                    <p className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Total Final Billing</p>
                    <h4 className="text-2xl font-black text-lightText dark:text-white">₹{invoices.filter(i => i.type === 'INVOICE').reduce((sum, i) => sum + i.total, 0).toLocaleString()}</h4>
                  </div>
                  <div className="p-6 bg-lightBgSecondary dark:bg-navy-900/50 rounded-2xl">
                    <p className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest mb-1">Total Professional POs</p>
                    <h4 className="text-2xl font-black text-lightText dark:text-white">{invoices.filter(i => i.type === 'PO').length} Active Docs</h4>
                  </div>
                </div>
             </Card>
             <Card title="Audit Registry" noHeaderBorder className="border-none shadow-soft" action={<button onClick={() => setActiveTab('registry')} className="text-[10px] font-black text-lightPrimary uppercase tracking-widest">View Full History</button>}>
                <div className="space-y-3">
                   {invoices.slice(0, 5).map(inv => (
                     <div key={inv.id} className="flex items-center justify-between p-4 bg-lightBg/50 dark:bg-navy-900/30 rounded-xl border border-lightBorder/50 dark:border-navy-700/50">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-[10px] ${inv.type === 'INVOICE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {inv.type === 'INVOICE' ? 'INV' : 'PO'}
                           </div>
                           <div>
                              <p className="text-xs font-black text-lightText dark:text-white">{inv.number}</p>
                              <p className="text-[9px] font-bold text-lightTextSecondary uppercase tracking-widest flex items-center gap-2">
                                {inv.recipientName}
                                {inv.billingCategory === 'Travel' && <span className="text-[7px] text-teal-600 bg-teal-50 px-1 rounded-sm">TRAVEL</span>}
                              </p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-lightText dark:text-white">₹{inv.total.toLocaleString()}</p>
                           <p className="text-[9px] font-bold text-lightTextSecondary">{inv.date}</p>
                        </div>
                     </div>
                   ))}
                   {invoices.length === 0 ? (
                     <div className="py-12 text-center opacity-40 flex flex-col items-center gap-3">
                        <History size={48} className="text-lightTextSecondary" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No commercial records yet</p>
                     </div>
                   ) : (
                     <div className="pt-4 mt-2 border-t border-lightBorder dark:border-navy-700/30">
                        <button 
                           onClick={() => setActiveTab('registry')}
                           className="w-full py-3 rounded-xl bg-lightBgSecondary dark:bg-navy-900/50 text-[10px] font-black uppercase tracking-widest text-lightPrimary flex items-center justify-center gap-2 hover:bg-lightPrimary/5 transition-all"
                        >
                           Explore Full Document Registry <ArrowRight size={14} />
                        </button>
                     </div>
                   )}
                </div>
             </Card>
          </div>
        </div>
      ) : (
        <Card noPadding className="border-none shadow-soft animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-6 border-b border-lightBorder dark:border-navy-700/50 flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="relative flex-1 w-full max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-lightTextSecondary" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by number or recipient..." 
                  className="w-full h-12 pl-12 pr-4 bg-lightBgSecondary dark:bg-navy-900/50 rounded-xl border border-transparent focus:border-lightPrimary/30 outline-none text-sm font-bold dark:text-white"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setActiveTab('generator')} className="text-[10px] font-black uppercase tracking-widest h-12">
                   Back to Generator
                </Button>
             </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-lightBgSecondary dark:bg-navy-900/50 text-[10px] font-black uppercase tracking-widest text-lightTextSecondary">
                   <tr>
                      <th className="px-6 py-5">Doc No.</th>
                      <th className="px-6 py-5">Date</th>
                      <th className="px-6 py-5">Beneficiary</th>
                      <th className="px-6 py-5">Category</th>
                      <th className="px-6 py-5">Type</th>
                      <th className="px-6 py-5 text-right">Amount</th>
                      <th className="px-6 py-5 w-20">Details</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-lightBorder dark:divide-navy-700/50">
                   {filteredHistory.map(inv => (
                     <tr key={inv.id} className="hover:bg-lightBgSecondary/20 dark:hover:bg-navy-800/40 transition-colors group">
                        <td className="px-6 py-4 font-black text-xs text-lightText dark:text-white">{inv.number}</td>
                        <td className="px-6 py-4 text-xs font-bold text-lightTextSecondary">{inv.date}</td>
                        <td className="px-6 py-4 text-xs font-black text-lightText dark:text-white">{inv.recipientName}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${inv.billingCategory === 'Travel' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                              {inv.billingCategory || 'Service'}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${inv.type === 'INVOICE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                              {inv.type}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-xs text-lightText dark:text-white">₹{inv.total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                           <button 
                             onClick={() => openHistorical(inv)}
                             className="p-2 text-lightTextSecondary hover:text-lightPrimary transition-colors"
                             title="View Document Details"
                           >
                             <Eye size={18} />
                           </button>
                        </td>
                     </tr>
                   ))}
                   {filteredHistory.length === 0 && (
                     <tr>
                        <td colSpan={7} className="py-20 text-center opacity-30 text-xs font-black uppercase tracking-[0.2em]">No commercial records found</td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>
        </Card>
      )}

      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={`Audit Record: ${draftData?.docNumber || invoiceType}`}>
        {draftData && (
          <div className="p-0 flex flex-col min-h-[700px] bg-white text-black font-sans selection:bg-gray-200">
             <div className="no-print p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center gap-3 shrink-0">
                <div className="flex gap-2">
                   <Button size="sm" onClick={handleDownload} variant="secondary" className="h-10 text-[10px] uppercase tracking-widest">
                      <Download size={14} /> Download PDF
                   </Button>
                   <Button size="sm" onClick={handlePrint} variant="secondary" className="h-10 text-[10px] uppercase tracking-widest">
                      <Printer size={14} /> Print
                   </Button>
                </div>
                <div className="flex gap-2">
                   {!draftData.isHistorical && (
                     <Button size="sm" onClick={handleRecordInvoice} disabled={isSaving} className="h-10 text-[10px] uppercase tracking-widest">
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                        Save to Ledger
                     </Button>
                   )}
                   <Button variant="ghost" size="sm" onClick={() => setIsPreviewOpen(false)} className="h-10 text-[10px] uppercase tracking-widest">
                      <X size={14} /> Close
                   </Button>
                </div>
             </div>

             <div className="flex-1 p-16 max-w-4xl mx-auto w-full print:p-0 print:m-0 overflow-y-auto">
                <div className="flex justify-between items-start border-b-2 border-black pb-12">
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        {draftData.firm.logoUrl && <img src={draftData.firm.logoUrl} className="h-16 w-auto object-contain" />}
                        <div className="flex flex-col">
                           <h2 className="text-3xl font-black uppercase tracking-tight leading-none text-black">{draftData.firm.name}</h2>
                           <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Brand: {draftData.firm.storeName}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[11px] leading-relaxed font-bold text-black whitespace-pre-wrap max-w-[400px] opacity-100">{draftData.firm.address}</p>
                        <p className="text-[11px] font-black uppercase tracking-widest text-black mt-3 opacity-100">GSTIN: {draftData.firm.gstin || 'NOT PROVIDED'}</p>
                        <p className="text-[11px] font-black uppercase tracking-widest text-black opacity-100">Phone: {draftData.firm.phone}</p>
                      </div>
                   </div>
                   <div className="text-right flex flex-col items-end">
                      <div className="border-2 border-black px-6 py-3 text-sm font-black uppercase tracking-[0.2em] mb-8 text-black">
                        {draftData.billingCategory === 'Travel' ? 'Reimbursement Claim' : (viewingHistoricalInvoice?.type || invoiceType === 'PO' ? 'Purchase Order' : 'Commercial Invoice')}
                      </div>
                      <div className="space-y-5">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Issue Date</p>
                          <p className="text-base font-black text-black">{draftData.date}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Document No.</p>
                          <p className="text-base font-black text-black font-sans">{draftData.docNumber}</p>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-16 py-14">
                   <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-200 pb-2">Beneficiary Details</p>
                      <div className="space-y-1">
                         { (draftData.recipient as Model).billingName ? (
                           <>
                              <h3 className="text-2xl font-black uppercase tracking-tight text-black">{(draftData.recipient as Model).billingName}</h3>
                              <p className="text-base font-bold text-gray-500 uppercase tracking-tight">C/O {draftData.recipient?.name}</p>
                           </>
                         ) : (
                           <h3 className="text-2xl font-black uppercase tracking-tight text-black">{draftData.recipient?.name}</h3>
                         )}
                         <p className="text-[11px] font-bold text-black pt-3 leading-relaxed opacity-100">{(draftData.recipient as Model).address || (draftData.recipient as FloorManager).address || 'Physical address not available'}</p>
                         <p className="text-[11px] font-black uppercase tracking-widest text-black pt-2 opacity-100">PAN/TAX ID: {(draftData.recipient as Model).pan || (draftData.recipient as FloorManager).pan || (draftData.recipient as Model).gstin || 'N/A'}</p>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-200 pb-2">Project Assignment</p>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Campaign</p>
                          <p className="text-[11px] font-black text-black">{draftData.shoot.title}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Format</p>
                          <p className="text-[11px] font-black text-black">{draftData.shoot.type}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Venue</p>
                          <p className="text-[11px] font-black text-black">{draftData.shoot.locationName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Type</p>
                          <p className="text-[11px] font-black text-black">{draftData.shoot.locationType}</p>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="mt-4 border-2 border-black rounded-lg overflow-hidden">
                   <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-black">
                         <tr className="text-[10px] font-black uppercase tracking-widest text-black">
                            <th className="p-5 text-left border-r border-black">
                              {draftData.billingCategory === 'Travel' ? 'Description of Expense Reimbursement' : 'Description of Professional Services'}
                            </th>
                            <th className="p-5 text-center border-r border-black w-24">Qty</th>
                            <th className="p-5 text-right border-r border-black w-32">Rate (₹)</th>
                            <th className="p-5 text-right w-32">Total (₹)</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                         <tr>
                            <td className="p-8">
                               <p className="font-black text-lg uppercase tracking-tight text-black">{draftData.baseDescription}</p>
                               <p className="text-[11px] font-bold text-black mt-2 leading-relaxed opacity-100">
                                  {draftData.shoot.date.split('-').reverse().join('-')} • {draftData.shoot.locationName}
                                  <br/>
                                  {draftData.shoot.title}
                                  {draftData.billingCategory === 'Travel' && <span className="block mt-2 italic text-gray-500">Note: This claim is based on verified actual expenses.</span>}
                               </p>
                            </td>
                            <td className="p-8 text-center font-black text-sm text-black">1.00</td>
                            <td className="p-8 text-right font-black text-sm text-black">₹{draftData.baseAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-8 text-right font-black text-sm text-black">₹{draftData.baseAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                         </tr>
                         
                         {draftData.extraItems.map((item) => (
                           <tr key={item.id}>
                              <td className="p-5 px-8">
                                 <p className="font-black text-base uppercase tracking-tight text-black">{item.description}</p>
                              </td>
                              <td className="p-5 text-center font-bold text-sm text-black">{item.qty.toFixed(2)}</td>
                              <td className="p-5 text-right font-bold text-sm text-black">₹{item.rate.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                              <td className="p-5 text-right font-black text-sm text-black">₹{(item.qty * item.rate).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                           </tr>
                         ))}

                         <tr className="bg-gray-50/50">
                            <td colSpan={3} className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Subtotal</td>
                            <td className="p-4 text-right font-black text-sm text-black">₹{draftData.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                         </tr>
                         
                         {draftData.tdsAmount !== 0 && (
                            <tr className="bg-gray-50">
                               <td colSpan={3} className="p-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">
                                  Less: Taxes / Deductions ({draftData.tdsRate.toFixed(1)}%)
                               </td>
                               <td className="p-5 text-right font-black text-sm text-red-600">
                                  - ₹{Math.abs(draftData.tdsAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                               </td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>

                <div className="flex justify-between items-start mt-16">
                   <div className="w-1/2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 border-b border-gray-100 pb-2">Remittance Particulars</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold">
                           <span className="text-gray-400 uppercase tracking-widest">Bank</span>
                           <span className="text-black uppercase">{(draftData.recipient as Model).bankDetails?.bankName || (draftData.recipient as FloorManager).bankDetails?.bankName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold">
                           <span className="text-gray-400 uppercase tracking-widest">A/C No.</span>
                           <span className="text-black font-black tracking-widest">{(draftData.recipient as Model).bankDetails?.accountNumber || (draftData.recipient as FloorManager).bankDetails?.accountNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold">
                           <span className="text-gray-400 uppercase tracking-widest">IFSC</span>
                           <span className="text-black uppercase">{(draftData.recipient as Model).bankDetails?.ifscCode || (draftData.recipient as FloorManager).bankDetails?.ifscCode || 'N/A'}</span>
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-gray-300 mt-24 text-center uppercase tracking-widest">This is a system-generated commercial document. No physical signature is required.</p>
                   </div>
                   
                   <div className="w-1/3 space-y-12">
                      <div className="border-t-4 border-black pt-6 flex flex-col items-end">
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 text-gray-400">Net Payable Total</span>
                         <span className="text-4xl font-black text-black">₹{draftData.total.toLocaleString()}</span>
                         <span className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{draftData.billingCategory === 'Travel' ? 'Reimbursement' : 'Post-Deduction'}</span>
                      </div>
                      
                      <div className="pt-12 text-center flex flex-col items-center">
                         <div className="h-20 w-48 border-b border-dashed border-gray-300 mb-3"></div>
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black leading-none">Authorized Signatory</p>
                         <p className="text-[9px] font-bold text-gray-400 uppercase mt-2">For {draftData.firm.name}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
