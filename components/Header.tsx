
import React from 'react';
import { AppView } from '../types';
import { BuildingIcon, ReceiptIcon, CogIcon, ShieldCheckIcon } from './Icons';

interface HeaderProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  permissions: AppView[];
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, permissions }) => {
  const getButtonClasses = (view: AppView) => {
    const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white";
    if (currentView === view) {
      return `${baseClasses} bg-sky-500 text-white shadow-md`;
    }
    return `${baseClasses} bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white`;
  };

  return (
    <header className="bg-slate-800 text-white p-4 shadow-lg sticky top-0 z-20">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Minibar Tracker
        </h1>
        <nav className="flex items-center gap-2 md:gap-4">
          {permissions.includes(AppView.Rooms) && (
            <button onClick={() => setCurrentView(AppView.Rooms)} className={getButtonClasses(AppView.Rooms)}>
              <BuildingIcon className="text-xl" />
              <span className="hidden md:inline">Rooms</span>
            </button>
          )}
          {permissions.includes(AppView.FrontDesk) && (
            <button onClick={() => setCurrentView(AppView.FrontDesk)} className={getButtonClasses(AppView.FrontDesk)}>
              <ReceiptIcon className="text-xl" />
              <span className="hidden md:inline">Front Desk</span>
            </button>
          )}
          {permissions.includes(AppView.Management) && (
            <button onClick={() => setCurrentView(AppView.Management)} className={getButtonClasses(AppView.Management)}>
              <CogIcon className="text-xl" />
              <span className="hidden md:inline">Management</span>
            </button>
          )}
          {permissions.includes(AppView.Admin) && (
            <button onClick={() => setCurrentView(AppView.Admin)} className={getButtonClasses(AppView.Admin)}>
              <ShieldCheckIcon className="text-xl" />
              <span className="hidden md:inline">Admin</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
