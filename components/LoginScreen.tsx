
import React, { useState } from 'react';
import { UserIcon, KeyIcon } from './Icons';

interface LoginScreenProps {
    onLogin: (username: string, passkey: string) => void;
    error: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [passkey, setPasskey] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !passkey) return;
        setIsLoading(true);
        // Simulate network delay for better UX
        setTimeout(() => {
            onLogin(username, passkey);
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
                        Hotel Minibar Tracker
                    </h1>
                    <p className="text-slate-500 mt-2">Please sign in to continue</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                                Username
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <UserIcon className="text-xl text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                    placeholder="e.g., clerk"
                                    disabled={isLoading}
                                    autoCapitalize="none"
                                />
                            </div>
                        </div>
                        <div>
                             <label htmlFor="passkey" className="block text-sm font-medium text-slate-700 mb-1">
                                Passkey
                            </label>
                             <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <KeyIcon className="text-xl text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    id="passkey"
                                    value={passkey}
                                    onChange={(e) => setPasskey(e.target.value)}
                                    required
                                    maxLength={4}
                                    className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                    placeholder="4-digit pin"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm">
                                <p>{error}</p>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
