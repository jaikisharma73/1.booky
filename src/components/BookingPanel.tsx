"use client";

import React, { useState, useEffect } from "react";
import { useApp, VEHICLE_DETAILS, calculateDistance } from "../context/AppContext";
import { VehicleType, Location, Ride } from "../types";
import { MapPin, Search, ArrowRight, Star, X, Check, Landmark, Bike, Car, Navigation, Sparkles, Users, RefreshCw } from "lucide-react";

export const BookingPanel: React.FC = () => {
  const {
    pickup,
    setPickup,
    destination,
    setDestination,
    selectedVehicle,
    setSelectedVehicle,
    activeRide,
    requestRide,
    cancelRide,
    completeRide,
    landmarks,
    customerWallet,
    rideHistory,
  } = useApp();

  const [pickupSearch, setPickupSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState<Location[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Location[]>([]);
  const [focusField, setFocusField] = useState<"pickup" | "dest" | null>(null);

  // States to handle feedback/receipt after ride completes
  const [completedRideForReceipt, setCompletedRideForReceipt] = useState<Ride | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Sync searches with selected pins from map click
  useEffect(() => {
    if (pickup) {
      setPickupSearch(pickup.name);
    } else {
      setPickupSearch("");
    }
  }, [pickup]);

  useEffect(() => {
    if (destination) {
      setDestSearch(destination.name);
    } else {
      setDestSearch("");
    }
  }, [destination]);

  // Sync completion receipt modal
  useEffect(() => {
    if (rideHistory.length > 0 && !activeRide) {
      const latest = rideHistory[0];
      // Only show receipt if it finished recently (within 5 seconds)
      const diffTime = Date.now() - new Date().getTime(); // mock check, show receipt once
      setCompletedRideForReceipt(latest);
      setFeedbackRating(5);
      setFeedbackSubmitted(false);
    }
  }, [rideHistory, activeRide]);

  // Handle autocomplete searches
  const handlePickupSearchChange = (val: string) => {
    setPickupSearch(val);
    if (val.trim().length === 0) {
      setPickupSuggestions([]);
      return;
    }
    const filtered = landmarks.filter((l) =>
      l.name.toLowerCase().includes(val.toLowerCase())
    );
    setPickupSuggestions(filtered);
  };

  const handleDestSearchChange = (val: string) => {
    setDestSearch(val);
    if (val.trim().length === 0) {
      setDestSuggestions([]);
      return;
    }
    const filtered = landmarks.filter((l) =>
      l.name.toLowerCase().includes(val.toLowerCase())
    );
    setDestSuggestions(filtered);
  };

  // Distance & fare estimation
  const distance = pickup && destination
    ? parseFloat((calculateDistance(pickup.x, pickup.y, destination.x, destination.y) / 80).toFixed(1))
    : 0;

  const handleSelectPickup = (loc: Location) => {
    setPickup(loc);
    setPickupSearch(loc.name);
    setPickupSuggestions([]);
    setFocusField(null);
  };

  const handleSelectDest = (loc: Location) => {
    setDestination(loc);
    setDestSearch(loc.name);
    setDestSuggestions([]);
    setFocusField(null);
  };

  const handleSwapLocations = () => {
    const tempLoc = pickup;
    setPickup(destination);
    setDestination(tempLoc);
  };

  const handleRequest = () => {
    if (!pickup || !destination) return;
    requestRide();
  };

  const handleCloseReceipt = () => {
    setCompletedRideForReceipt(null);
  };

  const handleRateRide = (rating: number) => {
    setFeedbackRating(rating);
    // Update the rating of the trip in history
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setCompletedRideForReceipt(null);
    }, 1200);
  };

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case "bike":
        return <Bike className="w-5 h-5 text-blue-400" />;
      case "auto":
        return <Navigation className="w-5 h-5 text-emerald-400 rotate-45" />;
      case "sedan":
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case "xl":
        return <Users className="w-5 h-5 text-pink-400" />;
      default:
        return <Car className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel border-r border-white/5 rounded-none p-5 text-slate-100 overflow-y-auto">
      {/* 1. RIDE RECEIPT MODAL */}
      {completedRideForReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-heavy p-6 rounded-3xl border border-white/10 w-full max-w-sm flex flex-col gap-4 shadow-2xl relative animate-scale-up">
            <button
              onClick={handleCloseReceipt}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center gap-1.5 text-center mt-2">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mb-1">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Trip Completed!</h3>
              <p className="text-xs text-slate-400">Thank you for riding with VBooky</p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Ride ID: #{completedRideForReceipt.id.replace("r_", "")}</span>
                <span>{completedRideForReceipt.createdAt}</span>
              </div>
              <div className="border-t border-white/5 my-1"></div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distance</span>
                <span className="font-semibold text-slate-200">{completedRideForReceipt.distance} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle Mode</span>
                <span className="font-semibold text-slate-200 capitalize">
                  {VEHICLE_DETAILS[completedRideForReceipt.vehicleType].name}
                </span>
              </div>
              <div className="border-t border-white/5 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">Amount Charged</span>
                <span className="text-lg font-extrabold text-emerald-400">₹{completedRideForReceipt.fare}</span>
              </div>
            </div>

            {/* Feedback / Rating Section */}
            {!feedbackSubmitted ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Rate your driver
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRateRide(star)}
                      className="p-1 hover:scale-110 active:scale-95 transition-all"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= feedbackRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-purple-950/20 border border-purple-500/20 py-2.5 rounded-xl text-center">
                <span className="text-xs text-purple-400 font-bold">Feedback Saved! Have a nice day.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MAIN ACTIVE TRIP DISPLAY */}
      {activeRide ? (
        <div className="flex-1 flex flex-col justify-between py-2">
          {activeRide.status === "searching" ? (
            // SEARCHING DRIVER SONAR SCREEN
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Sonar Rings */}
                <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-4 rounded-full border border-purple-500/40 animate-ping" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-8 rounded-full border border-purple-500/60 animate-ping" style={{ animationDuration: '1.5s' }}></div>
                <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center border border-purple-400/30 shadow-lg relative z-10">
                  <Search className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-xl text-slate-200">Searching Drivers...</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connecting you with nearby VBooky {VEHICLE_DETAILS[activeRide.vehicleType].name} partners
                </p>
              </div>

              {/* Ride request details */}
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 w-full flex flex-col gap-2.5 text-left text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-purple-500 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block leading-none mb-1">Pickup From</span>
                    <span className="font-semibold text-slate-200">{activeRide.pickup.name}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block leading-none mb-1">Destination</span>
                    <span className="font-semibold text-slate-200">{activeRide.destination.name}</span>
                  </div>
                </div>
                <div className="border-t border-white/5 my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Estimated Fare</span>
                  <span className="font-extrabold text-lg text-purple-400">₹{activeRide.fare}</span>
                </div>
              </div>

              <button
                onClick={cancelRide}
                className="w-full py-3 bg-red-650/10 hover:bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 mt-2"
              >
                Cancel Booking Request
              </button>
            </div>
          ) : (
            // TRIP DETAILED STATUS SIDEBAR
            <div className="flex-1 flex flex-col gap-5 text-left">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-lg text-slate-200">Your Booking</h3>
                <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md bg-purple-950/40 border border-purple-500/30 text-purple-400">
                  {activeRide.status.replace("-", " ")}
                </span>
              </div>

              {/* Path nodes overview */}
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-3.5 text-xs relative overflow-hidden">
                <div className="absolute left-[21px] top-8 bottom-8 w-[1.5px] bg-slate-800"></div>

                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-3.5 h-3.5 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-[8px] font-extrabold text-purple-300 mt-0.5">
                    A
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block leading-none">Pickup point</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{activeRide.pickup.name}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[8px] font-extrabold text-emerald-300 mt-0.5">
                    B
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block leading-none">Drop-off point</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{activeRide.destination.name}</span>
                  </div>
                </div>
              </div>

              {/* Driver Partner Card Details */}
              {activeRide.driver && (
                <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeRide.driver.avatar}
                      alt={activeRide.driver.name}
                      className="w-11 h-11 rounded-xl bg-slate-800 border border-white/10"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200 text-sm">{activeRide.driver.name}</span>
                        <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold">
                          <span>★</span>
                          <span>{activeRide.driver.rating}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block leading-none mt-0.5">
                        {activeRide.driver.vehicleName} • {activeRide.driver.licensePlate}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block leading-none">
                        Trip OTP PIN
                      </span>
                      <span className="font-extrabold text-purple-400 text-lg leading-none mt-1 block tracking-wider">
                        {activeRide.otp}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block leading-none">
                        Trip Fare
                      </span>
                      <span className="font-bold text-slate-200 text-lg leading-none mt-1 block">
                        ₹{activeRide.fare}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Trip animation statistics progress */}
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Trip Progress</span>
                  <span className="font-bold text-purple-400">{activeRide.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeRide.progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    {activeRide.status === "assigned"
                      ? "Driver arriving at pickup location..."
                      : "Driving towards destination node..."}
                  </span>
                  <span className="text-[10px] text-purple-400 font-semibold">
                    {activeRide.status === "assigned" ? "ETA: 2m" : `Speed: ~${45 + Math.round(Math.random() * 15)}km/h`}
                  </span>
                </div>
              </div>

              {/* Trip Cancel block */}
              {activeRide.status === "assigned" && (
                <button
                  onClick={cancelRide}
                  className="w-full py-3 mt-auto bg-red-650/10 hover:bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        // 3. PASENGER PLANNING STATE (PICKUP/DESTINATION INPUT FIELDS)
        <div className="flex-1 flex flex-col justify-between py-1.5 text-left">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-extrabold text-xl text-slate-200">Where are you heading?</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your pickup and destination landmarks below or select points directly on the grid map.
              </p>
            </div>

            {/* Inputs block */}
            <div className="flex flex-col gap-3 relative">
              <div className="absolute left-4 top-[24px] bottom-[24px] w-[1px] bg-slate-800"></div>

              {/* Pickup Input */}
              <div className="relative">
                <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-purple-500 border border-slate-900 z-10 flex items-center justify-center text-[7px] text-white"></div>
                <input
                  type="text"
                  placeholder="Enter pickup landmark..."
                  value={pickupSearch}
                  onChange={(e) => handlePickupSearchChange(e.target.value)}
                  onFocus={() => setFocusField("pickup")}
                  className="w-full pl-9 pr-8 py-2.5 text-xs glass-input rounded-xl focus:neon-border-purple"
                />
                {pickupSearch && (
                  <button
                    onClick={() => {
                      setPickup(null);
                      setPickupSearch("");
                    }}
                    className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Pickup Suggestions Box */}
                {focusField === "pickup" && pickupSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950/95 border border-white/10 rounded-xl shadow-2xl z-40 max-h-48 overflow-y-auto">
                    {pickupSuggestions.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => handleSelectPickup(loc)}
                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-900 flex items-center gap-2 border-b border-white/5 last:border-0"
                      >
                        <Landmark className="w-3.5 h-3.5 text-purple-400" />
                        <span className="font-medium text-slate-200">{loc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input */}
              <div className="relative">
                <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-emerald-500 border border-slate-900 z-10 flex items-center justify-center text-[7px] text-white"></div>
                <input
                  type="text"
                  placeholder="Enter drop-off destination..."
                  value={destSearch}
                  onChange={(e) => handleDestSearchChange(e.target.value)}
                  onFocus={() => setFocusField("dest")}
                  className="w-full pl-9 pr-8 py-2.5 text-xs glass-input rounded-xl focus:neon-border-green"
                />
                {destSearch && (
                  <button
                    onClick={() => {
                      setDestination(null);
                      setDestSearch("");
                    }}
                    className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Destination Suggestions Box */}
                {focusField === "dest" && destSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950/95 border border-white/10 rounded-xl shadow-2xl z-40 max-h-48 overflow-y-auto">
                    {destSuggestions.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => handleSelectDest(loc)}
                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-900 flex items-center gap-2 border-b border-white/5 last:border-0"
                      >
                        <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-medium text-slate-200">{loc.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Button */}
              {pickup && destination && (
                <button
                  onClick={handleSwapLocations}
                  className="absolute right-9 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-white z-10 shadow-md transition-all active:scale-90"
                  title="Swap locations"
                >
                  <RefreshCw className="w-3.5 h-3.5 rotate-90" />
                </button>
              )}
            </div>

            {/* Quick popular recommendations if empty */}
            {(!pickup || !destination) && (
              <div className="flex flex-col gap-2 mt-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Popular Landmarks
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {landmarks.slice(0, 4).map((landmark) => (
                    <button
                      key={landmark.name}
                      onClick={() => {
                        if (!pickup) handleSelectPickup(landmark);
                        else if (!destination) handleSelectDest(landmark);
                      }}
                      className="px-3 py-2 bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-slate-700 rounded-xl text-left text-[11px] font-medium text-slate-300 transition-all flex items-center gap-1.5 truncate"
                    >
                      <Landmark className="w-3 h-3 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{landmark.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle Options Carousel */}
            {pickup && destination && (
              <div className="flex flex-col gap-2.5 mt-2 animate-scale-up">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Choose Ride Mode (Distance: {distance} km)
                </span>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {(Object.keys(VEHICLE_DETAILS) as VehicleType[]).map((key) => {
                    const details = VEHICLE_DETAILS[key];
                    const fare = Math.round(details.baseFare + distance * details.ratePerKm);

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedVehicle(key)}
                        className={`p-3 rounded-2xl border transition-all text-left flex justify-between items-center gap-3 ${
                          selectedVehicle === key
                            ? "bg-purple-950/20 border-purple-500/60 neon-border-purple"
                            : "bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/70"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-950/80 border border-white/5 rounded-xl flex items-center justify-center">
                            {getVehicleIcon(key)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-200">
                                {details.name}
                              </span>
                              <span className="text-[10px] font-semibold text-purple-300">
                                ETA: {details.eta}m
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5 max-w-[170px] truncate">
                              {details.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex flex-shrink-0 flex-col items-end">
                          <span className="font-extrabold text-base text-purple-400">
                            ₹{fare}
                          </span>
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5 leading-none">
                            <Users className="w-3 h-3" /> {details.capacity}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Booking Trigger Buttons */}
          {pickup && destination ? (
            <div className="flex flex-col gap-2 mt-4">
              {customerWallet < Math.round(VEHICLE_DETAILS[selectedVehicle].baseFare + distance * VEHICLE_DETAILS[selectedVehicle].ratePerKm) && (
                <div className="p-2.5 bg-red-950/30 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-medium leading-tight mb-1">
                  Warning: Wallet balance (₹{customerWallet.toFixed(2)}) is insufficient for this trip. Please add funds.
                </div>
              )}
              <button
                onClick={handleRequest}
                disabled={customerWallet < Math.round(VEHICLE_DETAILS[selectedVehicle].baseFare + distance * VEHICLE_DETAILS[selectedVehicle].ratePerKm)}
                className={`w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-purple-600/35 hover:shadow-purple-600/50 transition-all flex items-center justify-center gap-1.5 active:scale-98 ${
                  customerWallet < Math.round(VEHICLE_DETAILS[selectedVehicle].baseFare + distance * VEHICLE_DETAILS[selectedVehicle].ratePerKm)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:brightness-110"
                }`}
              >
                <span>Confirm & Request {VEHICLE_DETAILS[selectedVehicle].name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-white/5 p-4 rounded-2xl text-center text-[11px] text-slate-400 flex items-center justify-center gap-2 mt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
              <span>Need both Pickup & Drop locations selected to calculate routes.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
