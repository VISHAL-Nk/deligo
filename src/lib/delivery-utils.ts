// Generate a random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Verify OTP
export function verifyOTP(inputOTP: string, savedOTP: string): boolean {
  return inputOTP === savedOTP;
}

// Generate tracking number
export function generateTrackingNumber(): string {
  const prefix = "DLG";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate delivery earnings based on distance and time
export function calculateDeliveryEarnings(
  distanceKm: number,
  isPeakHour: boolean = false
): {
  baseAmount: number;
  distanceBonus: number;
  peakHourBonus: number;
  totalAmount: number;
  platformCommission: number;
  netAmount: number;
} {
  const BASE_FEE = 30; // Base delivery fee in rupees
  const PER_KM_RATE = 8; // Rate per kilometer
  const PEAK_HOUR_MULTIPLIER = 1.5;
  const COMMISSION_RATE = 0.15; // 15% platform commission

  const baseAmount = BASE_FEE;
  let distanceBonus = 0;

  // Add distance bonus for distances over 3 km
  if (distanceKm > 3) {
    distanceBonus = (distanceKm - 3) * PER_KM_RATE;
  }

  // Calculate total before peak hour
  let totalAmount = baseAmount + distanceBonus;

  // Peak hour bonus
  let peakHourBonus = 0;
  if (isPeakHour) {
    peakHourBonus = totalAmount * (PEAK_HOUR_MULTIPLIER - 1);
    totalAmount += peakHourBonus;
  }

  // Platform commission
  const platformCommission = totalAmount * COMMISSION_RATE;
  const netAmount = totalAmount - platformCommission;

  return {
    baseAmount,
    distanceBonus: Math.round(distanceBonus * 100) / 100,
    peakHourBonus: Math.round(peakHourBonus * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    platformCommission: Math.round(platformCommission * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  };
}

// Check if current time is peak hour (e.g., 12-2 PM, 7-10 PM)
export function isPeakHour(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return (hour >= 12 && hour < 14) || (hour >= 19 && hour < 22);
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Calculate ETA based on distance
export function calculateETA(distanceKm: number): number {
  const AVERAGE_SPEED_KMH = 25; // Average delivery speed
  const minutes = (distanceKm / AVERAGE_SPEED_KMH) * 60;
  return Math.ceil(minutes);
}
