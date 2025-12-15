import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FloorManager, StaffType } from '../types';
import { CREW_ROLES, STAFF_TYPES } from '../constants';
import { Card, Input, Button, Modal, Select } from '../components/UI';
import { Briefcase, Plus, Edit2, Phone, User, Trash2, BadgeCheck, Building, Plane } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const TeamManager: React.FC = () => {
  const { floorManagers, addFloorManager, updateFloorManager, deleteFloorManager } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm: FloorManager = {
    id: '',
    name: '',
    phone: '+91 ',
    rate: 0,
    travelCharges: 0,
    role: 'Floor Manager',
    staffType: 'Outsource'
  };

  const [formData, setFormData] = useState<FloorManager>(initialForm);

  const openNew = () => {
    setFormData({ ...initialForm, id: uuidv4() });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (fm: FloorManager) => {
    setFormData(fm);
    setEditingId(fm.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      deleteFloorManager(id);
    }
  };

  const handleSave = () => {
    if (editingId) {
      updateFloorManager(formData);
    } else {
      addFloorManager(formData);
    }
    setIsModalOpen(false);
  };

  const getStaffTypeColor = (type: StaffType) => {
    switch (type) {
      case 'Inhouse': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'Outsource': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'Store': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-full text-teal-600 dark:text-teal-400">
            <Briefcase size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crew & Staff Database</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage Floor Managers, Photographers, and Support Staff</p>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus size={18} /> Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {floorManagers.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
            No staff members found. Add Crew to get started.
          </div>
        )}
        {floorManagers.map(fm => (
          <Card key={fm.id} className="hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                   <User size={20} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-white">{fm.name}</h3>
                   <div className="flex items-center gap-2 mt-1">
                     <span className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                        <BadgeCheck size={12} className="text-teal-500"/> {fm.role}
                     </span>
                     <span className={`text-[10px] px-2 py-0.5 rounded border ${getStaffTypeColor(fm.staffType || 'Outsource')}`}>
                        {fm.staffType || 'Outsource'}
                     </span>
                   </div>
                 </div>
               </div>
               <div className="flex gap-1">
                 <Button variant="ghost" size="sm" onClick={() => openEdit(fm)} title="Edit">
                   <Edit2 size={16} />
                 </Button>
                 <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(fm.id)} title="Delete">
                   <Trash2 size={16} />
                 </Button>
               </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Phone size={14} /> {fm.phone || 'No contact info'}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Rate:</span> 
                  {fm.staffType === 'Outsource' ? `₹${fm.rate || 0} / shift` : <span className="text-green-600 dark:text-green-400 font-medium">Salaried</span>}
                </div>
                {(fm.travelCharges || 0) > 0 && (
                   <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Plane size={12} /> +₹{fm.travelCharges} Travel
                   </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Staff Details" : "Add New Crew/Staff"}>
        <div className="space-y-4">
          <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Rahul Sharma" />
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Designation / Role" 
              options={CREW_ROLES} 
              value={formData.role || 'Floor Manager'} 
              onChange={e => setFormData({...formData, role: e.target.value})} 
            />
            <Select 
              label="Staff Type" 
              options={STAFF_TYPES} 
              value={formData.staffType || 'Outsource'} 
              onChange={e => setFormData({...formData, staffType: e.target.value as StaffType})} 
            />
          </div>
          
          <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91..." />
          
          <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
             <div className="flex flex-col gap-1">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Rate / Charge (₹)</label>
               <input
                  type="number"
                  value={formData.rate || ''}
                  onChange={e => setFormData({...formData, rate: Number(e.target.value)})}
                  disabled={formData.staffType !== 'Outsource'}
                  className={`border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formData.staffType !== 'Outsource' ? 'bg-gray-100 dark:bg-gray-600 text-gray-400' : ''}`}
               />
               {formData.staffType !== 'Outsource' && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                     <Building size={10} /> Cost is excluded from Shoot Budget for {formData.staffType} staff.
                  </p>
               )}
             </div>
             
             <Input 
                label="Travel Charges (₹)" 
                type="number" 
                value={formData.travelCharges || ''} 
                onChange={e => setFormData({...formData, travelCharges: Number(e.target.value)})} 
             />
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave}>Save Staff Details</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};