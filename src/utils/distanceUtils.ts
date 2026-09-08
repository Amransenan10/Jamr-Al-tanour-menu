/**
 * Distance & Delivery Fee Pricing Utility for Jamr Al-Tannour
 */

// Default coordinates for branches if not set in DB
export const DEFAULT_BRANCH_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'السويدي الغربي': { lat: 24.5937, lng: 46.6111 },
  'طويق': { lat: 24.5772, lng: 46.5412 }
};

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Parses latitude and longitude from Google Maps URLs or string coordinates
 */
export function extractCoordinatesFromLocation(locationStr: string): { lat: number; lng: number } | null {
  if (!locationStr) return null;

  // Case 1: URL query like ?q=24.5937,46.6111 or @24.5937,46.6111
  const qMatch = locationStr.match(/(?:q=|@|loc:)(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/i);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Case 2: Plain coordinate pair like "24.5937, 46.6111"
  const plainMatch = locationStr.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (plainMatch) {
    const lat = parseFloat(plainMatch[1]);
    const lng = parseFloat(plainMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  return null;
}

export interface DeliveryRulesResult {
  distanceKm: number | null;
  deliveryFee: number;
  minOrderValue: number;
  isAllowed: boolean;
  statusMessage?: string;
  tierLabel?: string;
}

/**
 * Calculates delivery fee, minimum order value, and availability based on distance
 */
export function getDeliveryPricingRules(
  customerLocationStr: string,
  branchName: string,
  branchLat?: number | null,
  branchLng?: number | null
): DeliveryRulesResult {
  // Extract customer coordinates
  const customerCoords = extractCoordinatesFromLocation(customerLocationStr);

  // If customer location is plain text address without GPS coordinates, return base default
  if (!customerCoords) {
    return {
      distanceKm: null,
      deliveryFee: 5,
      minOrderValue: 20,
      isAllowed: true,
      tierLabel: 'رسوم افتراضية (عن طريق العنوان النصي)'
    };
  }

  // Determine branch coordinates
  let bLat = branchLat;
  let bLng = branchLng;

  if (!bLat || !bLng) {
    const defaultCoords = DEFAULT_BRANCH_COORDINATES[branchName] || DEFAULT_BRANCH_COORDINATES['السويدي الغربي'];
    bLat = defaultCoords.lat;
    bLng = defaultCoords.lng;
  }

  // Compute exact distance in KM
  const distanceKm = calculateHaversineDistance(bLat, bLng, customerCoords.lat, customerCoords.lng);

  // Apply delivery rules based on distance tiers:
  // Tier 1: 0 - 4.00 km -> 5 SAR delivery, min order 20 SAR
  if (distanceKm <= 4.0) {
    return {
      distanceKm,
      deliveryFee: 5,
      minOrderValue: 20,
      isAllowed: true,
      tierLabel: `ضمن نطاق 4 كم (يبعد ${distanceKm} كم)`
    };
  }

  // Tier 2: 4.01 - 7.00 km -> 7 SAR delivery, min order 20 SAR
  if (distanceKm <= 7.0) {
    return {
      distanceKm,
      deliveryFee: 7,
      minOrderValue: 20,
      isAllowed: true,
      tierLabel: `نطاق متوسط (يبعد ${distanceKm} كم)`
    };
  }

  // Tier 3: 7.01 - 10.00 km -> 10 SAR delivery, min order 30 SAR
  if (distanceKm <= 10.0) {
    return {
      distanceKm,
      deliveryFee: 10,
      minOrderValue: 30,
      isAllowed: true,
      tierLabel: `نطاق بعيد (يبعد ${distanceKm} كم)`
    };
  }

  // Tier 4: > 10.00 km -> Out of Delivery Zone
  return {
    distanceKm,
    deliveryFee: 10,
    minOrderValue: 30,
    isAllowed: false,
    statusMessage: `موقعك يبعد ${distanceKm} كم عن فرع ${branchName}، وهو خارج نطاق التوصيل المسموح (أقصى حد للتوصيل 10 كم). يمكنك اختيار الاستلام من الفرع.`,
    tierLabel: `خارج نطاق التوصيل (يبعد ${distanceKm} كم)`
  };
}
