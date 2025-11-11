
import React, { useState, useMemo } from 'react';
import type { Room, Receipt, ConsumedItem, ReplenishmentItem, Product } from '../types';
import { PlusIcon, MinusIcon, ReceiptIcon } from './Icons';

interface RoomDetailProps {
  room: Room;
  products: Product[];
  onBack: () => void;
  onSubmit: (receipt: Receipt) => void;
}

const ProductImagePlaceholder: React.FC = () => (
    <div className="w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center">
        <i className="fa-solid fa-image text-4xl text-slate-400" aria-hidden="true"></i>
    </div>
);

export const RoomDetail: React.FC<RoomDetailProps> = ({ room, products, onBack, onSubmit }) => {
  const [consumedCount, setConsumedCount] = useState<{ [productId: string]: number }>({});

  const handleIncrement = (productId: string) => {
    const currentStock = room.minibarStock[productId] || 0;
    const currentlyConsumed = consumedCount[productId] || 0;
    if (currentlyConsumed < currentStock) {
      setConsumedCount(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    }
  };

  const handleDecrement = (productId: string) => {
    setConsumedCount(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) - 1),
    }));
  };
  
  // FIX: Moved receipt calculation logic into useMemo to make it available in the render scope for the disabled check.
  const { consumedItems, replenishmentItems, totalBill } = useMemo(() => {
    const consumedItems: ConsumedItem[] = [];
    const replenishmentItems: ReplenishmentItem[] = [];
    let totalBill = 0;

    products.forEach(product => {
        const consumedQty = consumedCount[product.id] || 0;
        if (consumedQty > 0) {
            const itemTotal = consumedQty * product.price;
            consumedItems.push({
                productId: product.id,
                productName: product.name,
                quantity: consumedQty,
                pricePerItem: product.price,
                total: itemTotal,
            });
            totalBill += itemTotal;
        }

        const initialStock = room.minibarStock[product.id] || 0;
        if(consumedQty > 0 || initialStock < product.standardStock) {
            const needed = product.standardStock - (initialStock - consumedQty);
            if (needed > 0) {
                 replenishmentItems.push({
                    productId: product.id,
                    productName: product.name,
                    quantity: needed,
                });
            }
        }
    });

    return { consumedItems, replenishmentItems, totalBill };
  }, [products, room, consumedCount]);

  const handleSubmit = () => {
    const newReceipt: Receipt = {
        id: `receipt-${Date.now()}-${room.id}`,
        roomId: room.id,
        building: room.building,
        date: new Date().toISOString(),
        consumedItems,
        replenishmentItems,
        totalBill,
    };
    onSubmit(newReceipt);
  };

  const totalConsumedItems = Object.values(consumedCount).reduce((sum: number, count: number) => sum + count, 0);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
            <button onClick={onBack} className="text-sky-600 hover:text-sky-800 font-semibold mb-1">&larr; Back to Rooms</button>
            <h1 className="text-3xl font-bold text-slate-800">Room {room.id} - Minibar</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <ul className="divide-y divide-slate-200">
          {products.map(product => {
            const availableStock = room.minibarStock[product.id] || 0;
            const consumed = consumedCount[product.id] || 0;
            return (
              <li key={product.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <ProductImagePlaceholder />
                    <div className="flex-grow">
                        <p className="font-semibold text-slate-800">{product.name}</p>
                        <p className="text-sm text-slate-500">${product.price.toFixed(2)} &bull; In Stock: <span className="font-medium text-slate-700">{availableStock - consumed}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg">
                  <button
                    onClick={() => handleDecrement(product.id)}
                    disabled={consumed === 0}
                    className="p-2 rounded-full bg-white text-slate-600 hover:bg-red-100 hover:text-red-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <MinusIcon className="text-xl" />
                  </button>
                  <span className="font-bold text-lg text-slate-800 w-8 text-center">{consumed}</span>
                  <button
                    onClick={() => handleIncrement(product.id)}
                    disabled={consumed >= availableStock}
                    className="p-2 rounded-full bg-white text-slate-600 hover:bg-green-100 hover:text-green-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlusIcon className="text-xl" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sticky bottom-0 left-0 right-0 p-4 bg-slate-100/80 backdrop-blur-sm border-t border-slate-200">
        <div className="container mx-auto">
            <button
                onClick={handleSubmit}
                disabled={totalConsumedItems === 0 && replenishmentItems.length === 0}
                className="w-full bg-sky-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-sky-700 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
                <ReceiptIcon className="text-2xl" />
                Generate Receipt &amp; Restock List
            </button>
        </div>
      </div>
    </div>
  );
};
