import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice, Shoot, FloorManager, Model, InvoiceItem, ShootType } from '../types';
import { Card, Button, Input } from '../components/UI';
import { FileText, Printer, Download, DollarSign, User, Plane, FileCheck, Eye, ScrollText, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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

export const FinanceModule: React.FC = () => {
  const { invoices, addInvoice, shoots, firms, models, floorManagers, pageFirmMap } = useApp();
  
  // Generation State
  const [selectedShootId, setSelectedShootId] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [invoiceType, setInvoiceType] = useState<'INVOICE' | 'PO'>('PO'); 
  const [billingCategory, setBillingCategory] = useState<'Service' | 'Travel'>('Service');
  const [tdsRate, setTdsRate] = useState(10);
  
  // History State
  const [searchTerm, setSearchTerm] = useState('');

  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Determine Billing Firm based on Shoot Page using dynamic mapping (For Form)
  const billingFirm = useMemo(() => {
     if (!selectedShootId) return null;
     const shoot = shoots.find(s => s.id === selectedShootId);
     if (!shoot || !shoot.page) return null;
     
     const firmId = pageFirmMap[shoot.page];
     return firms.find(f => f.id === firmId) || firms[0]; // Fallback to first if not mapped
  }, [selectedShootId, shoots, firms, pageFirmMap]);

  // Determine Firm for the PREVIEW document (Handles both new generation and history view)
  const previewFirm = useMemo(() => {
     if (!generatedInvoice) return null;
     return firms.find(f => f.id === generatedInvoice.firmId);
  }, [generatedInvoice, firms]);

  // Derived Recipients List based on selected shoot
  const recipients = useMemo(() => {
    if (!selectedShootId) return [];
    const shoot = shoots.find(s => s.id === selectedShootId);
    if (!shoot) return [];

    const list = [];
    // Add Models
    shoot.modelIds.forEach(mid => {
       const m = models.find(mo => mo.id === mid);
       if (m) list.push({ id: mid, name: m.name, type: 'Model', data: m as any });
    });
    // Add Outsourced Crew
    shoot.floorManagerIds.forEach(fid => {
       const fm = floorManagers.find(f => f.id === fid);
       if (fm && fm.staffType === 'Outsource') {
         list.push({ id: fid, name: fm.name, type: 'Crew', role: fm.role, data: fm as any });
       }
    });
    return list;
  }, [selectedShootId, shoots, models, floorManagers]);

  // Filter History
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.date.includes(searchTerm)
    ).slice().reverse();
  }, [invoices, searchTerm]);

  const handleCategoryChange = (category: 'Service' | 'Travel') => {
    setBillingCategory(category);
    // Set default based on category, but allow override
    setTdsRate(category === 'Travel' ? 0 : 10);
  };

  const createInvoiceObject = (): Invoice | null => {
    const shoot = shoots.find(s => s.id === selectedShootId);
    if (!shoot) return null;
    
    if (!billingFirm) {
       alert('No Billing Firm associated with this shoot page.');
       return null;
    }
    
    const recipient = recipients.find(r => r.id === selectedRecipientId);
    if (!recipient) return null;

    const items: InvoiceItem[] = [];
    
    if (recipient.type === 'Model') {
       const m = recipient.data as Model;
       if (billingCategory === 'Service') {
          const rate = getModelRateForShoot(m, shoot.type);
          items.push({
             description: `Professional Fees - ${m.profileType} (${shoot.type})`,
             quantity: 1,
             rate: rate,
             amount: rate,
             tdsRate: tdsRate
          });
       } else {
          // Travel
          if (m.travelCharges > 0) {
             items.push({
                description: `Travel Reimbursement - ${shoot.locationName}`,
                quantity: 1,
                rate: m.travelCharges,
                amount: m.travelCharges,
                tdsRate: tdsRate
             });
          }
       }
    } else {
       // Crew
       const fm = recipient.data as FloorManager;
       if (billingCategory === 'Service') {
          items.push({
             description: `Service Charge: ${fm.role} for ${shoot.title}`,
             quantity: 1,
             rate: fm.rate,
             amount: fm.rate,
             tdsRate: tdsRate
          });
       } else {
          // Travel
          if ((fm.travelCharges || 0) > 0) {
             items.push({
                description: `Travel Reimbursement - ${shoot.locationName}`,
                quantity: 1,
                rate: fm.travelCharges || 0,
                amount: fm.travelCharges || 0,
                tdsRate: tdsRate
             });
          }
       }
    }

    // Fallback if 0
    if (items.length === 0) {
       items.push({ 
          description: billingCategory === 'Service' ? 'Professional Services' : 'Travel Expenses', 
          quantity: 1, 
          rate: 0, 
          amount: 0,
          tdsRate: 0 
       });
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    return {
      id: uuidv4(),
      number: `${billingCategory === 'Travel' ? 'TRV' : 'INV'}-${Math.floor(Math.random() * 10000)}`, 
      date: new Date().toLocaleDateString('en-GB'), 
      shootId: shoot.id,
      firmId: billingFirm.id,
      recipientName: recipient.name,
      recipientId: recipient.id,
      billingCategory,
      items,
      total,
      type: invoiceType
    };
  };

  const generateDocument = () => {
    const doc = createInvoiceObject();
    if (doc) {
      setGeneratedInvoice(doc);
      setTimeout(() => {
          printRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const generateAndPrint = () => {
    const doc = createInvoiceObject();
    if (doc) {
      setGeneratedInvoice(doc);
      setTimeout(() => {
          printRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => window.print(), 500);
      }, 100);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const quickPrint = (inv: Invoice) => {
    setGeneratedInvoice(inv);
    setTimeout(() => {
        printRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => window.print(), 500);
    }, 100);
  };

  const quickDownload = (inv: Invoice) => {
    setGeneratedInvoice(inv);
    setTimeout(() => {
        printRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            const originalTitle = document.title;
            document.title = `${inv.type}_${inv.number}`;
            window.print();
            document.title = originalTitle;
        }, 500);
    }, 100);
  };

  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    document.title = `${generatedInvoice?.type}_${generatedInvoice?.number}`; // Set title for filename
    window.print();
    document.title = originalTitle;
  };

  const saveDocument = () => {
    if (generatedInvoice) {
      const exists = invoices.find(i => i.id === generatedInvoice.id);
      if (exists) {
          alert('This document is already saved in history.');
      } else {
          addInvoice(generatedInvoice);
          alert('Document Saved to History');
      }
    }
  };

  const viewHistoryItem = (inv: Invoice) => {
    setGeneratedInvoice(inv);
    setTimeout(() => {
        printRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const calculateTDS = (amount: number, rate: number = 0) => (amount * rate) / 100;

  // Helper to find original model data for printing details
  const getRecipientDetails = () => {
     if (!generatedInvoice || !generatedInvoice.recipientId) return null;
     const model = models.find(m => m.id === generatedInvoice.recipientId);
     if (model) return model;
     // Fallback for crew if needed later, currently logic handles models for Bank details mostly
     return null;
  };

  const recipientModel = getRecipientDetails();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 no-print">
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
          <DollarSign size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Finance</h1>
          <p className="text-gray-500 dark:text-gray-400">Generate Invoices, POs, and view history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        <Card title="Document Generator" className="lg:col-span-1">
          <div className="space-y-4">
            {/* Document Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button 
                onClick={() => setInvoiceType('PO')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${invoiceType === 'PO' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Purchase Order
              </button>
              <button 
                onClick={() => setInvoiceType('INVOICE')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${invoiceType === 'INVOICE' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Invoice
              </button>
            </div>

            {/* Select Shoot */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">1. Select Shoot</label>
              <select 
                className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-[48px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={selectedShootId}
                onChange={(e) => { setSelectedShootId(e.target.value); setSelectedRecipientId(''); }}
              >
                <option value="">-- Choose a Shoot --</option>
                {shoots.map(s => <option key={s.id} value={s.id}>{s.title} ({s.date})</option>)}
              </select>
            </div>

            {billingFirm && (
               <div className="text-xs px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <strong>Billing Entity:</strong> {billingFirm.name} ({billingFirm.storeName})
               </div>
            )}

            {/* Select Recipient */}
            <div className="flex flex-col gap-1">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300">2. Select Recipient</label>
               <select 
                  className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 h-[48px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  disabled={!selectedShootId}
               >
                  <option value="">-- Choose Model / Crew --</option>
                  {recipients.map(r => (
                     <option key={r.id} value={r.id}>
                        {r.name} ({r.type === 'Crew' ? r.role : 'Model'})
                     </option>
                  ))}
               </select>
            </div>

            {/* Billing Category */}
            <div className="flex flex-col gap-2">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300">3. Bill For</label>
               <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer border rounded-lg p-2 flex flex-col items-center gap-1 transition-colors ${billingCategory === 'Service' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                     <input type="radio" name="billCat" className="hidden" checked={billingCategory === 'Service'} onChange={() => handleCategoryChange('Service')} />
                     <User size={20} />
                     <span className="text-xs font-medium">Service Fees</span>
                  </label>
                  <label className={`cursor-pointer border rounded-lg p-2 flex flex-col items-center gap-1 transition-colors ${billingCategory === 'Travel' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                     <input type="radio" name="billCat" className="hidden" checked={billingCategory === 'Travel'} onChange={() => handleCategoryChange('Travel')} />
                     <Plane size={20} />
                     <span className="text-xs font-medium">Travel Cost</span>
                  </label>
               </div>
            </div>

            {/* TDS Configuration */}
            <Input 
              label="TDS Rate (%)" 
              type="number" 
              value={tdsRate} 
              onChange={(e) => setTdsRate(Number(e.target.value))}
              min={0}
              max={100}
              className="transition-all"
            />

            <div className="flex gap-2 mt-2">
               <Button onClick={generateDocument} disabled={!selectedRecipientId} className="flex-1">
                 View Draft
               </Button>
               <Button variant="secondary" onClick={generateAndPrint} disabled={!selectedRecipientId} className="flex-1">
                 <Printer size={18} /> Print {invoiceType}
               </Button>
            </div>
          </div>
        </Card>

        <Card title="Invoice & PO History" className="lg:col-span-2" action={
           <div className="relative">
             <Search className="absolute left-2.5 top-2 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Search invoices..." 
               className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="py-2 pl-4">Ref #</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Firm</th>
                  <th className="py-2">Recipient</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => {
                   const invFirm = firms.find(f => f.id === inv.firmId);
                   return (
                   <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                     <td className="py-3 pl-4 font-medium text-gray-900 dark:text-white">{inv.number}</td>
                     <td className="py-3 text-gray-600 dark:text-gray-300">{inv.date}</td>
                     <td className="py-3 text-xs text-gray-500">{invFirm?.storeName || 'N/A'}</td>
                     <td className="py-3">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{inv.recipientName || 'Vendor'}</div>
                        <div className="text-xs text-gray-500">{inv.billingCategory || 'General'}</div>
                     </td>
                     <td className="py-3"><span className={`text-xs px-2 py-1 rounded ${inv.type === 'PO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{inv.type}</span></td>
                     <td className="py-3 text-right font-medium text-gray-900 dark:text-white">₹{inv.total.toLocaleString()}</td>
                     <td className="py-3 text-center pr-4">
                        <div className="flex items-center justify-end gap-1">
                           <button 
                              onClick={() => quickDownload(inv)}
                              className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors"
                              title={`Download ${inv.type}`}
                           >
                              <Download size={18} />
                           </button>
                           <button 
                              onClick={() => quickPrint(inv)}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                              title={`Print ${inv.type}`}
                           >
                              <Printer size={18} />
                           </button>
                           <button 
                              onClick={() => viewHistoryItem(inv)}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                              title="View Document"
                           >
                              <Eye size={18} />
                           </button>
                        </div>
                     </td>
                   </tr>
                )})}
                {filteredInvoices.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No documents found.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {generatedInvoice && previewFirm && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 duration-300">
           {/* Controls */}
           <div className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center no-print">
              <h3 className="font-bold text-gray-700 dark:text-white flex items-center gap-2">
                 <FileCheck size={18} /> 
                 Preview: {generatedInvoice.type} - {generatedInvoice.recipientName}
              </h3>
              <div className="flex gap-2">
                 <Button variant="secondary" onClick={handlePrint} className="text-gray-700 dark:text-gray-300">
                    <Printer size={16} /> Print {generatedInvoice.type === 'PO' ? 'PO' : 'Invoice'}
                 </Button>
                 <Button variant="secondary" onClick={handleDownloadPDF} className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                    <Download size={16} /> Download {generatedInvoice.type === 'PO' ? 'PO' : 'Invoice'}
                 </Button>
                 {/* Only show save if not already in history */}
                 {!invoices.find(i => i.id === generatedInvoice.id) && (
                    <Button onClick={saveDocument}><FileText size={16} /> Save Record</Button>
                 )}
              </div>
           </div>

           {/* Printable Area Container */}
           <div ref={printRef} className="p-8 max-w-[210mm] mx-auto bg-white text-black leading-tight border border-gray-200 shadow-sm my-8">
              
              {/* ======================= */}
              {/* INVOICE LAYOUT FORMAT   */}
              {/* ======================= */}
              {generatedInvoice.type === 'INVOICE' && (
                <div className="border border-black">
                  {/* Green Header Bar */}
                  <div className="bg-[#4d7c0f] text-white text-center py-2 font-bold text-2xl uppercase border-b border-black">
                    {generatedInvoice.recipientName}
                  </div>

                  {/* Info Grid */}
                  <div className="flex border-b border-black">
                    {/* Bill To Section */}
                    <div className="w-2/3 border-r border-black p-2 text-sm">
                      <p className="font-bold italic mb-1">Bill To: {previewFirm.name} ({previewFirm.storeName})</p>
                      <p><span className="font-bold">Name:</span> {previewFirm.name}</p>
                      <p><span className="font-bold">Address:</span> {previewFirm.address}</p>
                      <p><span className="font-bold">Phone No.:</span> {previewFirm.phone}</p>
                      <p><span className="font-bold">Email ID:</span> {previewFirm.email}</p>
                    </div>
                    {/* Invoice Details Section */}
                    <div className="w-1/3 p-2 text-sm">
                      <p><span className="font-bold">Invoice No.:</span> {generatedInvoice.number}</p>
                      <p className="mt-1"><span className="font-bold">Date:</span> {generatedInvoice.date}</p>
                    </div>
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-12 bg-[#86efac] border-b border-black text-sm font-bold text-center">
                    <div className="col-span-1 py-1 border-r border-black italic">SR. No.</div>
                    <div className="col-span-7 py-1 border-r border-black italic">Description</div>
                    <div className="col-span-2 py-1 border-r border-black italic">QTY</div>
                    <div className="col-span-2 py-1 italic">Amount</div>
                  </div>

                  {/* Table Body */}
                  <div className="min-h-[300px]">
                    {generatedInvoice.items.map((item, idx) => (
                       <div key={idx} className="grid grid-cols-12 border-b border-black text-sm">
                          <div className="col-span-1 py-1 border-r border-black text-center">{idx + 1}</div>
                          <div className="col-span-7 py-1 border-r border-black px-2">{item.description}</div>
                          <div className="col-span-2 py-1 border-r border-black text-center">{item.quantity}</div>
                          <div className="col-span-2 py-1 text-center font-bold">{item.amount.toLocaleString()}</div>
                       </div>
                    ))}
                    {[...Array(5)].map((_, i) => (
                      <div key={`empty-${i}`} className="grid grid-cols-12 border-b border-black text-sm h-6">
                         <div className="col-span-1 border-r border-black"></div>
                         <div className="col-span-7 border-r border-black"></div>
                         <div className="col-span-2 border-r border-black"></div>
                         <div className="col-span-2"></div>
                      </div>
                    ))}
                  </div>

                  {/* Totals Header */}
                  <div className="grid grid-cols-12 bg-[#86efac] border-b border-black font-bold text-sm">
                     <div className="col-span-10 py-1 border-r border-black px-2 italic">Total</div>
                     <div className="col-span-2 py-1 text-center">{generatedInvoice.total.toLocaleString()}</div>
                  </div>

                  {/* Footer Totals Section */}
                  <div className="grid grid-cols-2 border-b border-black text-sm">
                     <div className="border-r border-black p-2">
                        <p><span className="font-bold">Description:</span> {generatedInvoice.billingCategory} Charges Invoice</p>
                        {/* BANK DETAILS SECTION */}
                        {recipientModel && recipientModel.bankDetails && recipientModel.bankDetails.accountNumber && (
                           <div className="mt-4 text-xs">
                              <p className="font-bold underline mb-1">Bank Details for Payment:</p>
                              <p><span className="font-semibold">Bank:</span> {recipientModel.bankDetails.bankName}</p>
                              <p><span className="font-semibold">A/c No:</span> {recipientModel.bankDetails.accountNumber}</p>
                              <p><span className="font-semibold">IFSC:</span> {recipientModel.bankDetails.ifscCode}</p>
                           </div>
                        )}
                        <div className="mt-4">
                           <p className="font-bold">I hereby declare that the services mentioned above have been rendered.</p>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between border-b border-black p-1 px-2">
                           <span>Sub. Total:</span>
                           <span>{generatedInvoice.total.toLocaleString()}</span>
                        </div>
                        {generatedInvoice.items.reduce((acc, item) => acc + calculateTDS(item.amount, item.tdsRate), 0) > 0 && (
                          <div className="flex justify-between border-b border-black p-1 px-2 text-red-700 italic">
                             <span>Less: TDS:</span>
                             <span>-{generatedInvoice.items.reduce((acc, item) => acc + calculateTDS(item.amount, item.tdsRate), 0).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between bg-[#86efac] p-1 px-2 font-bold">
                           <span>Net Payable:</span>
                           <span>
                             {(generatedInvoice.total - generatedInvoice.items.reduce((acc, item) => acc + calculateTDS(item.amount, item.tdsRate), 0)).toLocaleString()}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Footer Terms & Sign */}
                  <div className="flex min-h-[80px]">
                     <div className="w-1/2 border-r border-black p-2 text-sm flex flex-col justify-between">
                        <p><span className="font-bold">Terms & Condition:</span> As per company policy</p>
                        <p className="font-bold mt-4">PAN No. - {recipientModel?.pan || 'N/A'}</p>
                     </div>
                     <div className="w-1/2 flex flex-col justify-end">
                        <div className="text-right pb-4 px-2 font-bold text-xs italic">
                           For {generatedInvoice.recipientName}
                        </div>
                        <div className="bg-[#86efac] text-center py-1 text-sm font-bold border-t border-black italic">
                           Authorised Signatory
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* ============================= */}
              {/* PURCHASE ORDER LAYOUT FORMAT  */}
              {/* ============================= */}
              {generatedInvoice.type === 'PO' && (
                <div>
                  <div className="flex flex-col items-center justify-center mb-6 border-b-2 border-black pb-4">
                     {previewFirm.logoUrl && <img src={previewFirm.logoUrl} alt="Logo" className="h-16 mb-2 object-contain" />}
                     <h1 className="text-xl font-bold uppercase tracking-wide">{previewFirm.name} ({previewFirm.storeName})</h1>
                     <p className="text-xs text-center whitespace-pre-line max-w-lg font-medium">{previewFirm.address}</p>
                     <p className="text-xs font-bold mt-1">SURAT - 395007</p>
                  </div>

                  <div className="text-center mb-6">
                     <h2 className="text-lg font-bold">Purchase Order</h2>
                  </div>

                  <div className="mb-4">
                     <p className="text-sm font-bold">Dt: <span className="font-normal">{generatedInvoice.date}</span></p>
                     <p className="text-sm font-bold">Po: <span className="font-normal">{generatedInvoice.number.split('|')[0]}</span></p>
                  </div>

                  <div className="mb-6">
                     <p className="text-sm font-bold">To,</p>
                     <p className="text-sm font-bold">{generatedInvoice.recipientName}</p>
                     <p className="text-sm mt-4 font-bold">Kindly Att. To <span className="font-bold">{generatedInvoice.recipientName}</span>,</p>
                     <p className="text-sm font-bold mt-4">{previewFirm.name}</p>
                     <p className="text-sm mt-1">We are placing the following order. Please check the following:</p>
                  </div>

                  <div className="mb-4">
                    <table className="w-full border-collapse border border-black text-xs">
                       <thead>
                          <tr className="border-b border-black text-center font-bold">
                             <th className="border-r border-black py-2 px-1 w-10">Sr</th>
                             <th className="border-r border-black py-2 px-2 text-left">PRODUCT DESCRIPTION</th>
                             <th className="border-r border-black py-2 px-1 w-12">QTY</th>
                             <th className="border-r border-black py-2 px-2 w-20">Gross Amt</th>
                             <th className="border-r border-black py-2 px-1 w-16">TDS Rate%</th>
                             <th className="border-r border-black py-2 px-2 w-16">TDS Amt</th>
                             <th className="py-2 px-2 w-20">Net Amt</th>
                          </tr>
                       </thead>
                       <tbody>
                          {generatedInvoice.items.map((item, idx) => {
                             const tdsAmt = calculateTDS(item.amount, item.tdsRate);
                             return (
                             <tr key={idx} className="border-b border-black align-top">
                                <td className="border-r border-black py-2 px-1 text-center">{idx + 1}</td>
                                <td className="border-r border-black py-2 px-2 text-left font-medium">{item.description}</td>
                                <td className="border-r border-black py-2 px-1 text-center">{item.quantity}</td>
                                <td className="border-r border-black py-2 px-2 text-right">{item.amount.toLocaleString()}</td>
                                <td className="border-r border-black py-2 px-1 text-center">{item.tdsRate || 0}%</td>
                                <td className="border-r border-black py-2 px-2 text-right">{tdsAmt.toLocaleString()}</td>
                                <td className="py-2 px-2 text-right font-bold">{(item.amount - tdsAmt).toLocaleString()}</td>
                             </tr>
                          )})}
                          {/* Totals Row */}
                          <tr className="font-bold bg-gray-100 print:bg-gray-100">
                             <td className="border-r border-black"></td>
                             <td className="border-r border-black py-2 px-2 text-left">TOTAL</td>
                             <td className="border-r border-black"></td>
                             <td className="border-r border-black py-2 px-2 text-right">{generatedInvoice.total.toLocaleString()}</td>
                             <td className="border-r border-black"></td>
                             <td className="border-r border-black py-2 px-2 text-right">
                                {generatedInvoice.items.reduce((s, i) => s + calculateTDS(i.amount, i.tdsRate), 0).toLocaleString()}
                             </td>
                             <td className="py-2 px-2 text-right">
                                {generatedInvoice.items.reduce((s, i) => s + (i.amount - calculateTDS(i.amount, i.tdsRate)), 0).toLocaleString()}
                             </td>
                          </tr>
                       </tbody>
                    </table>
                  </div>

                  <div className="text-xs space-y-1 mb-10 font-medium">
                     <p><span className="font-bold">Terms & Condition :</span></p>
                     <p><span className="font-bold">Applicable Tax :</span> NA</p>
                     <p><span className="font-bold">Delivery Address :</span> {previewFirm.address}</p>
                     <p><span className="font-bold">LOCATION :</span> SURAT</p>
                  </div>

                  <div className="text-xs">
                     <p className="mb-6">Sincerely,<br/>For <span className="font-bold">{previewFirm.name}</span></p>
                  </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};