
import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { RoomGrid } from './components/RoomGrid';
import { RoomDetail } from './components/RoomDetail';
import { FrontDeskView } from './components/FrontDeskView';
import { ReceiptModal } from './components/ReceiptModal';
import { ManagementView } from './components/ManagementView';
import { AdminView } from './components/AdminView';
import { LoginScreen } from './components/LoginScreen';
import { AppView, type Room, type Receipt, type Product, type User, type Role } from './types';
import * as db from './lib/db';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loadData = async () => {
    const [dbRooms, dbProducts, dbReceipts, dbUsers, dbRoles] = await Promise.all([
      db.getRooms(),
      db.getProducts(),
      db.getReceipts(),
      db.getUsers(),
      db.getRoles(),
    ]);
    setRooms(dbRooms);
    setProducts(dbProducts);
    setReceipts(dbReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setUsers(dbUsers);
    setRoles(dbRoles);
    setIsLoading(false);
  };

  useEffect(() => {
    db.init().then(() => {
        loadData();
    });
  }, []);
  
  const handleLogin = (username: string, passkey: string) => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.passkey === passkey);
    if (user) {
        setCurrentUser(user);
        const userRole = roles.find(role => role.id === user.roleId);
        const permissions = userRole ? userRole.permissions : [];
        setCurrentView(permissions[0] || null);
        setLoginError(null);
    } else {
        setLoginError("Invalid username or passkey.");
    }
  };

  const currentUserPermissions = useMemo(() => {
    if (!currentUser) return [];
    const userRole = roles.find(role => role.id === currentUser.roleId);
    return userRole ? userRole.permissions : [];
  }, [currentUser, roles]);

  const handleSetCurrentView = (view: AppView) => {
    if (currentUserPermissions.includes(view)) {
      setCurrentView(view);
      setSelectedRoomId(null);
    } else {
      alert(`Access Denied: Your role does not have permission to view '${view}'.`);
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleBackToGrid = () => {
    setSelectedRoomId(null);
  };

  const handleReceiptSubmit = async (receipt: Receipt) => {
    const room = rooms.find(r => r.id === receipt.roomId);
    if (!room) return;

    const newStock = { ...room.minibarStock };
    receipt.consumedItems.forEach(item => {
        newStock[item.productId] = (newStock[item.productId] || 0) - item.quantity;
    });

    await db.addReceipt(receipt);
    await db.updateRoomStock(receipt.roomId, newStock);
    
    setLastReceipt(receipt);
    setSelectedRoomId(null);
    await loadData();
  };
  
  // --- Management Handlers ---
  const handleAddRoom = async (building: number, roomId: string) => {
    if (!roomId || !building) return alert("Room and Building numbers are required.");
    if (rooms.some(r => r.id === roomId)) return alert("Room number already exists.");
    
    const currentProducts = await db.getProducts();
    const newMinibarStock: { [productId: string]: number } = {};
    currentProducts.forEach(p => { newMinibarStock[p.id] = p.standardStock; });

    const newRoom: Room = { id: roomId, building: building, minibarStock: newMinibarStock };
    await db.addRoom(newRoom);
    await loadData();
  };
  
  const handleDeleteRoom = async (roomId: string) => {
    if (window.confirm(`Are you sure you want to delete room ${roomId}?`)) {
        await db.deleteRoom(roomId);
        await loadData();
    }
  };
  
  const handleUpdateRoom = async (originalRoomId: string, newBuilding: number, newRoomId: string) => {
      if (!newRoomId || !newBuilding) return alert("Room and Building numbers are required.");
      if (originalRoomId !== newRoomId && rooms.some(r => r.id === newRoomId)) return alert("New room number already exists.");
      await db.updateRoom(originalRoomId, newBuilding, newRoomId);
      await loadData();
  };

  const handleDeleteBuilding = async (buildingNumber: number) => {
      if(window.confirm(`Are you sure you want to delete Building ${buildingNumber} and all its rooms?`)) {
          await db.deleteBuilding(buildingNumber);
          await loadData();
      }
  };
  
  const handleAddProduct = async (name: string, price: number, standardStock: number) => {
      if(!name || !price || standardStock < 0) return alert("Valid product name, price, and stock are required.");
      const newProduct: Product = { id: `prod-${Date.now()}`, name, price, standardStock };
      await db.addProduct(newProduct);

      const currentRooms = await db.getRooms();
      const updatePromises = currentRooms.map(room => {
          const newStock = { ...room.minibarStock, [newProduct.id]: newProduct.standardStock };
          return db.updateRoomStock(room.id, newStock);
      });
      await Promise.all(updatePromises);
      await loadData();
  };
  
  const handleUpdateProduct = async (updatedProduct: Product) => {
      await db.updateProduct(updatedProduct);
      await loadData();
  };

  const handleDeleteProduct = async (productId: string) => {
      if (window.confirm("Are you sure you want to delete this product?")) {
          await db.deleteProduct(productId);
          const currentRooms = await db.getRooms();
          const updatePromises = currentRooms.map(room => {
              const newStock = {...room.minibarStock};
              delete newStock[productId];
              return db.updateRoomStock(room.id, newStock);
          });
          await Promise.all(updatePromises);
          await loadData();
      }
  };

  // --- Admin Handlers ---
  const handleAddUser = async (username: string, passkey: string, roleId: string) => {
    if (!username || !passkey || !roleId) return alert("All fields are required.");
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return alert("Username already exists.");
    const newUser: User = { id: `user-${Date.now()}`, username, passkey, roleId };
    await db.addUser(newUser);
    await loadData();
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (users.some(u => u.id !== updatedUser.id && u.username.toLowerCase() === updatedUser.username.toLowerCase())) return alert("Username already exists.");
    await db.updateUser(updatedUser);
    await loadData();
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.id === userId) return alert("You cannot delete your own account.");
    if (window.confirm("Are you sure you want to delete this user?")) {
      await db.deleteUser(userId);
      await loadData();
    }
  };
  
  const handleAddRole = async (name: string, permissions: AppView[]) => {
    if (!name) return alert("Role name is required.");
    if (roles.some(r => r.name.toLowerCase() === name.toLowerCase())) return alert("Role name already exists.");
    const newRole: Role = { id: `role-${Date.now()}`, name, permissions };
    await db.addRole(newRole);
    await loadData();
  };
  
  const handleUpdateRole = async (updatedRole: Role) => {
    if (roles.some(r => r.id !== updatedRole.id && r.name.toLowerCase() === updatedRole.name.toLowerCase())) return alert("Role name already exists.");
    await db.updateRole(updatedRole);
    await loadData();
  };
  
  const handleDeleteRole = async (roleId: string) => {
    if (users.some(u => u.roleId === roleId)) return alert("Cannot delete role: it is currently assigned to one or more users.");
    if (window.confirm("Are you sure you want to delete this role?")) {
      await db.deleteRole(roleId);
      await loadData();
    }
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-700">Loading Database...</h1>
            <p className="text-slate-500">Please wait a moment.</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  const renderContent = () => {
    if (!currentView || !currentUserPermissions.includes(currentView)) {
      return (
        <div className="text-center p-12 bg-white rounded-lg shadow-md border border-slate-200 m-6">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-slate-500 mt-2">Your role does not have permission to view this page, or no default view is set.</p>
        </div>
      );
    }

    switch (currentView) {
      case AppView.Admin:
        return <AdminView 
          receipts={receipts}
          products={products}
          users={users}
          roles={roles}
          currentUser={currentUser}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onAddRole={handleAddRole}
          onUpdateRole={handleUpdateRole}
          onDeleteRole={handleDeleteRole}
        />;
      case AppView.FrontDesk:
        return <FrontDeskView receipts={receipts} />;
      case AppView.Management:
        return <ManagementView 
          rooms={rooms} 
          products={products}
          onAddRoom={handleAddRoom}
          onUpdateRoom={handleUpdateRoom}
          onDeleteRoom={handleDeleteRoom}
          onDeleteBuilding={handleDeleteBuilding}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
        />;
      case AppView.Rooms:
      default:
        if (selectedRoom) {
          return <RoomDetail room={selectedRoom} products={products} onBack={handleBackToGrid} onSubmit={handleReceiptSubmit} />;
        }
        return <RoomGrid rooms={rooms} onSelectRoom={handleSelectRoom} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {currentView && <Header currentView={currentView} setCurrentView={handleSetCurrentView} permissions={currentUserPermissions} />}
      <main className="flex-grow">
        {renderContent()}
      </main>
      {lastReceipt && <ReceiptModal receipt={lastReceipt} onClose={() => setLastReceipt(null)} />}
    </div>
  );
};

export default App;
