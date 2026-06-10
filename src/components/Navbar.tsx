"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Car, Wallet, Plus, History, User, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";

interface NavbarProps {
  onToggleHistory: () => void;
  onOpenWalletModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleHistory, onOpenWalletModal }) => {
  const { userPersona, setUserPersona, customerWallet, driverWallet, isDriverOnline, setDriverOnline } = useApp();

  return (
    <header className="glass-panel sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between shadow-lg">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 select-none">
        <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-purple-400 tracking-tight">
            VBooky
          </span>
          <span className="text-[10px] block font-medium text-purple-400 uppercase tracking-widest mt-[-2px]">
            Ride Platform
          </span>
        </div>
      </div>

      {/* Role Toggle Switch & Info */}
      <div className="flex items-center gap-6">
        {/* Persona Tabs */}
        <div className="bg-slate-950/60 p-1 rounded-xl border border-white/5 flex gap-1 items-center">
          <button
            onClick={() => setUserPersona("customer")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              userPersona === "customer"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/35"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Passenger
          </button>
          <button
            onClick={() => setUserPersona("driver")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              userPersona === "driver"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/35"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Driver Partner
          </button>
        </div>

        {/* Dynamic Context Stats */}
        <div className="flex items-center gap-4">
          {userPersona === "customer" ? (
            // Passenger Mode Wallet Panel
            <div className="flex items-center gap-2 bg-slate-900/50 hover:bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-white/5 transition-all">
              <Wallet className="w-4 h-4 text-purple-400" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-400 leading-none">Wallet Balance</span>
                <span className="text-sm font-bold text-slate-200">₹{customerWallet.toFixed(2)}</span>
              </div>
              <button
                onClick={onOpenWalletModal}
                className="ml-2 p-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-all shadow-md active:scale-95"
                title="Add Money"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            // Driver Mode Status & Earnings Panel
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900/50 px-3.5 py-1.5 rounded-xl border border-white/5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-slate-400 leading-none">Today's Earnings</span>
                  <span className="text-sm font-bold text-emerald-400">₹{driverWallet.toFixed(2)}</span>
                </div>
              </div>

              {/* Online/Offline Toggler */}
              <button
                onClick={() => setDriverOnline(!isDriverOnline)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all ${
                  isDriverOnline
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400 neon-border-green"
                    : "bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isDriverOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}></span>
                <span className="text-xs font-bold uppercase tracking-wider">{isDriverOnline ? "Online" : "Offline"}</span>
              </button>
            </div>
          )}

          {/* History Button */}
          <button
            onClick={onToggleHistory}
            className="p-2.5 bg-slate-950/40 border border-white/5 hover:border-purple-500/30 hover:bg-purple-950/20 text-slate-300 hover:text-purple-400 rounded-xl transition-all shadow-md flex items-center justify-center"
            title="Trip History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Profile Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 bg-slate-800 flex items-center justify-center">
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userPersona === "customer" ? "passenger1" : "driverpartner"}`}
                alt="Profile Avatar"
                className="w-8 h-8 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
