
import React from 'react';
import type { Receipt } from '../types';
import { CloseIcon } from './Icons';

interface ReceiptModalProps {
  receipt: Receipt;
  onClose: () => void;
}

const ReceiptSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div>
        <h3 className="text-lg font-semibold text-slate-600 border-b-2 border-slate-200 pb-2 mb-3">{title}</h3>
        {children}
    </div>
);

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <div className="p-6 sticky top-0 bg-white border-b border-slate-200 z-10">
            <h2 className="text-2xl font-bold text-slate-800">Receipt for Room {receipt.roomId}</h2>
            <p className="text-sm text-slate-500">{new Date(receipt.date).toLocaleString()}</p>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                <CloseIcon className="text-2xl" />
            </button>
        </div>

        <div className="p-6 space-y-6">
            <ReceiptSection title="Consumed Items (For Guest Bill)">
                {receipt.consumedItems.length > 0 ? (
                    <ul className="space-y-2">
                    {receipt.consumedItems.map(item => (
                        <li key={item.productId} className="flex justify-between items-center text-slate-700">
                        <span>{item.productName} <span className="text-slate-500">x {item.quantity}</span></span>
                        <span className="font-mono">${item.total.toFixed(2)}</span>
                        </li>
                    ))}
                    <li className="flex justify-between items-center text-slate-900 font-bold pt-3 border-t border-slate-200">
                        <span>Total Bill</span>
                        <span className="font-mono text-lg">${receipt.totalBill.toFixed(2)}</span>
                    </li>
                    </ul>
                ) : (
                    <p className="text-slate-500 italic">No items were consumed.</p>
                )}
            </ReceiptSection>

            <ReceiptSection title="Replenishment List (For Housekeeping)">
                 {receipt.replenishmentItems.length > 0 ? (
                    <ul className="space-y-2">
                    {receipt.replenishmentItems.map(item => (
                        <li key={item.productId} className="flex justify-between items-center text-slate-700">
                        <span>{item.productName}</span>
                        <span className="font-semibold">x {item.quantity}</span>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 italic">Minibar is fully stocked.</p>
                )}
            </ReceiptSection>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 sticky bottom-0">
             <button onClick={onClose} className="w-full bg-slate-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-700 transition-colors">
                Close
            </button>
        </div>

      </div>
    </div>
  );
};
