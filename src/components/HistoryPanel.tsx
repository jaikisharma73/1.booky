"use client";

import React from "react";
import { useApp, VEHICLE_DETAILS } from "../context/AppContext";
import { X, Calendar, MapPin, Star, History, Trash2, ArrowRight } from "lucide-react";

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
  const { rideHistory, setRideHistory } = useApp();

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your ride history?")) {
      setRideHistory([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[380px] bg-slate-950/95 backdrop-blur-md border-l border-white/10 z-50 shadow-2xl flex flex-col panel-right-enter">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-400" />
          <h3 className="font-extrabold text-base text-slate-200">Trip History</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-white/5 font-semibold text-slate-400">
            {rideHistory.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {rideHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all"
              title="Clear all history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
        {rideHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
            <div className="w-12 h-12 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center text-slate-500">
              <History className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-300">No Trips Found</span>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                You haven't completed any trips on VBooky yet. Go back to passenger mode and book your first ride!
              </p>
            </div>
          </div>
        ) : (
          rideHistory.map((trip) => {
            const vehicle = VEHICLE_DETAILS[trip.vehicleType];
            const isCancelled = trip.status === "cancelled";

            return (
              <div
                key={trip.id}
                className="bg-slate-900/40 border border-white/5 hover:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 transition-all relative overflow-hidden"
              >
                {/* Trip Top Row details */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-200 capitalize">
                        {vehicle ? vehicle.name : "Trip"}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isCancelled
                            ? "bg-red-950/40 border border-red-500/20 text-red-400"
                            : "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {trip.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      ID: #{trip.id.replace("r_", "")} • {trip.createdAt}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-200">
                      ₹{trip.fare}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {trip.distance} km
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/5"></div>

                {/* Routing nodes details */}
                <div className="flex flex-col gap-2 text-[11px] relative pl-4">
                  <div className="absolute left-[5px] top-1.5 bottom-1.5 w-[1px] bg-slate-800"></div>

                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></span>
                    <span className="text-slate-300 truncate font-medium">{trip.pickup.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span className="text-slate-300 truncate font-medium">{trip.destination.name}</span>
                  </div>
                </div>

                {/* Bottom rating & metadata */}
                {!isCancelled && (
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] text-slate-400">
                    {trip.driver ? (
                      <span className="truncate">Driver: {trip.driver.name}</span>
                    ) : (
                      <span>VBooky Partner</span>
                    )}
                    <div className="flex items-center gap-0.5 font-bold text-yellow-400">
                      {Array.from({ length: trip.driverRating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
