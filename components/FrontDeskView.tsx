
import React, { useState, useMemo } from 'react';
import type { Receipt } from '../types';

interface FrontDeskViewProps {
  receipts: Receipt[];
}

const ReceiptCard: React.FC<{ receipt: Receipt }> = ({ receipt }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                    <p className="font-bold text-lg text-slate-800">Room {receipt.roomId}</p>
                    <p className="text-sm text-slate-500">{new Date(receipt.date).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="font-mono text-lg font-semibold text-sky-600">${receipt.totalBill.toFixed(2)}</p>
                    <span className="text-sm text-slate-500">{receipt.consumedItems.length} item(s) consumed</span>
                </div>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-slate-700 mb-2">Billed to Guest</h4>
                             {receipt.consumedItems.length > 0 ? (
                                <ul className="text-sm space-y-1">
                                    {receipt.consumedItems.map(item => (
                                        <li key={item.productId} className="flex justify-between">
                                            <span>{item.productName} x {item.quantity}</span>
                                            <span className="font-mono">${item.total.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm italic text-slate-500">No items.</p>}
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-700 mb-2">To Replenish</h4>
                             {receipt.replenishmentItems.length > 0 ? (
                                <ul className="text-sm space-y-1">
                                    {receipt.replenishmentItems.map(item => (
                                        <li key={item.productId} className="flex justify-between">
                                            <span>{item.productName}</span>
                                            <span className="font-semibold">x {item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm italic text-slate-500">No items.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const FrontDeskView: React.FC<FrontDeskViewProps> = ({ receipts }) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterRoom, setFilterRoom] = useState('');

  const filteredReceipts = useMemo(() => {
    return receipts
      .filter(r => {
        if (!filterDate) return true;
        return new Date(r.date).toLocaleDateString() === new Date(filterDate + 'T00:00:00').toLocaleDateString();
      })
      .filter(r => {
        if (!filterRoom) return true;
        return r.roomId.includes(filterRoom);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [receipts, filterDate, filterRoom]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Front Desk - Receipts</h1>
      
      <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="dateFilter" className="block text-sm font-medium text-slate-700 mb-1">Filter by Date</label>
          <input
            type="date"
            id="dateFilter"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="roomFilter" className="block text-sm font-medium text-slate-700 mb-1">Filter by Room</label>
          <input
            type="text"
            id="roomFilter"
            placeholder="e.g., 102"
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
         <div className="flex items-end">
            <button onClick={() => {setFilterDate(''); setFilterRoom('')}} className="w-full md:w-auto px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors">
                Clear Filters
            </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredReceipts.length > 0 ? (
          filteredReceipts.map(receipt => <ReceiptCard key={receipt.id} receipt={receipt} />)
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-slate-200">
            <p className="text-slate-500">No receipts found for the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
