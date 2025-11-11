import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Room, Product } from '../types';
import { BuildingIcon, PlusIcon, PencilIcon, TrashIcon, CloseIcon, BoxIcon } from './Icons';
import { uploadProductImage, deleteProductImage } from '../lib/db';

// Helper function to get the correct API base URL for images
const getImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return '';
    
    // If imageUrl already starts with http, return as is
    if (imageUrl.startsWith('http')) {
        return imageUrl;
    }
    
    // Otherwise, construct the URL based on the current host
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    
    // If accessing via IP (not localhost), use the same IP with API port
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
        return `http://${currentHost}:3001${imageUrl}`;
    }
    
    // Default for local development
    return `http://localhost:3001${imageUrl}`;
};

// --- Sub-View Types ---
type ManagementSubView = 'main' | 'rooms' | 'products';

// --- Prop Types ---
interface ManagementViewProps {
  rooms: Room[];
  products: Product[];
  onAddRoom: (building: number, roomId: string) => void;
  onUpdateRoom: (originalRoomId: string, newBuilding: number, newRoomId: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onDeleteBuilding: (buildingNumber: number) => void;
  onAddProduct: (name: string, price: number, standardStock: number, imageUrl?: string) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRemoveProductImage: (productId: string) => void;
}

// --- Helper Components ---
const ManagementSection: React.FC<{title: string, buttonLabel: string, onButtonClick: () => void, children: React.ReactNode}> = ({ title, buttonLabel, onButtonClick, children }) => (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-slate-200">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-700">{title}</h2>
            <button onClick={onButtonClick} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow">
                <PlusIcon className="text-xl" />
                {buttonLabel}
            </button>
        </div>
        {children}
    </div>
);

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


// --- Main Component ---
export const ManagementView: React.FC<ManagementViewProps> = (props) => {
    const { rooms, products, onAddRoom, onUpdateRoom, onDeleteRoom, onDeleteBuilding, onAddProduct, onUpdateProduct, onDeleteProduct, onRemoveProductImage } = props;

    // --- State for Modals and Forms ---
    const [subView, setSubView] = useState<ManagementSubView>('main');
    const [isRoomModalOpen, setRoomModalOpen] = useState(false);
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    
    // --- Room Form State ---
    const [roomId, setRoomId] = useState('');
    const [building, setBuilding] = useState('');

    // --- Product Form State ---
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productStock, setProductStock] = useState('');
    const [productImage, setProductImage] = useState<File | null>(null);
    const [productImageUrl, setProductImageUrl] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploadMessage, setUploadMessage] = useState<string>('');
    const [showUploadMessage, setShowUploadMessage] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Effects to pre-fill forms when editing ---
    useEffect(() => {
        if (editingRoom) {
            setRoomId(editingRoom.id);
            setBuilding(String(editingRoom.building));
            setRoomModalOpen(true);
        }
    }, [editingRoom]);
    
    useEffect(() => {
        if (editingProduct) {
            setProductName(editingProduct.name);
            setProductPrice(String(editingProduct.price));
            setProductStock(String(editingProduct.standardStock));
            setProductImageUrl(editingProduct.imageUrl || '');
            setImagePreview(editingProduct.imageUrl ? getImageUrl(editingProduct.imageUrl) : '');
            setProductModalOpen(true);
        }
    }, [editingProduct]);

    // --- Modal close handlers (reset state) ---
    const closeRoomModal = () => {
        setRoomModalOpen(false);
        setEditingRoom(null);
        setRoomId('');
        setBuilding('');
    };

    const closeProductModal = () => {
        setProductModalOpen(false);
        setEditingProduct(null);
        setProductName('');
        setProductPrice('');
        setProductStock('');
        setProductImage(null);
        setProductImageUrl('');
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // --- Form submit handlers ---
    const handleRoomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const buildingNum = parseInt(building, 10);
        if (editingRoom) {
            onUpdateRoom(editingRoom.id, buildingNum, roomId);
        } else {
            onAddRoom(buildingNum, roomId);
        }
        closeRoomModal();
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(productPrice);
        const stockNum = parseInt(productStock, 10);
        
        let imageUrl = productImageUrl;
        
        // Upload new image if one was selected
        if (productImage) {
            try {
                console.log('Uploading image for product:', productName, 'File:', productImage.name);
                imageUrl = await uploadProductImage(productImage);
                console.log('Image upload successful:', imageUrl);
                showUploadStatus('Image uploaded successfully!', true);
            } catch (error) {
                console.error('Error uploading image:', error);
                showUploadStatus(`Upload failed: ${error.message || 'Unknown error'}`, false);
                return;
            }
        }
        
        if (editingProduct) {
            onUpdateProduct({ ...editingProduct, name: productName, price: priceNum, standardStock: stockNum, imageUrl });
        } else {
            onAddProduct(productName, priceNum, stockNum, imageUrl);
        }
        closeProductModal();
    };

    const showUploadStatus = (message: string, isSuccess: boolean) => {
        setUploadMessage(message);
        setShowUploadMessage(true);
        setTimeout(() => {
            setShowUploadMessage(false);
        }, 3000);
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProductImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = async (productId: string, productName: string) => {
        if (window.confirm(`Are you sure you want to remove the image for ${productName}?`)) {
            try {
                await deleteProductImage(productId);
                onRemoveProductImage(productId);
                showUploadStatus('Image removed successfully!', true);
            } catch (error) {
                console.error('Error removing image:', error);
                showUploadStatus(`Failed to remove image: ${error.message || 'Unknown error'}`, false);
            }
        }
    };

    // FIX: Explicitly type the accumulator in the reduce function to prevent incorrect type inference which was causing a downstream error.
    const roomsByBuilding = useMemo(() => rooms.reduce((acc: { [key: number]: Room[] }, room) => {
        (acc[room.building] = acc[room.building] || []).push(room);
        return acc;
    }, {} as { [key: number]: Room[] }), [rooms]);


    // --- Sub-View Render Functions ---
    const renderMain = () => (
        <>
          <h1 className="text-3xl font-bold text-slate-800">Management</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <button onClick={() => setSubView('rooms')} className="group text-left p-6 bg-white rounded-xl shadow-lg border border-slate-200 hover:border-sky-500 hover:shadow-sky-200 transition-all duration-300">
                  <BuildingIcon className="text-5xl text-sky-500 mb-4 group-hover:scale-110 transition-transform"/>
                  <h2 className="text-2xl font-bold text-slate-800">Manage Hotel Layout</h2>
                  <p className="text-slate-500 mt-1">Add, edit, or remove buildings and rooms.</p>
              </button>
              <button onClick={() => setSubView('products')} className="group text-left p-6 bg-white rounded-xl shadow-lg border border-slate-200 hover:border-sky-500 hover:shadow-sky-200 transition-all duration-300">
                  <BoxIcon className="text-5xl text-sky-500 mb-4 group-hover:scale-110 transition-transform"/>
                  <h2 className="text-2xl font-bold text-slate-800">Manage Minibar Products</h2>
                  <p className="text-slate-500 mt-1">Update the product catalog, prices, and stock levels.</p>
              </button>
          </div>
        </>
    );

    const renderRoomsManagement = () => (
        <>
            <button onClick={() => setSubView('main')} className="text-sky-600 hover:text-sky-800 font-semibold mb-2">&larr; Back to Management</button>
            <ManagementSection title="Manage Hotel Layout" buttonLabel="Add New Room" onButtonClick={() => setRoomModalOpen(true)}>
                <div className="space-y-6">
                    {Object.entries(roomsByBuilding).length > 0 ? Object.entries(roomsByBuilding).map(([bld, bldRooms]) => (
                        <div key={bld} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xl font-bold text-slate-600 flex items-center gap-2">
                                    <BuildingIcon className="text-2xl text-sky-500" />
                                    Building {bld}
                                </h3>
                                <button onClick={() => onDeleteBuilding(Number(bld))} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"><TrashIcon className="text-xl"/></button>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {(bldRooms as Room[]).map(room => (
                                    <li key={room.id} className="flex items-center justify-between py-2">
                                        <span className="font-semibold text-slate-700">Room {room.id}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setEditingRoom(room)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><PencilIcon className="text-xl"/></button>
                                            <button onClick={() => onDeleteRoom(room.id)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><TrashIcon className="text-xl"/></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )) : <p className="text-slate-500 text-center py-8">No rooms have been added yet.</p>}
                </div>
            </ManagementSection>
        </>
    );

    const renderProductsManagement = () => (
         <>
            <button onClick={() => setSubView('main')} className="text-sky-600 hover:text-sky-800 font-semibold mb-2">&larr; Back to Management</button>
            <ManagementSection title="Manage Minibar Products" buttonLabel="Add New Product" onButtonClick={() => setProductModalOpen(true)}>
                <div className="space-y-2">
                    {products.length > 0 ? products.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {product.imageUrl ? (
                                        <>
                                            <img
                                                src={getImageUrl(product.imageUrl)}
                                                alt={product.name}
                                                className="w-12 h-12 object-cover rounded-md"
                                                onError={(e) => {
                                                    console.error('Product image failed to load:', product.imageUrl);
                                                    e.currentTarget.src = '';
                                                }}
                                            />
                                            <button
                                                onClick={() => handleRemoveImage(product.id, product.name)}
                                                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                title="Remove image"
                                            >
                                                <CloseIcon className="text-xs" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-12 h-12 bg-slate-200 rounded-md flex items-center justify-center">
                                            <i className="fa-solid fa-image text-xl text-slate-400" aria-hidden="true"></i>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{product.name}</p>
                                    <p className="text-sm text-slate-500">${product.price.toFixed(2)} &bull; Standard Stock: {product.standardStock}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingProduct(product)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"><PencilIcon className="text-xl"/></button>
                                <button onClick={() => onDeleteProduct(product.id)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"><TrashIcon className="text-xl"/></button>
                            </div>
                        </div>
                    )) : <p className="text-slate-500 text-center py-8">No products have been added yet.</p>}
                </div>
            </ManagementSection>
        </>
    );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
        {subView === 'main' && renderMain()}
        {subView === 'rooms' && renderRoomsManagement()}
        {subView === 'products' && renderProductsManagement()}


        {/* --- Modals --- */}
        <FormModal title={editingRoom ? "Edit Room" : "Add Room"} isOpen={isRoomModalOpen} onClose={closeRoomModal}>
            <form onSubmit={handleRoomSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="roomId" className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                        <input type="text" id="roomId" value={roomId} onChange={e => setRoomId(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                     <div>
                        <label htmlFor="building" className="block text-sm font-medium text-slate-700 mb-1">Building Number</label>
                        <input type="number" id="building" value={building} onChange={e => setBuilding(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                     <button type="submit" className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow">{editingRoom ? "Save Changes" : "Add Room"}</button>
                </div>
            </form>
        </FormModal>

        <FormModal title={editingProduct ? "Edit Product" : "Add Product"} isOpen={isProductModalOpen} onClose={closeProductModal}>
             <form onSubmit={handleProductSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="productName" className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                        <input type="text" id="productName" value={productName} onChange={e => setProductName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                     <div>
                        <label htmlFor="productPrice" className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                        <input type="number" step="0.01" id="productPrice" value={productPrice} onChange={e => setProductPrice(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                     <div>
                        <label htmlFor="productStock" className="block text-sm font-medium text-slate-700 mb-1">Standard Stock Quantity</label>
                        <input type="number" id="productStock" value={productStock} onChange={e => setProductStock(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                    <div>
                        <label htmlFor="productImage" className="block text-sm font-medium text-slate-700 mb-1">Product Image</label>
                        <input
                            type="file"
                            id="productImage"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        />
                        {showUploadMessage && (
                            <div className={`mt-2 p-2 rounded text-sm ${uploadMessage.includes('failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {uploadMessage}
                            </div>
                        )}
                        {imagePreview && (
                            <div className="mt-2">
                                <p className="text-xs text-slate-500 mb-1">Image preview:</p>
                                <img
                                    src={imagePreview}
                                    alt="Product preview"
                                    className="w-24 h-24 object-cover rounded-md border border-slate-300"
                                    onError={(e) => {
                                        console.error('Image preview failed to load:', imagePreview);
                                        e.currentTarget.src = '';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                     <button type="submit" className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow">{editingProduct ? "Save Changes" : "Add Product"}</button>
                </div>
            </form>
        </FormModal>
    </div>
  );
};
