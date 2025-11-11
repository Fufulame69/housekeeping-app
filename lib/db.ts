import type { Product, Room, User, Role, Receipt } from '../types';

// Determine API base URL based on current host
const getApiBaseUrl = () => {
  // Use the same host as the frontend for the API
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  
  // If accessing via IP (not localhost), use the same IP with API port
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return `http://${currentHost}:3001/api`;
  }
  // Default for local development
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// --- Data Fetching ---
export const getProducts = async (): Promise<Product[]> => {
    return apiCall('/products');
};

export const getUsers = async (): Promise<User[]> => {
    return apiCall('/users');
};

export const getReceipts = async (): Promise<Receipt[]> => {
    return apiCall('/receipts');
};

export const getRooms = async (): Promise<Room[]> => {
    return apiCall('/rooms');
};

export const getRoles = async (): Promise<Role[]> => {
    return apiCall('/roles');
};

// --- Data Modification ---

// Products
export const addProduct = async (product: Product) => {
    return apiCall('/products', {
        method: 'POST',
        body: JSON.stringify(product),
    });
};

export const updateProduct = async (product: Product) => {
    return apiCall(`/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            name: product.name,
            price: product.price,
            standardStock: product.standardStock,
            imageUrl: product.imageUrl,
        }),
    });
};

export const deleteProduct = async (productId: string) => {
    return apiCall(`/products/${productId}`, {
        method: 'DELETE',
    });
};

// Image upload
export const uploadProductImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    console.log('Uploading image to:', `${API_BASE_URL}/upload-product-image`);
    const response = await fetch(`${API_BASE_URL}/upload-product-image`, {
        method: 'POST',
        body: formData,
    });
    
    if (!response.ok) {
        const error = await response.json();
        console.error('Upload error:', error);
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Upload result:', result);
    return result.imageUrl;
};

// Image deletion
export const deleteProductImage = async (productId: string): Promise<void> => {
    return apiCall(`/product-image/${productId}`, {
        method: 'DELETE',
    });
};

// Rooms
export const addRoom = async (room: Room) => {
    return apiCall('/rooms', {
        method: 'POST',
        body: JSON.stringify(room),
    });
};

export const updateRoom = async (originalRoomId: string, newBuilding: number, newRoomId: string) => {
    return apiCall(`/rooms/${originalRoomId}`, {
        method: 'PUT',
        body: JSON.stringify({
            newBuilding,
            newRoomId,
        }),
    });
};

export const deleteRoom = async (roomId: string) => {
    return apiCall(`/rooms/${roomId}`, {
        method: 'DELETE',
    });
};

export const deleteBuilding = async (buildingNumber: number) => {
    return apiCall(`/buildings/${buildingNumber}`, {
        method: 'DELETE',
    });
};

export const updateRoomStock = async (roomId: string, newStock: { [productId: string]: number }) => {
    return apiCall(`/rooms/${roomId}/stock`, {
        method: 'PUT',
        body: JSON.stringify({ newStock }),
    });
};

// Users
export const addUser = async (user: User) => {
    return apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(user),
    });
};

export const updateUser = async (user: User) => {
    return apiCall(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            username: user.username,
            passkey: user.passkey,
            roleId: user.roleId,
        }),
    });
};

export const deleteUser = async (userId: string) => {
    return apiCall(`/users/${userId}`, {
        method: 'DELETE',
    });
};

// Roles
export const addRole = async (role: Role) => {
    return apiCall('/roles', {
        method: 'POST',
        body: JSON.stringify(role),
    });
};

export const updateRole = async (role: Role) => {
    return apiCall(`/roles/${role.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            name: role.name,
            permissions: role.permissions,
        }),
    });
};

export const deleteRole = async (roleId: string) => {
    return apiCall(`/roles/${roleId}`, {
        method: 'DELETE',
    });
};

// Receipts
export const addReceipt = async (receipt: Receipt) => {
    return apiCall('/receipts', {
        method: 'POST',
        body: JSON.stringify(receipt),
    });
};

// Initialize function (now just a placeholder since we don't need to initialize sql.js)
export async function init() {
    // No initialization needed for the API-based approach
    // The server handles database initialization
    console.log('Database API initialized');
}
