export interface Location {
  name: string;
  x: number; // canvas x-coordinate (0-1000)
  y: number; // canvas y-coordinate (0-1000)
}

export type VehicleType = "bike" | "auto" | "mini" | "sedan" | "xl";

export interface VehicleDetails {
  type: VehicleType;
  name: string;
  capacity: number;
  baseFare: number;
  ratePerKm: number;
  eta: number; // minutes
  icon: string;
  description: string;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  avatar: string;
  vehicleName: string;
  licensePlate: string;
  type: VehicleType;
  x: number;
  y: number;
  status: "idle" | "busy" | "offline";
  angle: number;
  targetX?: number;
  targetY?: number;
}

export interface Ride {
  id: string;
  pickup: Location;
  destination: Location;
  vehicleType: VehicleType;
  fare: number;
  distance: number; // in km
  otp: string;
  status: "idle" | "searching" | "assigned" | "in-progress" | "completed" | "cancelled";
  driver?: Driver;
  progress: number; // 0 to 100
  driverRating?: number;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  date: string;
}
