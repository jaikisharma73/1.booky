"use client";

import React, { useRef, useEffect, useState } from "react";
import { useApp, HORIZONTAL_ROADS, VERTICAL_ROADS, generatePath, calculateDistance } from "../context/AppContext";
import { Location, Driver } from "../types";
import { MapPin, Navigation, Compass, ShieldAlert, Check } from "lucide-react";

export const Map: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    pickup,
    setPickup,
    destination,
    setDestination,
    simulatedDrivers,
    activeRide,
    landmarks,
    userPersona,
  } = useApp();

  const [hoveredDriver, setHoveredDriver] = useState<Driver | null>(null);
  const [hoveredLandmark, setHoveredLandmark] = useState<Location | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Pulsing animation tick
  const [pulseRadius, setPulseRadius] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseRadius((prev) => (prev + 0.5) % 15);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Set pickup / destination on clicking canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || (activeRide && activeRide.status !== "searching")) return;

    const rect = canvasRef.current.getBoundingClientRect();
    // Scale click to 1000x1000 virtual space
    const clickX = ((e.clientX - rect.left) / rect.width) * 1000;
    const clickY = ((e.clientY - rect.top) / rect.height) * 1000;

    // Check if clicked close to a landmark
    let selectedLoc: Location | null = null;
    let minDistance = 40; // click threshold

    for (const landmark of landmarks) {
      const d = calculateDistance(clickX, clickY, landmark.x, landmark.y);
      if (d < minDistance) {
        minDistance = d;
        selectedLoc = landmark;
      }
    }

    // If not close to landmark, create a custom location
    if (!selectedLoc) {
      selectedLoc = {
        name: `Location (${Math.round(clickX)}, ${Math.round(clickY)})`,
        x: Math.round(clickX),
        y: Math.round(clickY),
      };
    }

    if (!pickup) {
      setPickup(selectedLoc);
    } else if (!destination) {
      // Don't set pickup and destination to the same spot
      const dist = calculateDistance(pickup.x, pickup.y, selectedLoc.x, selectedLoc.y);
      if (dist > 15) {
        setDestination(selectedLoc);
      }
    } else {
      // Reset and set as new pickup
      setPickup(selectedLoc);
      setDestination(null);
    }
  };

  // Track mouse move for tooltips and cursor feedback
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 1000;

    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });

    // Check hover driver
    let activeHoverDriver: Driver | null = null;
    for (const driver of simulatedDrivers) {
      const dist = calculateDistance(x, y, driver.x, driver.y);
      if (dist < 15) {
        activeHoverDriver = driver;
        break;
      }
    }
    setHoveredDriver(activeHoverDriver);

    // Check hover landmark (only if not hovering driver)
    if (!activeHoverDriver) {
      let activeHoverLandmark: Location | null = null;
      for (const landmark of landmarks) {
        const dist = calculateDistance(x, y, landmark.x, landmark.y);
        if (dist < 20) {
          activeHoverLandmark = landmark;
          break;
        }
      }
      setHoveredLandmark(activeHoverLandmark);
    } else {
      setHoveredLandmark(null);
    }
  };

  // Core drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, 1000, 1000);

      // --- 1. DRAW WATER BODIES / RIVERS ---
      ctx.strokeStyle = "rgba(14, 116, 144, 0.25)";
      ctx.lineWidth = 45;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-50, 200);
      ctx.bezierCurveTo(300, 150, 400, 450, 700, 600);
      ctx.bezierCurveTo(900, 700, 950, 950, 1050, 1000);
      ctx.stroke();

      ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
      ctx.lineWidth = 15;
      ctx.stroke();

      // --- 2. DRAW PARKS ---
      // Green Oasis Park
      ctx.fillStyle = "rgba(16, 185, 129, 0.07)";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(180, 50, 180, 100, 12);
      ctx.fill();
      ctx.stroke();

      // Botanical Gardens
      ctx.beginPath();
      ctx.roundRect(650, 450, 150, 150, 12);
      ctx.fill();
      ctx.stroke();

      // --- 3. DRAW ROADS NETWORK ---
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 32;
      ctx.lineCap = "square";

      // Horizontal streets
      for (const y of HORIZONTAL_ROADS) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1000, y);
        ctx.stroke();
      }

      // Vertical streets
      for (const x of VERTICAL_ROADS) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1000);
        ctx.stroke();
      }

      // Draw road lane dividers (dotted lines)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);

      for (const y of HORIZONTAL_ROADS) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1000, y);
        ctx.stroke();
      }
      for (const x of VERTICAL_ROADS) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1000);
        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset line dash

      // --- 4. DRAW TRIP ROUTE LINE ---
      if (pickup && destination) {
        const route = generatePath(pickup, destination);
        
        // Draw glow effect for route
        ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
        ctx.lineWidth = 10;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(route[0].x, route[0].y);
        for (let i = 1; i < route.length; i++) {
          ctx.lineTo(route[i].x, route[i].y);
        }
        ctx.stroke();

        // Draw primary route path
        ctx.strokeStyle = "#a855f7"; // Neon purple route
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(route[0].x, route[0].y);
        for (let i = 1; i < route.length; i++) {
          ctx.lineTo(route[i].x, route[i].y);
        }
        ctx.stroke();

        // Animated navigation arrows on the route line
        ctx.fillStyle = "#e9d5ff";
        const time = Date.now() * 0.003;
        for (let i = 0; i < route.length - 1; i++) {
          const p1 = route[i];
          const p2 = route[i + 1];
          const distance = calculateDistance(p1.x, p1.y, p2.x, p2.y);
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const angle = Math.atan2(dy, dx);

          // Draw multiple arrows sliding down the segment
          const spacing = 60;
          const offset = (time * 20) % spacing;

          for (let d = offset; d < distance; d += spacing) {
            const arrowX = p1.x + (dx / distance) * d;
            const arrowY = p1.y + (dy / distance) * d;

            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(-5, -4);
            ctx.lineTo(3, 0);
            ctx.lineTo(-5, 4);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // --- 5. DRAW LANDMARKS ---
      for (const landmark of landmarks) {
        // Dot marker
        ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = "#818cf8"; // Indigo
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Title Labels
        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = "rgba(241, 245, 249, 0.75)";
        ctx.textAlign = "center";
        ctx.fillText(landmark.name, landmark.x, landmark.y - 12);
      }

      // --- 6. DRAW ACTIVE TRIP PIN DROPS (PICKUP & DESTINATION) ---
      if (pickup) {
        // Glowing ripple rings for pickup
        ctx.strokeStyle = "rgba(168, 85, 247, " + (1 - pulseRadius / 15) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y, 10 + pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Primary Pickup pin
        ctx.fillStyle = "#a855f7"; // Neon purple pin
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (destination) {
        // Glowing ripple rings for drop-off
        ctx.strokeStyle = "rgba(16, 185, 129, " + (1 - pulseRadius / 15) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(destination.x, destination.y, 10 + pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Drop-off pin
        ctx.fillStyle = "#10b981"; // Emerald green
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(destination.x, destination.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // --- 7. DRAW SIMULATED DRIVERS ---
      simulatedDrivers.forEach((driver) => {
        // Hide standard driver in active booking to draw custom color
        const isSelfDriver = userPersona === "driver" && activeRide && activeRide.driver?.id === driver.id;
        const isCustomerRideDriver = userPersona === "customer" && activeRide && activeRide.driver?.id === driver.id;
        
        ctx.save();
        ctx.translate(driver.x, driver.y);
        ctx.rotate(driver.angle * (Math.PI / 180));

        let driverColor = "#f59e0b"; // Yellow (Cabs default)
        let driverSize = 8;

        if (driver.type === "bike") {
          driverColor = "#3b82f6"; // Rapido blue bike
          driverSize = 6;
        } else if (driver.type === "auto") {
          driverColor = "#22c55e"; // Auto green
          driverSize = 7.5;
        } else if (driver.type === "xl") {
          driverColor = "#ec4899"; // XL Pink
          driverSize = 9;
        }

        // Highlight active ride driver with glowing magenta/purple outline
        if (isCustomerRideDriver || isSelfDriver) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#a855f7";
          driverColor = "#a855f7"; // Magenta
        }

        // Draw vehicle body representation
        if (driver.type === "bike") {
          // Motorbike shape: thin oval + driver dot
          ctx.fillStyle = driverColor;
          ctx.beginPath();
          ctx.ellipse(0, 0, driverSize + 2, driverSize - 3, 0, 0, Math.PI * 2);
          ctx.fill();
          // rider helmet
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(-2, 0, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (driver.type === "auto") {
          // Auto rickshaw: rounded triangle
          ctx.fillStyle = driverColor;
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-driverSize, -driverSize + 2);
          ctx.lineTo(driverSize, 0);
          ctx.lineTo(-driverSize, driverSize - 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Cab / Sedan / XL: Sleek car body rectangle
          ctx.fillStyle = driverColor;
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-driverSize, -driverSize + 2, driverSize * 2, driverSize * 2 - 4, 3);
          ctx.fill();
          ctx.stroke();

          // Windshield (dark glass)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
          ctx.beginPath();
          ctx.roundRect(2, -driverSize + 4, driverSize - 3, driverSize * 2 - 8, 1);
          ctx.fill();

          // Headlights (glowing yellow)
          ctx.fillStyle = "rgba(253, 224, 71, 0.9)";
          ctx.beginPath();
          ctx.arc(driverSize, -driverSize + 4, 1.5, 0, Math.PI * 2);
          ctx.arc(driverSize, driverSize - 4, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // --- 8. DRAW ACTIVE RIDE HIGHLIGHT (DRIVER PICKUP NAV ENVELOPE) ---
      if (activeRide && activeRide.driver && activeRide.status === "assigned" && userPersona === "customer") {
        const driver = activeRide.driver;
        
        // Draw dotted path from driver to pickup point
        ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(driver.x, driver.y);
        ctx.lineTo(pickup?.x || 0, pickup?.y || 0);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [simulatedDrivers, pickup, destination, activeRide, pulseRadius, userPersona]);

  return (
    <div ref={containerRef} className="map-canvas-container w-full h-full relative">
      <canvas
        ref={canvasRef}
        width={1000}
        height={1000}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="w-full h-full object-cover cursor-crosshair"
      />

      {/* Map Interactive Guides Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2">
        <div className="glass-panel px-4 py-2.5 rounded-xl shadow-lg border-white/5 pointer-events-auto flex items-center gap-2 text-xs">
          <Compass className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <span className="font-semibold text-slate-200">
              {!pickup
                ? "Select pickup location"
                : !destination
                ? "Select destination location"
                : "Route calculations loaded"}
            </span>
            <p className="text-[10px] text-slate-400">
              {!pickup
                ? "Click any landmark or coordinate on the grid."
                : !destination
                ? "Click drop-off node on the grid map."
                : "Change route by clicking new coordinate points."}
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Hover Details Tooltips */}
      {hoveredDriver && (
        <div
          className="absolute glass-panel px-3.5 py-2 rounded-xl text-xs flex flex-col gap-1 shadow-2xl border-white/10 z-30 pointer-events-none"
          style={{ left: `${tooltipPos.x + 15}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <span className="font-bold text-slate-200">{hoveredDriver.name}</span>
          </div>
          <span className="text-[10px] text-purple-300 font-medium tracking-wide uppercase">
            {hoveredDriver.type.toUpperCase()} • Rating: {hoveredDriver.rating} ★
          </span>
          <span className="text-[10px] text-slate-400">
            {hoveredDriver.vehicleName} ({hoveredDriver.licensePlate})
          </span>
        </div>
      )}

      {hoveredLandmark && (
        <div
          className="absolute glass-panel-heavy px-3 py-1.5 rounded-lg text-xs shadow-2xl border-white/10 z-30 pointer-events-none flex items-center gap-1.5"
          style={{ left: `${tooltipPos.x + 15}px`, top: `${tooltipPos.y}px` }}
        >
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium text-slate-200">{hoveredLandmark.name}</span>
        </div>
      )}

      {/* Active Passenger Driver Status Popup */}
      {activeRide && activeRide.driver && userPersona === "customer" && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 glass-panel p-4 rounded-2xl border-white/5 flex flex-col gap-3 shadow-xl z-20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={activeRide.driver.avatar}
                alt={activeRide.driver.name}
                className="w-12 h-12 rounded-xl border border-white/10 bg-slate-800"
              />
              <span className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full p-0.5 border border-slate-900">
                <Check className="w-3 h-3" />
              </span>
            </div>
            <div className="flex-1 text-left">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-200">{activeRide.driver.name}</h4>
                <span className="text-xs text-yellow-400 font-bold">★ {activeRide.driver.rating}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeRide.driver.vehicleName} • {activeRide.driver.licensePlate}
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block leading-none">
                {activeRide.status === "assigned" ? "Pickup Code (OTP)" : "Status"}
              </span>
              <span className="font-extrabold text-purple-400 text-sm">
                {activeRide.status === "assigned" ? activeRide.otp : "Ride In Progress"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block leading-none">
                Est. Fare
              </span>
              <span className="font-bold text-slate-200 text-sm">₹{activeRide.fare}</span>
            </div>
          </div>

          {activeRide.status === "assigned" ? (
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-ping"></span>
              <p className="text-[11px] text-slate-300">
                Driver is arriving at your pickup spot. Please share OTP code to start.
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Trip Progress</span>
                <span>{activeRide.progress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${activeRide.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
