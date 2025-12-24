
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
// Added ConfirmationModal to imports
import { Card, Input, Button, Modal, ConfirmationModal } from '../components/UI';
import { User, Shield, ShieldCheck, Plus, Trash2, Key, Sparkles, Lock, Eye, EyeOff, Edit3, Settings2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const UserManagement: React.FC = () => {
  const { users, addUser, deleteUser, currentUser, accessConfig, updateAccessConfig } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'USER' as 'ADMIN' | 'USER'
  });

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) return;
    setIsCreating(true);
    await addUser({ id: uuidv4(), ...newUser }, newUser.password);
    setIsCreating(false);
    setNewUser({ username: '', password: '', name: '', role: 'USER' });
    setIsModalOpen(false);
  };

  const togglePermission = (category: string, field: 'visible' | 'editable') => {
    const updated = accessConfig.userPermissions.map(p => 
      p.category === category ? { ...p, [field]: !p[field] } : p
    );
    updateAccessConfig({ ...accessConfig, userPermissions: updated });
  };

  const initiateDelete = (id: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete yourself.");
      return;
    }
    setUserToDelete(id);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-10 animate-pageInUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-lightText dark:text-white font-display tracking-tight leading-none">Security Center</h1>
            <p className="text-lightTextSecondary dark:text-gray-400 text-sm font-medium mt-1.5 tracking-wide">Manage access roles and granular category permissions</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsPermissionsOpen(true)}>
            <Settings2 size={18} /> Access Control Matrix
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Studio User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map(u => (
          <Card key={u.id} noPadding className="border-none shadow-soft hover:scale-[1.02] transition-all">
            <div className="p-7">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                   <User size={32} />
                </div>
                <div className="flex gap-1">
                   {u.role === 'ADMIN' ? (
                     <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <Shield size={12} /> Master
                     </div>
                   ) : (
                     <div className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <User size={12} /> User
                     </div>
                   )}
                   <button 
                     onClick={() => initiateDelete(u.id)} 
                     className="p-2 text-lightTextSecondary hover:text-lightDanger transition-colors"
                     disabled={u.id === currentUser?.id}
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>

              <h3 className="font-black text-lightText dark:text-white text-lg tracking-tight mb-1">{u.name}</h3>
              <p className="text-[11px] font-bold text-lightTextSecondary uppercase tracking-widest mb-6">{u.username}</p>
              
              <div className="pt-4 border-t border-lightBorder dark:border-navy-700/50 flex items-center gap-2">
                 <Key size={14} className="text-lightTextSecondary opacity-40" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-lightTextSecondary">Identity Verified</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Access Control Matrix Modal */}
      <Modal isOpen={isPermissionsOpen} onClose={() => setIsPermissionsOpen(false)} title="Access Control Matrix">
         <div className="p-8 space-y-8">
            <div className="flex items-start gap-4 p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800">
               <Shield className="text-amber-500 shrink-0" size={24} />
               <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">Global User Role Config</h4>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-500/80 leading-relaxed">Changes below apply to all accounts with the 'USER' role. Admin accounts always maintain full access.</p>
               </div>
            </div>

            <div className="bg-white dark:bg-navy-900 border border-lightBorder dark:border-navy-700 rounded-2xl overflow-hidden shadow-soft">
               <table className="w-full text-left">
                  <thead className="bg-lightBgSecondary dark:bg-navy-800 text-[10px] font-black uppercase tracking-widest text-lightTextSecondary border-b border-lightBorder dark:border-navy-700">
                     <tr>
                        <th className="px-6 py-4">Expense Category</th>
                        <th className="px-6 py-4 text-center">Visibility</th>
                        <th className="px-6 py-4 text-center">Editability</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-lightBorder dark:divide-navy-700">
                     {accessConfig.userPermissions.map((perm) => (
                        <tr key={perm.category} className="hover:bg-lightBgSecondary/10 transition-colors">
                           <td className="px-6 py-4">
                              <span className="text-xs font-black text-lightText dark:text-white uppercase tracking-tight">{perm.category}</span>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <button 
                                 onClick={() => togglePermission(perm.category, 'visible')}
                                 className={`p-2 rounded-xl transition-all ${perm.visible ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400 opacity-50'}`}
                              >
                                 {perm.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                              </button>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <button 
                                 onClick={() => togglePermission(perm.category, 'editable')}
                                 className={`p-2 rounded-xl transition-all ${perm.editable ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400 opacity-50'}`}
                              >
                                 {perm.editable ? <Edit3 size={18} /> : <Lock size={18} />}
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="flex gap-4 pt-4">
               <Button onClick={() => setIsPermissionsOpen(false)} className="w-full shadow-xl shadow-lightPrimary/20 font-black uppercase tracking-widest text-[11px]">Deploy Security Update</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision New Account">
         <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input label="Display Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Full Name" />
               <Input label="System ID / Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="Unique ID" />
               <Input label="Access Key" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Secret Passcode" />
               <div className="space-y-1.5">
                  <label className="text-sm font-bold text-lightText dark:text-white ml-1">Access Tier</label>
                  <select 
                     className="w-full h-[50px] border border-lightBorder dark:border-navy-700 rounded-lg px-4 bg-white dark:bg-navy-900 text-sm font-black text-lightText dark:text-white outline-none focus:ring-4 focus:ring-lightPrimary/10"
                     value={newUser.role}
                     onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                  >
                     <option value="USER">Standard User (Restricted)</option>
                     <option value="ADMIN">Master Admin (Full Access)</option>
                  </select>
               </div>
            </div>
            <div className="flex gap-4">
               <Button variant="ghost" className="flex-1 font-black uppercase tracking-widest text-[11px]" onClick={() => setIsModalOpen(false)}>Abort</Button>
               <Button className="flex-1 shadow-xl shadow-lightPrimary/20 font-black uppercase tracking-widest text-[11px]" onClick={handleAddUser}>Authorize Creation</Button>
            </div>
         </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDelete}
        title="Revoke Access"
        message="Are you sure you want to terminate this user's session and delete their identity? This action is immediate and will prevent them from logging back in."
      />
    </div>
  );
};
