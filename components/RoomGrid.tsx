import React, { useState, useMemo } from 'react';
import type { Room } from '../types';
import { BuildingIcon } from './Icons';

interface RoomGridProps {
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
}

export const RoomGrid: React.FC<RoomGridProps> = ({ rooms, onSelectRoom }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRooms = useMemo(() => {
    if (!searchTerm.trim()) {
      return rooms;
    }
    const lowercasedFilter = searchTerm.toLowerCase().trim();
    return rooms.filter(room => 
      room.id.toLowerCase().includes(lowercasedFilter) || 
      String(room.building).includes(lowercasedFilter)
    );
  }, [rooms, searchTerm]);

  // FIX: Explicitly type the accumulator in the reduce function to prevent incorrect type inference which was causing a downstream error.
  // Re-group the filtered rooms by building
  const roomsByBuilding = filteredRooms.reduce((acc: { [key: string]: Room[] }, room) => {
    (acc[room.building] = acc[room.building] || []).push(room);
    return acc;
  }, {} as { [key: string]: Room[] });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-slate-200">
        <label htmlFor="roomSearch" className="block text-sm font-medium text-slate-700 mb-1">
            Search Rooms
        </label>
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <i className="fa-solid fa-magnifying-glass text-slate-400" aria-hidden="true"></i>
            </div>
            <input
                type="text"
                id="roomSearch"
                placeholder="Filter by room ID or building number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                aria-label="Search rooms by ID or building"
            />
        </div>
      </div>
      
      {Object.keys(roomsByBuilding).length > 0 ? (
        Object.entries(roomsByBuilding).map(([building, buildingRooms]) => (
          <div key={building} className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center gap-3">
              <BuildingIcon className="text-4xl text-sky-500" />
              Building {building}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3 md:gap-4">
              {buildingRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className="aspect-square flex flex-col justify-center items-center p-2 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-600 font-bold text-xl hover:bg-sky-100 hover:border-sky-400 hover:text-sky-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                >
                  <span>{room.id}</span>
                </button>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-slate-200">
            <p className="text-slate-500">No rooms match your search criteria.</p>
        </div>
      )}
    </div>
  );
};
