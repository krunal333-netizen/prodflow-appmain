import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Input, Card } from '../components/UI';
import { Lock, User, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <span className="text-white text-3xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ProdFlow</h1>
          <p className="text-gray-500 dark:text-gray-400">Production Management Suite</p>
        </div>

        <Card className="shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sign in to your account</h2>
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg mb-4">
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-2.5" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            </Button>
            
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
               Secure Login via Firebase
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};