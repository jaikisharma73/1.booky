"use client";

import React, { useState } from "react";
import { AppProvider, useApp } from "../context/AppContext";
import { Navbar } from "../components/Navbar";
import { Map } from "../components/Map";
import { BookingPanel } from "../components/BookingPanel";
import { DriverPanel } from "../components/DriverPanel";
import { HistoryPanel } from "../components/HistoryPanel";
import { WalletModal } from "../components/WalletModal";

function Dashboard() {
  const { userPersona } = useApp();
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isWalletOpen, setWalletOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070b13] overflow-hidden select-none">
      {/* Sleek Glass Navbar */}
      <Navbar
        onToggleHistory={() => setHistoryOpen(!isHistoryOpen)}
        onOpenWalletModal={() => setWalletOpen(true)}
      />

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col-reverse md:flex-row relative overflow-hidden">
        {/* Sidebar Controls (Passenger / Driver) */}
        <aside className="w-full h-[320px] md:h-full md:w-[380px] md:min-w-[380px] flex-shrink-0 z-20 flex flex-col relative shadow-2xl">
          {userPersona === "customer" ? <BookingPanel /> : <DriverPanel />}
        </aside>

        {/* Dynamic Vector Simulation Canvas Map */}
        <section className="flex-1 h-full w-full relative z-10">
          <Map />
        </section>
      </main>

      {/* History Drawer Slider */}
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setHistoryOpen(false)} />

      {/* Wallet Management Overlay */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
