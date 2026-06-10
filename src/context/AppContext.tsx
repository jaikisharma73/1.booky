"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Location, VehicleType, VehicleDetails, Driver, Ride, WalletTransaction } from "../types";

interface AppContextType {
  userPersona: "customer" | "driver";
  setUserPersona: (persona: "customer" | "driver") => void;
  customerWallet: number;
  driverWallet: number;
  transactions: WalletTransaction[];
  pickup: Location | null;
  destination: Location | null;
  setPickup: (loc: Location | null) => void;
  setDestination: (loc: Location | null) => void;
  selectedVehicle: VehicleType;
  setSelectedVehicle: (type: VehicleType) => void;
  activeRide: Ride | null;
  rideHistory: Ride[];
  isDriverOnline: boolean;
  setDriverOnline: (online: boolean) => void;
  incomingRequest: Ride | null;
  simulatedDrivers: Driver[];
  setSimulatedDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  addFunds: (amount: number) => void;
  requestRide: () => void;
  cancelRide: () => void;
  completeRide: (rating?: number) => void;
  acceptRideRequest: () => void;
  declineRideRequest: () => void;
  setIncomingRequest: (ride: Ride | null) => void;
  setActiveRide: React.Dispatch<React.SetStateAction<Ride | null>>;
  simulateDriverProgress: () => void;
  setRideHistory: React.Dispatch<React.SetStateAction<Ride[]>>;
  landmarks: Location[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Core constants
export const LANDMARKS: Location[] = [
  { name: "Central Park", x: 500, y: 500 },
  { name: "Silicon Valley Tech Park", x: 200, y: 300 },
  { name: "Skyline International Airport", x: 850, y: 150 },
  { name: "Metro Central Railway Station", x: 400, y: 800 },
  { name: "Ocean Drive Marina", x: 900, y: 850 },
  { name: "Grand Mall & Cineplex", x: 300, y: 700 },
  { name: "Heritage Old Town Plaza", x: 150, y: 150 },
  { name: "Royal District Hospital", x: 750, y: 650 },
  { name: "City Business District (CBD)", x: 600, y: 400 },
  { name: "State University Campus", x: 300, y: 200 },
];

export const VEHICLE_DETAILS: Record<VehicleType, VehicleDetails> = {
  bike: {
    type: "bike",
    name: "Rapido Bike",
    capacity: 1,
    baseFare: 20,
    ratePerKm: 6,
    eta: 2,
    icon: "Bike",
    description: "Fastest navigation through heavy traffic. Ideal for solo commuters.",
  },
  auto: {
    type: "auto",
    name: "VBooky Auto",
    capacity: 3,
    baseFare: 35,
    ratePerKm: 9,
    eta: 3,
    icon: "Navigation",
    description: "Affordable and classic three-wheeler. Covered & pocket-friendly.",
  },
  mini: {
    type: "mini",
    name: "Cab Mini",
    capacity: 4,
    baseFare: 50,
    ratePerKm: 12,
    eta: 4,
    icon: "Car",
    description: "Budget-friendly hatchback rides. Snug & fully air-conditioned.",
  },
  sedan: {
    type: "sedan",
    name: "Cab Sedan",
    capacity: 4,
    baseFare: 70,
    ratePerKm: 15,
    eta: 5,
    icon: "Sparkles",
    description: "Premium sedan experience with top-rated drivers. Spacious and smooth.",
  },
  xl: {
    type: "xl",
    name: "Cab XL (SUV)",
    capacity: 6,
    baseFare: 100,
    ratePerKm: 22,
    eta: 7,
    icon: "Users",
    description: "Perfect for group travels, family outings, and extra luggage space.",
  },
};

// Simplified road network for smart simulated vehicle paths (grid intersections)
export const HORIZONTAL_ROADS = [150, 300, 500, 700, 850];
export const VERTICAL_ROADS = [150, 300, 400, 600, 750, 900];

// Dynamic helper to calculate grid distance
export const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Generate path along road grid from source to target
export const generatePath = (start: { x: number; y: number }, end: { x: number; y: number }): { x: number; y: number }[] => {
  // Snapping logic: find nearest roads
  const snapToRoad = (coord: { x: number; y: number }) => {
    const nearestH = HORIZONTAL_ROADS.reduce((prev, curr) => (Math.abs(curr - coord.y) < Math.abs(prev - coord.y) ? curr : prev));
    const nearestV = VERTICAL_ROADS.reduce((prev, curr) => (Math.abs(curr - coord.x) < Math.abs(prev - coord.x) ? curr : prev));
    return { x: nearestV, y: nearestH };
  };

  const snappedStart = snapToRoad(start);
  const snappedEnd = snapToRoad(end);

  const path = [{ x: start.x, y: start.y }];
  path.push(snappedStart);
  
  // Navigate through grid: first go to end X, then to end Y
  path.push({ x: snappedEnd.x, y: snappedStart.y });
  path.push(snappedEnd);
  path.push({ x: end.x, y: end.y });

  return path;
};

const MOCK_NAMES = ["Amit Sharma", "Rahul Verma", "Priya Patel", "Vikram Singh", "Sanjay Dutt", "Neha Gupta", "Rohan Das", "Kunal Sen", "Anjali Nair", "Deepak Rao"];
const MOCK_PLATES = ["DL 3C AM 4589", "MH 12 QP 9021", "KA 03 MX 7721", "HR 26 AZ 1009", "UP 16 BL 5543", "KA 51 YH 8812", "MH 02 ER 3312", "WB 20 TS 0998", "AP 09 CK 6542", "TS 08 KL 4321"];
const MOCK_VEHICLES = {
  bike: ["Royal Enfield Classic", "Honda Activa 6G", "TVS Apache RTR", "Bajaj Pulsar 150", "Yamaha FZS"],
  auto: ["Bajaj RE Optima", "Piaggio Ape Auto+", "Mahindra Treo Electric", "Bajaj Maxima Z"],
  mini: ["Maruti Suzuki Alto", "Hyundai Santro", "Renault Kwid", "Tata Tiago"],
  sedan: ["Honda City", "Hyundai Verna", "Maruti Suzuki Dzire", "Toyota Yaris"],
  xl: ["Toyota Innova Crysta", "Mahindra XUV700", "Ertiga", "Kia Carens"],
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPersona, setUserPersona] = useState<"customer" | "driver">("customer");
  const [customerWallet, setCustomerWallet] = useState<number>(500);
  const [driverWallet, setDriverWallet] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: "t_init",
      amount: 500,
      type: "credit",
      description: "Welcome Wallet Bonus credited",
      date: new Date().toLocaleDateString(),
    },
  ]);

  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("mini");
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);

  // Driver Persona States
  const [isDriverOnline, setDriverOnline] = useState<boolean>(false);
  const [incomingRequest, setIncomingRequest] = useState<Ride | null>(null);

  // Simulated nearby drivers in the ecosystem
  const [simulatedDrivers, setSimulatedDrivers] = useState<Driver[]>([]);
  const activeRideRef = useRef<Ride | null>(null);
  activeRideRef.current = activeRide;

  // Initialize drivers
  useEffect(() => {
    const types: VehicleType[] = ["bike", "auto", "mini", "sedan", "xl"];
    const initialDrivers: Driver[] = Array.from({ length: 12 }).map((_, i) => {
      const type = types[i % types.length];
      const name = MOCK_NAMES[i % MOCK_NAMES.length];
      const vehicleList = MOCK_VEHICLES[type];
      const vehicleName = vehicleList[i % vehicleList.length];
      const licensePlate = MOCK_PLATES[i % MOCK_PLATES.length];
      
      // Place them randomly snap to a road intersection
      const rx = VERTICAL_ROADS[Math.floor(Math.random() * VERTICAL_ROADS.length)];
      const ry = HORIZONTAL_ROADS[Math.floor(Math.random() * HORIZONTAL_ROADS.length)];

      return {
        id: `drv_${i + 1}`,
        name,
        rating: parseFloat((4.2 + Math.random() * 0.7).toFixed(1)),
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name.replace(" ", "")}`,
        vehicleName,
        licensePlate,
        type,
        x: rx,
        y: ry,
        status: "idle",
        angle: Math.random() * 360,
      };
    });
    setSimulatedDrivers(initialDrivers);
  }, []);

  // Driver random wandering movement simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedDrivers((prevDrivers) => {
        return prevDrivers.map((driver) => {
          // If the driver is the one assigned to our active ride, skip random movement
          const currentRide = activeRideRef.current;
          if (
            currentRide &&
            currentRide.driver &&
            currentRide.driver.id === driver.id &&
            userPersona === "customer"
          ) {
            return driver; // Handled by ride state animation
          }

          // Otherwise, drive randomly along roads
          let { x, y, angle, targetX, targetY } = driver;

          if (driver.status === "busy") return driver;

          // If no target or arrived at target, select new target intersection
          if (targetX === undefined || targetY === undefined || (Math.abs(x - targetX) < 4 && Math.abs(y - targetY) < 4)) {
            // Find current intersection index
            const currentVIdx = VERTICAL_ROADS.indexOf(x);
            const currentHIdx = HORIZONTAL_ROADS.indexOf(y);

            let nextX = x;
            let nextY = y;

            // Decide direction: 50% chance vertical, 50% horizontal
            if (Math.random() > 0.5) {
              // Move along vertical roads
              const possibleX = [];
              if (currentVIdx > 0) possibleX.push(VERTICAL_ROADS[currentVIdx - 1]);
              if (currentVIdx < VERTICAL_ROADS.length - 1 && currentVIdx !== -1) possibleX.push(VERTICAL_ROADS[currentVIdx + 1]);
              if (possibleX.length > 0) {
                nextX = possibleX[Math.floor(Math.random() * possibleX.length)];
              } else {
                nextX = VERTICAL_ROADS[Math.floor(Math.random() * VERTICAL_ROADS.length)];
              }
            } else {
              // Move along horizontal roads
              const possibleY = [];
              if (currentHIdx > 0) possibleY.push(HORIZONTAL_ROADS[currentHIdx - 1]);
              if (currentHIdx < HORIZONTAL_ROADS.length - 1 && currentHIdx !== -1) possibleY.push(HORIZONTAL_ROADS[currentHIdx + 1]);
              if (possibleY.length > 0) {
                nextY = possibleY[Math.floor(Math.random() * possibleY.length)];
              } else {
                nextY = HORIZONTAL_ROADS[Math.floor(Math.random() * HORIZONTAL_ROADS.length)];
              }
            }

            targetX = nextX;
            targetY = nextY;
          }

          // Move driver slightly towards target coordinates
          const speed = 1.5; // slow cruising
          const dx = targetX - x;
          const dy = targetY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0) {
            x += (dx / dist) * Math.min(speed, dist);
            y += (dy / dist) * Math.min(speed, dist);
            angle = Math.atan2(dy, dx) * (180 / Math.PI);
          }

          return { ...driver, x, y, angle, targetX, targetY };
        });
      });
    }, 150);

    return () => clearInterval(interval);
  }, [userPersona]);

  // Wallet add funds logic
  const addFunds = (amount: number) => {
    setCustomerWallet((prev) => prev + amount);
    setTransactions((prev) => [
      {
        id: `t_${Date.now()}`,
        amount,
        type: "credit",
        description: "Added funds via UPI/Card",
        date: new Date().toLocaleDateString(),
      },
      ...prev,
    ]);
  };

  // Customer Mode: Request Ride
  const requestRide = () => {
    if (!pickup || !destination) return;

    // Calculate approximate distance
    const distPx = calculateDistance(pickup.x, pickup.y, destination.x, destination.y);
    const distanceKm = parseFloat((distPx / 80).toFixed(1)); // 80px = ~1km

    const details = VEHICLE_DETAILS[selectedVehicle];
    const fare = Math.round(details.baseFare + distanceKm * details.ratePerKm);

    // Initialise ride object
    const newRide: Ride = {
      id: `r_${Math.floor(100000 + Math.random() * 900000)}`,
      pickup,
      destination,
      vehicleType: selectedVehicle,
      fare,
      distance: distanceKm,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      status: "searching",
      progress: 0,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveRide(newRide);

    // If customer is requesting, trigger mock driver assignment or driver persona notification
    setTimeout(() => {
      // Find a nearby driver matching the vehicle type
      setSimulatedDrivers((prevDrivers) => {
        const matchingDriver = prevDrivers.find(
          (d) => d.type === selectedVehicle && d.status === "idle"
        );

        if (matchingDriver) {
          // Update driver status in simulation
          const updatedDrivers = prevDrivers.map((d) =>
            d.id === matchingDriver.id ? { ...d, status: "busy" as const } : d
          );

          // Assign driver to ride
          setActiveRide((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: "assigned",
              driver: { ...matchingDriver, status: "busy" },
            };
          });

          return updatedDrivers;
        } else {
          // Fallback: Create a driver on the fly if all are busy
          const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
          const vehicleList = MOCK_VEHICLES[selectedVehicle];
          const vehicleName = vehicleList[Math.floor(Math.random() * vehicleList.length)];
          const licensePlate = MOCK_PLATES[Math.floor(Math.random() * MOCK_PLATES.length)];
          
          const newDriver: Driver = {
            id: `drv_dyn_${Date.now()}`,
            name,
            rating: parseFloat((4.3 + Math.random() * 0.6).toFixed(1)),
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name.replace(" ", "")}`,
            vehicleName,
            licensePlate,
            type: selectedVehicle,
            x: pickup.x + (Math.random() > 0.5 ? 200 : -200),
            y: pickup.y + (Math.random() > 0.5 ? 200 : -200),
            status: "busy",
            angle: Math.random() * 360,
          };

          setActiveRide((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: "assigned",
              driver: newDriver,
            };
          });

          return [...prevDrivers, newDriver];
        }
      });
    }, 2500); // 2.5s search delay for suspense
  };

  // Cancel ride
  const cancelRide = () => {
    if (!activeRide) return;

    if (activeRide.driver) {
      const dId = activeRide.driver.id;
      setSimulatedDrivers((prev) =>
        prev.map((d) => (d.id === dId ? { ...d, status: "idle" } : d))
      );
    }

    setActiveRide((prev) => (prev ? { ...prev, status: "cancelled" } : null));

    setTimeout(() => {
      setActiveRide(null);
    }, 800);
  };

  // Complete Ride & deduct payment / credit driver
  const completeRide = (rating?: number) => {
    if (!activeRide) return;

    const finalRide = {
      ...activeRide,
      status: "completed" as const,
      driverRating: rating || 5,
    };

    // Customer balance deduction
    if (userPersona === "customer") {
      setCustomerWallet((prev) => Math.max(0, prev - activeRide.fare));
      setTransactions((prev) => [
        {
          id: `t_${Date.now()}`,
          amount: activeRide.fare,
          type: "debit",
          description: `Ride completed (${VEHICLE_DETAILS[activeRide.vehicleType].name})`,
          date: new Date().toLocaleDateString(),
        },
        ...prev,
      ]);
    } else {
      // Driver balance increment
      setDriverWallet((prev) => prev + activeRide.fare);
      setTransactions((prev) => [
        {
          id: `t_${Date.now()}`,
          amount: activeRide.fare,
          type: "credit",
          description: `Earnings: Trip ID #${activeRide.id.replace("r_", "")}`,
          date: new Date().toLocaleDateString(),
        },
        ...prev,
      ]);
    }

    // Free the driver in simulated drivers list
    if (activeRide.driver) {
      const dId = activeRide.driver.id;
      setSimulatedDrivers((prev) =>
        prev.map((d) => (d.id === dId ? { ...d, status: "idle", x: activeRide.destination.x, y: activeRide.destination.y } : d))
      );
    }

    setRideHistory((prev) => [finalRide, ...prev]);
    setActiveRide(null);
    setPickup(null);
    setDestination(null);
  };

  // Driver Mode logic: Periodically feed driver with mock requests if online & idle
  useEffect(() => {
    if (userPersona !== "driver" || !isDriverOnline || activeRide || incomingRequest) return;

    const feedInterval = setInterval(() => {
      // 30% chance to spawn requests every 8 seconds
      if (Math.random() > 0.7) {
        const startNode = LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)];
        let endNode = LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)];
        while (startNode.name === endNode.name) {
          endNode = LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)];
        }

        const distPx = calculateDistance(startNode.x, startNode.y, endNode.x, endNode.y);
        const distanceKm = parseFloat((distPx / 80).toFixed(1));
        const vehicleTypes: VehicleType[] = ["bike", "auto", "mini", "sedan", "xl"];
        const selectedType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        const details = VEHICLE_DETAILS[selectedType];
        const fare = Math.round(details.baseFare + distanceKm * details.ratePerKm);

        const newRequest: Ride = {
          id: `r_${Math.floor(100000 + Math.random() * 900000)}`,
          pickup: startNode,
          destination: endNode,
          vehicleType: selectedType,
          fare,
          distance: distanceKm,
          otp: Math.floor(1000 + Math.random() * 9000).toString(),
          status: "searching",
          progress: 0,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setIncomingRequest(newRequest);
      }
    }, 8000);

    return () => clearInterval(feedInterval);
  }, [userPersona, isDriverOnline, activeRide, incomingRequest]);

  // Driver Accept Ride Request
  const acceptRideRequest = () => {
    if (!incomingRequest) return;

    // Simulate driver detail for the ride context
    const currentRequest = { ...incomingRequest };
    currentRequest.status = "assigned";
    currentRequest.driver = {
      id: "driver_self",
      name: "You (Driver Partner)",
      rating: 4.9,
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=You",
      vehicleName: "Your Standard Vehicle",
      licensePlate: "MH 12 VBOOKY 1",
      type: currentRequest.vehicleType,
      x: startDriverX.current,
      y: startDriverY.current,
      status: "busy",
      angle: 0,
    };

    setActiveRide(currentRequest);
    setPickup(currentRequest.pickup);
    setDestination(currentRequest.destination);
    setIncomingRequest(null);
  };

  // Driver Decline Ride Request
  const declineRideRequest = () => {
    setIncomingRequest(null);
  };

  // References for keeping track of driver positions during animations
  const startDriverX = useRef(350);
  const startDriverY = useRef(350);

  // Core Simulation controller: drives vehicle on active bookings
  const simulateDriverProgress = useCallback(() => {
    if (!activeRide) return;

    const currentRide = activeRide;
    const pathPickup = generatePath(
      { x: currentRide.driver?.x || 0, y: currentRide.driver?.y || 0 },
      currentRide.pickup
    );
    const pathTrip = generatePath(currentRide.pickup, currentRide.destination);

    let pathIdx = 0;
    let stage: "to-pickup" | "waiting" | "to-destination" = "to-pickup";
    let subPath = pathPickup;

    const simInterval = setInterval(() => {
      setActiveRide((prevRide) => {
        if (!prevRide || prevRide.status === "idle" || prevRide.status === "cancelled" || prevRide.status === "completed") {
          clearInterval(simInterval);
          return prevRide;
        }

        const driver = prevRide.driver;
        if (!driver) return prevRide;

        // If subpath is fully travelled
        if (pathIdx >= subPath.length) {
          if (stage === "to-pickup") {
            // Arrived at pickup, switch to waiting
            stage = "waiting";
            pathIdx = 0;
            subPath = pathTrip;

            // Wait 2 seconds, then transition to in-progress
            setTimeout(() => {
              setActiveRide((waitRide) => {
                if (!waitRide || waitRide.status !== "assigned") return waitRide;
                stage = "to-destination";
                return {
                  ...waitRide,
                  status: "in-progress",
                  progress: 5,
                };
              });
            }, 2000);

            return {
              ...prevRide,
              driver: {
                ...driver,
                x: prevRide.pickup.x,
                y: prevRide.pickup.y,
              },
            };
          } else if (stage === "to-destination") {
            // Arrived at destination, auto complete after a tiny delay
            clearInterval(simInterval);
            setTimeout(() => {
              completeRide(5);
            }, 1000);

            return {
              ...prevRide,
              status: "completed",
              progress: 100,
              driver: {
                ...driver,
                x: prevRide.destination.x,
                y: prevRide.destination.y,
              },
            };
          }
        }

        // Follow path coordinates
        if (stage !== "waiting" && pathIdx < subPath.length) {
          const targetNode = subPath[pathIdx];
          const dx = targetNode.x - driver.x;
          const dy = targetNode.y - driver.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const stepSpeed = stage === "to-pickup" ? 5 : 6; // Move fast for demo speed

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

            // Update progress if driving to destination
            let calculatedProgress = prevRide.progress;
            if (stage === "to-destination") {
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
              calculatedProgress = Math.max(
                5,
                Math.round(((tripTotalDist - remainingDist) / tripTotalDist) * 100)
              );
            }

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
        }

        return prevRide;
      });
    }, 100);
  }, []);

  // Watch ride assignment to trigger animation loop for user
  useEffect(() => {
    if (
      activeRide &&
      activeRide.status === "assigned" &&
      activeRide.driver &&
      userPersona === "customer" &&
      activeRide.progress === 0
    ) {
      simulateDriverProgress();
    }
  }, [activeRide, userPersona, simulateDriverProgress]);

  return (
    <AppContext.Provider
      value={{
        userPersona,
        setUserPersona,
        customerWallet,
        driverWallet,
        transactions,
        pickup,
        destination,
        setPickup,
        setDestination,
        selectedVehicle,
        setSelectedVehicle,
        activeRide,
        rideHistory,
        isDriverOnline,
        setDriverOnline,
        incomingRequest,
        simulatedDrivers,
        setSimulatedDrivers,
        addFunds,
        requestRide,
        cancelRide,
        completeRide,
        acceptRideRequest,
        declineRideRequest,
        setIncomingRequest,
        setActiveRide,
        simulateDriverProgress,
        setRideHistory,
        landmarks: LANDMARKS,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
