
import React from 'react';
import type { Room } from '../types';
import { BuildingIcon } from './Icons';

interface RoomGridProps {
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
}

export const RoomGrid: React.FC<RoomGridProps> = ({ rooms, onSelectRoom }) => {
  // Fix: Changed key type to string for better type inference with Object.entries.
  const roomsByBuilding = rooms.reduce((acc, room) => {
    (acc[room.building] = acc[room.building] || []).push(room);
    return acc;
  }, {} as { [key: string]: Room[] });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      {Object.entries(roomsByBuilding).map(([building, buildingRooms]) => (
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
      ))}
    </div>
  );
};
