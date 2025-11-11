
export interface Product {
  id: string;
  name: string;
  price: number;
  standardStock: number;
  imageUrl?: string;
}

export interface Room {
  id: string;
  building: number;
  minibarStock: { [productId: string]: number };
}

export interface ConsumedItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerItem: number;
  total: number;
}

export interface ReplenishmentItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface Receipt {
  id: string;
  roomId: string;
  building: number;
  date: string;
  consumedItems: ConsumedItem[];
  replenishmentItems: ReplenishmentItem[];
  totalBill: number;
}

export enum AppView {
  Rooms = 'Rooms',
  FrontDesk = 'FrontDesk',
  Management = 'Management',
  Admin = 'Admin',
}

export interface User {
    id: string;
    username: string;
    passkey: string; // 4-digit string
    roleId: string;
}

export interface Role {
    id: string;
    name: string;
    permissions: AppView[];
}
