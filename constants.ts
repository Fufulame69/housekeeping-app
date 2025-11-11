
import type { Product, Room, User, Role } from './types';
import { AppView } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'prod-01', name: 'Sparkling Water', price: 4.50, standardStock: 4 },
  { id: 'prod-02', name: 'Still Water', price: 4.00, standardStock: 4 },
  { id: 'prod-03', name: 'Cola', price: 3.50, standardStock: 3 },
  { id: 'prod-04', name: 'Orange Juice', price: 5.00, standardStock: 2 },
  { id: 'prod-05', name: 'Potato Chips', price: 6.00, standardStock: 2 },
  { id: 'prod-06', name: 'Chocolate Bar', price: 5.50, standardStock: 2 },
  { id: 'prod-07', name: 'Pretzels', price: 4.00, standardStock: 2 },
  { id: 'prod-08', name: 'Red Wine (187ml)', price: 12.00, standardStock: 1 },
  { id: 'prod-09', name: 'White Wine (187ml)', price: 12.00, standardStock: 1 },
  { id: 'prod-10', name: 'Gummy Bears', price: 4.50, standardStock: 2 },
];

const createInitialStock = () => {
  const stock: { [productId: string]: number } = {};
  INITIAL_PRODUCTS.forEach(p => {
    stock[p.id] = p.standardStock;
  });
  return stock;
};

const createRandomizedStock = () => {
    const stock: { [productId: string]: number } = {};
    INITIAL_PRODUCTS.forEach(p => {
        stock[p.id] = Math.floor(Math.random() * (p.standardStock + 1));
    });
    return stock;
}

export const INITIAL_ROOMS: Room[] = [
  // Building 1
  { id: '101', building: 1, minibarStock: createInitialStock() },
  { id: '102', building: 1, minibarStock: createRandomizedStock() },
  { id: '103', building: 1, minibarStock: createInitialStock() },
  { id: '104', building: 1, minibarStock: createRandomizedStock() },
  { id: '105', building: 1, minibarStock: createInitialStock() },

  // Building 2
  { id: '201', building: 2, minibarStock: createInitialStock() },
  { id: '202', building: 2, minibarStock: createInitialStock() },
  { id: '203', building: 2, minibarStock: createRandomizedStock() },
  { id: '204', building: 2, minibarStock: createInitialStock() },
  { id: '205', building: 2, minibarStock: createRandomizedStock() },
    
  // Building 3
  { id: '301', building: 3, minibarStock: createRandomizedStock() },
  { id: '302', building: 3, minibarStock: createInitialStock() },
  { id: '303', building: 3, minibarStock: createRandomizedStock() },
  { id: '304', building: 3, minibarStock: createRandomizedStock() },
  { id: '305', building: 3, minibarStock: createInitialStock() },
];

export const INITIAL_ROLES: Role[] = [
    { id: 'role-admin', name: 'Admin', permissions: [AppView.Rooms, AppView.FrontDesk, AppView.Management, AppView.Admin] },
    { id: 'role-manager', name: 'Manager', permissions: [AppView.Rooms, AppView.FrontDesk, AppView.Management] },
    { id: 'role-frontdesk', name: 'Front Desk', permissions: [AppView.FrontDesk] },
    { id: 'role-housekeeping', name: 'Housekeeping', permissions: [AppView.Rooms] },
];

export const INITIAL_USERS: User[] = [
    { id: 'user-01', username: 'admin', passkey: '1234', roleId: 'role-admin' },
    { id: 'user-02', username: 'manager', passkey: '1111', roleId: 'role-manager' },
    { id: 'user-03', username: 'clerk', passkey: '2222', roleId: 'role-frontdesk' },
    { id: 'user-04', username: 'staff', passkey: '3333', roleId: 'role-housekeeping' },
];
