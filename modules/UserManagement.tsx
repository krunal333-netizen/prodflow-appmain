import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Input, Button, Select, Modal } from '../components/UI';
import { User, Shield, ShieldCheck, Plus, Trash2, Key, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const UserManagement: React.FC = () => {
  const { users, addUser, deleteUser, currentUser } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'USER' as 'ADMIN' | 'USER'
  });

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) return;
    setIsCreating(true);
    
    await addUser({
      id: uuidv4(), // Placeholder, real ID comes from Firebase
      ...newUser
    }, newUser.password);
    
    setIsCreating(false);
    setNewUser({ username: '', password: '', name: '', role: 'USER' });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete yourself.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user? Access will be revoked immediately.")) {
      await deleteUser(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-500 dark:text-gray-400">Create and manage application access</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Create User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <Card key={user.id} className="relative group">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${user.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-gray-500'}`}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{user.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.username}</p>
                  <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded font-medium ${user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              {user.id !== currentUser?.id && (
                <button 
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            {user.id === currentUser?.id && (
               <div className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-bold">You</div>
            )}
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User">
        <div className="space-y-4">
          <Input 
            label="Full Name" 
            value={newUser.name} 
            onChange={e => setNewUser({...newUser, name: e.target.value})} 
            placeholder="e.g. John Doe"
          />
          <Input 
            label="Email (Username)" 
            type="email"
            value={newUser.username} 
            onChange={e => setNewUser({...newUser, username: e.target.value})} 
            placeholder="john@company.com"
          />
          <Input 
            label="Password" 
            type="password"
            value={newUser.password} 
            onChange={e => setNewUser({...newUser, password: e.target.value})} 
            placeholder="Min 6 chars"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value as 'ADMIN' | 'USER'})}
            >
              <option value="USER">Standard User</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={isCreating}>
              {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};