"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { X, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Check } from "lucide-react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { customerWallet, addFunds, transactions } = useApp();
  const [customAmount, setCustomAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddFunds = (amountVal: number) => {
    if (isNaN(amountVal) || amountVal <= 0) return;
    addFunds(amountVal);
    setCustomAmount("");
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 1500);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddFunds(parseFloat(customAmount));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel-heavy p-6 rounded-3xl border border-white/10 w-full max-w-md flex flex-col gap-4 shadow-2xl relative animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 text-left mb-2">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-200">VBooky Wallet</h3>
            <p className="text-xs text-slate-400">Add virtual funds & view your transaction logs</p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between shadow-md">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">
              Current Balance
            </span>
            <span className="text-2xl font-extrabold text-purple-400 block mt-1">
              ₹{customerWallet.toFixed(2)}
            </span>
          </div>
          <Wallet className="w-9 h-9 text-purple-400/20" />
        </div>

        {/* Add Funds form */}
        <form onSubmit={handleSubmitCustom} className="flex flex-col gap-3">
          <span className="text-xs text-slate-300 font-bold text-left block leading-none">
            Top Up Wallet
          </span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold font-mono">₹</span>
              <input
                type="number"
                placeholder="Enter custom amount..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-semibold glass-input rounded-xl focus:neon-border-purple"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95 flex items-center gap-1 shadow-md shadow-purple-600/25"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Quick preset increments */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[100, 200, 500, 1000].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => handleAddFunds(preset)}
                className="py-1.5 bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-purple-500/20 rounded-xl font-bold text-slate-300 transition-all active:scale-95"
              >
                +₹{preset}
              </button>
            ))}
          </div>
        </form>

        {showSuccess && (
          <div className="bg-emerald-950/30 border border-emerald-500/30 py-2 rounded-xl text-center flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold transition-all animate-scale-up">
            <Check className="w-4 h-4" />
            <span>Funds Credited Successfully!</span>
          </div>
        )}

        {/* Recent Transactions List */}
        <div className="flex flex-col gap-2 mt-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold text-left">
            Recent Ledger Activity
          </span>
          <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-2 max-h-40 overflow-y-auto flex flex-col gap-1">
            {transactions.length === 0 ? (
              <span className="text-[10px] text-slate-500 py-6 text-center">No transaction logs available</span>
            ) : (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/30 hover:bg-slate-900/60 border border-white/5 transition-all text-xs"
                >
                  <div className="flex items-center gap-2 text-left">
                    <div
                      className={`p-1.5 rounded-lg flex items-center justify-center ${
                        t.type === "credit"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {t.type === "credit" ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200 block truncate max-w-[170px] leading-tight">
                        {t.description}
                      </span>
                      <span className="text-[9px] text-slate-500 block leading-none mt-0.5">
                        {t.date}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-bold font-mono text-right ${
                      t.type === "credit" ? "text-emerald-400" : "text-slate-300"
                    }`}
                  >
                    {t.type === "credit" ? "+" : "-"}₹{t.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
