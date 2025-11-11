
import React, { useState, useMemo, useEffect } from 'react';
import type { Receipt, Product, User, Role } from '../types';
import { AppView } from '../types';
import { ChartBarIcon, UserGroupIcon, ShieldCheckIcon, PlusIcon, PencilIcon, TrashIcon, CloseIcon } from './Icons';

type AdminSubView = 'main' | 'stats' | 'users' | 'roles';

interface AdminViewProps {
  receipts: Receipt[];
  products: Product[];
  users: User[];
  roles: Role[];
  currentUser: User | null;
  onAddUser: (username: string, passkey: string, roleId: string) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddRole: (name: string, permissions: AppView[]) => void;
  onUpdateRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
}

const FormModal: React.FC<{title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode}> = ({ title, isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100">
                        <CloseIcon className="text-2xl" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const StatCard: React.FC<{title: string, value: string | number, children?: React.ReactNode}> = ({title, value, children}) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        {children}
    </div>
);

export const AdminView: React.FC<AdminViewProps> = (props) => {
    const { receipts, users, roles, currentUser, onAddUser, onUpdateUser, onDeleteUser, onAddRole, onUpdateRole, onDeleteRole } = props;
    const [subView, setSubView] = useState<AdminSubView>('main');

    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [username, setUsername] = useState('');
    const [passkey, setPasskey] = useState('');
    const [userRoleId, setUserRoleId] = useState('');

    const [isRoleModalOpen, setRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleName, setRoleName] = useState('');
    const [rolePermissions, setRolePermissions] = useState<AppView[]>([]);

    useEffect(() => {
        if (editingUser) {
            setUsername(editingUser.username);
            setPasskey(editingUser.passkey);
            setUserRoleId(editingUser.roleId);
            setUserModalOpen(true);
        }
    }, [editingUser]);

    useEffect(() => {
        if (editingRole) {
            setRoleName(editingRole.name);
            setRolePermissions(editingRole.permissions);
            setRoleModalOpen(true);
        }
    }, [editingRole]);

    const closeUserModal = () => {
        setUserModalOpen(false);
        setEditingUser(null);
        setUsername(''); setPasskey(''); setUserRoleId('');
    };

    const closeRoleModal = () => {
        setRoleModalOpen(false);
        setEditingRole(null);
        setRoleName(''); setRolePermissions([]);
    };

    const handleUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            onUpdateUser({ ...editingUser, username, passkey, roleId: userRoleId });
        } else {
            onAddUser(username, passkey, userRoleId);
        }
        closeUserModal();
    };

    const handleRoleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRole) {
            onUpdateRole({ ...editingRole, name: roleName, permissions: rolePermissions });
        } else {
            onAddRole(roleName, rolePermissions);
        }
        closeRoleModal();
    };
    
    const handlePermissionChange = (view: AppView, checked: boolean) => {
        if (checked) {
            setRolePermissions(prev => [...prev, view]);
        } else {
            setRolePermissions(prev => prev.filter(p => p !== view));
        }
    };

    const stats = useMemo(() => {
        const itemStats: { [productId: string]: { name: string; count: number } } = {};
        let totalRevenue = 0;
        let totalItemsSold = 0;

        receipts.forEach(receipt => {
            totalRevenue += receipt.totalBill;
            receipt.consumedItems.forEach(item => {
                totalItemsSold += item.quantity;
                if (!itemStats[item.productId]) {
                    itemStats[item.productId] = { name: item.productName, count: 0 };
                }
                itemStats[item.productId].count += item.quantity;
            });
        });

        const sortedItems = Object.values(itemStats).sort((a, b) => b.count - a.count);
        return {
            totalRevenue: totalRevenue.toFixed(2),
            totalItemsSold,
            receiptCount: receipts.length,
            mostSold: sortedItems.slice(0, 5),
            leastSold: sortedItems.slice(-5).reverse(),
        };
    }, [receipts]);

    const renderMain = () => (
         <>
          <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <button onClick={() => setSubView('stats')} className="group text-left p-6 bg-white rounded-xl shadow-lg border border-slate-200 hover:border-sky-500 hover:shadow-sky-200 transition-all duration-300">
                  <ChartBarIcon className="text-5xl text-sky-500 mb-4 group-hover:scale-110 transition-transform"/>
                  <h2 className="text-2xl font-bold text-slate-800">Statistics</h2>
                  <p className="text-slate-500 mt-1">View sales and consumption data.</p>
              </button>
              <button onClick={() => setSubView('users')} className="group text-left p-6 bg-white rounded-xl shadow-lg border border-slate-200 hover:border-sky-500 hover:shadow-sky-200 transition-all duration-300">
                  <UserGroupIcon className="text-5xl text-sky-500 mb-4 group-hover:scale-110 transition-transform"/>
                  <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                  <p className="text-slate-500 mt-1">Add, edit, or remove user accounts.</p>
              </button>
              <button onClick={() => setSubView('roles')} className="group text-left p-6 bg-white rounded-xl shadow-lg border border-slate-200 hover:border-sky-500 hover:shadow-sky-200 transition-all duration-300">
                  <ShieldCheckIcon className="text-5xl text-sky-500 mb-4 group-hover:scale-110 transition-transform"/>
                  <h2 className="text-2xl font-bold text-slate-800">Role Management</h2>
                  <p className="text-slate-500 mt-1">Define roles and access permissions.</p>
              </button>
          </div>
        </>
    );
    
    const renderStats = () => (
        <>
            <button onClick={() => setSubView('main')} className="text-sky-600 hover:text-sky-800 font-semibold mb-4">&larr; Back to Admin Dashboard</button>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Sales & Consumption Statistics</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard title="Total Revenue" value={`$${stats.totalRevenue}`} />
                <StatCard title="Receipts Processed" value={stats.receiptCount} />
                <StatCard title="Total Items Sold" value={stats.totalItemsSold} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Most Consumed Items</h2>
                    {stats.mostSold.length > 0 ? (
                        <ul className="space-y-3">
                            {stats.mostSold.map(item => <li key={item.name} className="flex justify-between items-center text-slate-600"><span>{item.name}</span><span className="font-bold text-slate-800">{item.count} sold</span></li>)}
                        </ul>
                    ) : <p className="text-slate-500 italic">No consumption data yet.</p>}
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Least Consumed Items</h2>
                     {stats.leastSold.length > 0 ? (
                        <ul className="space-y-3">
                            {stats.leastSold.map(item => <li key={item.name} className="flex justify-between items-center text-slate-600"><span>{item.name}</span><span className="font-bold text-slate-800">{item.count} sold</span></li>)}
                        </ul>
                    ) : <p className="text-slate-500 italic">No consumption data yet.</p>}
                </div>
            </div>
        </>
    );

    const renderUsers = () => (
         <>
            <button onClick={() => setSubView('main')} className="text-sky-600 hover:text-sky-800 font-semibold mb-4">&larr; Back to Admin Dashboard</button>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-700">User Management</h2>
                    <button onClick={() => setUserModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow">
                        <PlusIcon className="text-xl" /> Add User
                    </button>
                </div>
                <div className="space-y-2">
                    {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                            <div>
                                <p className="font-semibold text-slate-800">{user.username}</p>
                                <p className="text-sm text-slate-500">{roles.find(r => r.id === user.roleId)?.name || 'Unknown Role'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingUser(user)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"><PencilIcon className="text-xl"/></button>
                                <button onClick={() => onDeleteUser(user.id)} disabled={currentUser?.id === user.id} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full disabled:text-slate-300 disabled:cursor-not-allowed"><TrashIcon className="text-xl"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    const renderRoles = () => (
         <>
            <button onClick={() => setSubView('main')} className="text-sky-600 hover:text-sky-800 font-semibold mb-4">&larr; Back to Admin Dashboard</button>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-700">Role Management</h2>
                    <button onClick={() => setRoleModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow">
                        <PlusIcon className="text-xl" /> Add Role
                    </button>
                </div>
                <div className="space-y-2">
                    {roles.map(role => (
                        <div key={role.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                            <div>
                                <p className="font-semibold text-slate-800">{role.name}</p>
                                <p className="text-sm text-slate-500">{role.permissions.join(', ')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingRole(role)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"><PencilIcon className="text-xl"/></button>
                                <button onClick={() => onDeleteRole(role.id)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"><TrashIcon className="text-xl"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );


    return (
        <div className="container mx-auto p-4 md:p-6 space-y-8">
            {subView === 'main' && renderMain()}
            {subView === 'stats' && renderStats()}
            {subView === 'users' && renderUsers()}
            {subView === 'roles' && renderRoles()}

            <FormModal title={editingUser ? "Edit User" : "Add User"} isOpen={isUserModalOpen} onClose={closeUserModal}>
                <form onSubmit={handleUserSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                        </div>
                        <div>
                            <label htmlFor="passkey" className="block text-sm font-medium text-slate-700 mb-1">Passkey (4 digits)</label>
                            <input type="text" inputMode="numeric" id="passkey" value={passkey} onChange={e => setPasskey(e.target.value)} required maxLength={4} pattern="\d{4}" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select id="role" value={userRoleId} onChange={e => setUserRoleId(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white">
                                <option value="" disabled>Select a role</option>
                                {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow">{editingUser ? "Save Changes" : "Add User"}</button>
                    </div>
                </form>
            </FormModal>

            <FormModal title={editingRole ? "Edit Role" : "Add Role"} isOpen={isRoleModalOpen} onClose={closeRoleModal}>
                <form onSubmit={handleRoleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="roleName" className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
                            <input type="text" id="roleName" value={roleName} onChange={e => setRoleName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Permissions</label>
                            <div className="space-y-2">
                                {Object.values(AppView).map(view => (
                                    <div key={view} className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            id={`perm-${view}`} 
                                            checked={rolePermissions.includes(view)}
                                            onChange={(e) => handlePermissionChange(view, e.target.checked)}
                                            className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                                        />
                                        <label htmlFor={`perm-${view}`} className="ml-2 text-slate-700">{view}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow">{editingRole ? "Save Changes" : "Add Role"}</button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
};
