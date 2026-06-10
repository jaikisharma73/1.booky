"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp, VEHICLE_DETAILS, calculateDistance, generatePath } from "../context/AppContext";
import { Ride } from "../types";
import { Power, Shield, Star, DollarSign, Navigation, MapPin, Check, X, ShieldAlert, Award, Clock } from "lucide-react";

export const DriverPanel: React.FC = () => {
  const {
    userPersona,
    isDriverOnline,
    setDriverOnline,
    incomingRequest,
    acceptRideRequest,
    declineRideRequest,
    activeRide,
    setActiveRide,
    completeRide,
    driverWallet,
    setIncomingRequest,
  } = useApp();

  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [driverStage, setDriverStage] = useState<"to-pickup" | "waiting-otp" | "to-destination">("to-pickup");
  const [countdown, setCountdown] = useState(15);

  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync driver stages with ride status changes
  useEffect(() => {
    if (activeRide) {
      if (activeRide.status === "assigned") {
        setDriverStage("to-pickup");
      } else if (activeRide.status === "in-progress") {
        setDriverStage("to-destination");
      }
    }
  }, [activeRide]);

  // Request countdown timer (declines after 15s)
  useEffect(() => {
    if (incomingRequest) {
      setCountdown(15);
      countdownTimer.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer.current!);
            declineRideRequest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [incomingRequest, declineRideRequest]);

  // Handle Driver Mode Self Simulation
  const simulatedTripInterval = useRef<NodeJS.Timeout | null>(null);

  const handleArrivedAtPickup = () => {
    setDriverStage("waiting-otp");
  };

  const handleVerifyOtp = () => {
    if (!activeRide) return;
    if (otpInput === activeRide.otp) {
      setOtpError("");
      setOtpInput("");
      
      // Advance ride status to in-progress in state
      setActiveRide({
        ...activeRide,
        status: "in-progress" as const,
        progress: 5,
      });
      setDriverStage("to-destination");
      
      // Start driving simulation to destination
      simulateDriverMovementToDestination();
    } else {
      setOtpError("Incorrect OTP code. Please try again.");
    }
  };

  const simulateDriverMovementToDestination = () => {
    if (!activeRide) return;

    const path = generatePath(activeRide.pickup, activeRide.destination);
    let pathIdx = 0;

    simulatedTripInterval.current = setInterval(() => {
      setActiveRide((prevRide) => {
        if (!prevRide || prevRide.status !== "in-progress") {
          clearInterval(simulatedTripInterval.current!);
          return prevRide;
        }

        const driver = prevRide.driver;
        if (!driver) return prevRide;

        if (pathIdx >= path.length) {
          clearInterval(simulatedTripInterval.current!);
          return {
            ...prevRide,
            progress: 100,
          };
        }

        const targetNode = path[pathIdx];
        const dx = targetNode.x - driver.x;
        const dy = targetNode.y - driver.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const stepSpeed = 10; // drive fast

        if (dist <= stepSpeed) {
          pathIdx++;
          return {
            ...prevRide,
            driver: {
              ...driver,
              x: targetNode.x,
              y: targetNode.y,
            },
          };
        } else {
          const nextX = driver.x + (dx / dist) * stepSpeed;
          const nextY = driver.y + (dy / dist) * stepSpeed;
          const nextAngle = Math.atan2(dy, dx) * (180 / Math.PI);

          const tripTotalDist = calculateDistance(
            prevRide.pickup.x,
            prevRide.pickup.y,
            prevRide.destination.x,
            prevRide.destination.y
          );
          const remainingDist = calculateDistance(
            nextX,
            nextY,
            prevRide.destination.x,
            prevRide.destination.y
          );
          const calculatedProgress = Math.max(
            5,
            Math.round(((tripTotalDist - remainingDist) / tripTotalDist) * 100)
          );

          return {
            ...prevRide,
            progress: calculatedProgress,
            driver: {
              ...driver,
              x: nextX,
              y: nextY,
              angle: nextAngle,
            },
          };
        }
      });
    }, 200);
  };

  const handleCompleteJob = () => {
    if (simulatedTripInterval.current) clearInterval(simulatedTripInterval.current);
    completeRide();
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel border-r border-white/5 rounded-none p-5 text-slate-100 overflow-y-auto">
      {/* 1. STATUS: OFFLINE SPLASH */}
      {!isDriverOnline && !activeRide && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-6">
          <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center shadow-lg relative">
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-500 rounded-full border-2 border-slate-950"></span>
            <Power className="w-8 h-8 text-slate-400" />
          </div>

          <div>
            <h3 className="font-extrabold text-xl text-slate-200">You're Offline</h3>
            <p className="text-xs text-slate-400 mt-1">
              Go Online to access the driver dashboard, view today's earnings, and receive ride requests from passengers.
            </p>
          </div>

          <button
            onClick={() => setDriverOnline(true)}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-emerald-600/35 hover:shadow-emerald-600/50 transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Power className="w-4 h-4" />
            <span>Go Online Now</span>
          </button>
        </div>
      )}

      {/* 2. DASHBOARD: ONLINE BUT IDLE */}
      {isDriverOnline && !activeRide && !incomingRequest && (
        <div className="flex-1 flex flex-col gap-6 text-left">
          <div>
            <h2 className="font-extrabold text-xl text-slate-200">Driver Partner Panel</h2>
            <p className="text-xs text-slate-400 mt-1">
              Waiting for incoming ride offers in your vicinity. Keep this tab active to receive requests.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-md">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Today's Earnings
              </span>
              <span className="text-lg font-bold text-slate-200">₹{driverWallet.toFixed(2)}</span>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-md">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Driver Rating
              </span>
              <span className="text-lg font-bold text-slate-200">4.9 ★</span>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-md">
              <Award className="w-5 h-5 text-purple-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Acceptance Rate
              </span>
              <span className="text-lg font-bold text-slate-200">97.5%</span>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-md">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Online Hours
              </span>
              <span className="text-lg font-bold text-slate-200">2.4h</span>
            </div>
          </div>

          {/* Glowing Status radar */}
          <div className="mt-auto bg-slate-900/30 border border-white/5 p-5 rounded-2xl text-center flex flex-col items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-ping"></div>
              <span className="w-4 h-4 bg-emerald-500 border border-slate-900 rounded-full relative z-10"></span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200">GPS Tracker Active</span>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                Passengers nearby can see your vehicle location. Trip requests will pop up automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. INCOMING RIDE REQUEST PANEL OVERLAY */}
      {isDriverOnline && incomingRequest && !activeRide && (
        <div className="flex-1 flex flex-col justify-between py-2 text-left animate-scale-up">
          <div className="flex flex-col gap-5">
            {/* Header / Countdown */}
            <div className="flex justify-between items-center bg-slate-900/60 p-3.5 rounded-2xl border border-purple-500/20">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-400 animate-pulse" />
                <span className="font-extrabold text-sm text-slate-200 tracking-wide">
                  NEW TRIP OFFER!
                </span>
              </div>
              <div className="flex items-center gap-1 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-bold text-purple-300">{countdown}s</span>
              </div>
            </div>

            {/* Offer details */}
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-3.5 text-xs relative overflow-hidden">
              <div className="absolute left-[21px] top-8 bottom-8 w-[1.5px] bg-slate-800"></div>

              <div className="flex items-start gap-3 relative z-10">
                <div className="w-3.5 h-3.5 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-[8px] font-extrabold text-purple-300 mt-0.5">
                  A
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block leading-none">Pickup Landmark</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {incomingRequest.pickup.name}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 relative z-10">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[8px] font-extrabold text-emerald-300 mt-0.5">
                  B
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block leading-none">Drop-off Landmark</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {incomingRequest.destination.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400">Total Distance</span>
                <span className="font-bold text-slate-200">{incomingRequest.distance} km</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400">Vehicle Class</span>
                <span className="font-bold text-slate-200 capitalize">
                  {VEHICLE_DETAILS[incomingRequest.vehicleType].name}
                </span>
              </div>
            </div>

            {/* Fare Earnings */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-center flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Est. Fare Earnings
              </span>
              <span className="text-2xl font-extrabold text-emerald-400">₹{incomingRequest.fare}</span>
              <span className="text-[9px] text-slate-400">Paid directly to your driver wallet</span>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={declineRideRequest}
              className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
            >
              Decline
            </button>
            <button
              onClick={acceptRideRequest}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-emerald-600/35 hover:shadow-emerald-600/50 active:scale-98"
            >
              Accept Offer
            </button>
          </div>
        </div>
      )}

      {/* 4. TRIP ACTIVE GAMEPLAY JOB FLOW */}
      {isDriverOnline && activeRide && (
        <div className="flex-1 flex flex-col justify-between py-2 text-left animate-scale-up">
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-lg text-slate-200">Active Job</h3>
              <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                {driverStage === "to-pickup"
                  ? "En Route To Pickup"
                  : driverStage === "waiting-otp"
                  ? "Arrived & Waiting"
                  : "Driving to Destination"}
              </span>
            </div>

            {/* Navigation Nodes */}
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-3.5 text-xs relative overflow-hidden">
              <div className="absolute left-[21px] top-8 bottom-8 w-[1.5px] bg-slate-800"></div>

              <div className={`flex items-start gap-3 relative z-10 transition-opacity ${driverStage === "to-destination" ? "opacity-45" : ""}`}>
                <div className="w-3.5 h-3.5 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-[8px] font-extrabold text-purple-300 mt-0.5">
                  A
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block leading-none">Pickup location</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{activeRide.pickup.name}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 relative z-10">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[8px] font-extrabold text-emerald-300 mt-0.5">
                  B
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block leading-none">Drop-off location</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{activeRide.destination.name}</span>
                </div>
              </div>
            </div>

            {/* Passenger details */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center">
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=passenger1"
                  alt="Passenger"
                  className="w-9 h-9"
                />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-200">Passenger Profile</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Trip Fare: <span className="text-emerald-400 font-bold">₹{activeRide.fare}</span> • Class: {VEHICLE_DETAILS[activeRide.vehicleType].name}
                </p>
              </div>
            </div>

            {/* Action panel depending on stage */}
            {driverStage === "to-pickup" && (
              <div className="bg-slate-900/50 p-4.5 rounded-2xl border border-white/5 flex flex-col gap-3">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Open your GPS map simulation and navigate towards the purple pickup node point on the grid roads.
                </p>
                <button
                  onClick={handleArrivedAtPickup}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 shadow-purple-600/25 active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  <span>I Have Arrived at Pickup Spot</span>
                </button>
              </div>
            )}

            {driverStage === "waiting-otp" && (
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                <span className="text-xs text-slate-300 font-bold block leading-none">
                  Enter Passenger OTP PIN
                </span>
                <p className="text-[10px] text-slate-400">
                  Ask the passenger for the 4-digit code. In this simulation demo, the passenger's OTP code is:
                </p>
                {/* Auto fill hint */}
                <button
                  onClick={() => setOtpInput(activeRide.otp)}
                  className="px-2.5 py-1.5 bg-slate-950/70 border border-white/15 text-[11px] font-extrabold text-purple-400 hover:text-purple-300 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <span>Passenger OTP: {activeRide.otp}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 font-medium tracking-wide">
                    (Click to autofill)
                  </span>
                </button>

                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Enter 4-digit code..."
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 px-3 py-2 text-xs font-bold text-center tracking-widest glass-input rounded-xl focus:neon-border-green"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center active:scale-95"
                  >
                    Verify & Start Trip
                  </button>
                </div>
                {otpError && <span className="text-[10px] text-red-400 font-medium">{otpError}</span>}
              </div>
            )}

            {driverStage === "to-destination" && (
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-3.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Driving progress</span>
                  <span className="font-bold text-emerald-400">{activeRide.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeRide.progress}%` }}
                  ></div>
                </div>

                {activeRide.progress >= 100 ? (
                  <button
                    onClick={handleCompleteJob}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-1 shadow-emerald-600/25 active:scale-98 mt-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Complete Ride & Collect ₹{activeRide.fare}</span>
                  </button>
                ) : (
                  <div className="bg-slate-950/40 p-2.5 rounded-xl text-center border border-white/5">
                    <span className="text-[10px] text-slate-400">
                      Driving towards the destination coordinate node on grid roads.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
