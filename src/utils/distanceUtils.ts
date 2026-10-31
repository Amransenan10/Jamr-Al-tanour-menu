/**
 * Distance & Delivery Fee Pricing Utility for Jamr Al-Tannour
 */

// Default coordinates for branches if not set in DB
export const DEFAULT_BRANCH_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'السويدي الغربي': { lat: 24.5761708, lng: 46.6288971 },
  'طويق': { lat: 24.5593042, lng: 46.5714602 }
};

export interface RiyadhDistrict {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// Pre-configured delivery districts around Suwaidi & Tuwaiq branches
export const RIYADH_DELIVERY_DISTRICTS: RiyadhDistrict[] = [
  { id: 'suwaidi_west', name: 'حي السويدي الغربي', lat: 24.5760, lng: 46.6288 },
  { id: 'tuwaiq', name: 'حي طويق', lat: 24.5600, lng: 46.5700 },
  { id: 'suwaidi', name: 'حي السويدي', lat: 24.5900, lng: 46.6500 },
  { id: 'shubra', name: 'حي شبرا', lat: 24.5750, lng: 46.6580 },
  { id: 'urija_west', name: 'حي العريجاء الغربية', lat: 24.5980, lng: 46.5950 },
  { id: 'urija_mid', name: 'حي العريجاء الوسطى', lat: 24.6050, lng: 46.6150 },
  { id: 'urija_south', name: 'حي العريجاء الجنوبية', lat: 24.5850, lng: 46.6080 },
  { id: 'zahra', name: 'حي الزهرة', lat: 24.6020, lng: 46.6450 },
  { id: 'duraihimya', name: 'حي الدريهمية', lat: 24.5910, lng: 46.6710 },
  { id: 'namar', name: 'حي نمار', lat: 24.5500, lng: 46.6150 },
  { id: 'hazm', name: 'حي الحزم', lat: 24.5420, lng: 46.6500 },
  { id: 'sultana', name: 'حي سلطانة', lat: 24.6050, lng: 46.6650 },
  { id: 'badiah', name: 'حي البديعة', lat: 24.6150, lng: 46.6450 },
  { id: 'dhahrat_laban', name: 'حي ظهرة لبن', lat: 24.6300, lng: 46.5500 },
  { id: 'shifa', name: 'حي الشفاء', lat: 24.5300, lng: 46.6800 }
];

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
  const straightDistance = R * c;

  // Real-world driving route factor (road curvature & street routing in city, ~1.45x straight line)
  const ROAD_FACTOR = 1.45;
  const estimatedDrivingDistance = straightDistance * ROAD_FACTOR;

  return Math.round(estimatedDrivingDistance * 10) / 10; // Round to 1 decimal place (e.g. 5.8 km)
}

/**
 * Parses latitude and longitude from Google Maps URLs, district tags, or string coordinates
 */
export function extractCoordinatesFromLocation(locationStr: string): { lat: number; lng: number } | null {
  if (!locationStr || typeof locationStr !== 'string') return null;

  const trimmed = locationStr.trim();

  // Case 1: Tag [COORDS:24.1234,46.1234]
  const tagCoordsMatch = trimmed.match(/\[COORDS:(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\]/i);
  if (tagCoordsMatch) {
    const lat = parseFloat(tagCoordsMatch[1]);
    const lng = parseFloat(tagCoordsMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Case 2: Tag [DISTRICT:id]
  const tagDistrictMatch = trimmed.match(/\[DISTRICT:([a-z0-9_]+)\]/i);
  if (tagDistrictMatch) {
    const found = RIYADH_DELIVERY_DISTRICTS.find(d => d.id === tagDistrictMatch[1]);
    if (found) return { lat: found.lat, lng: found.lng };
  }

  // Case 3: URL query like ?q=24.5937,46.6111 or @24.5937,46.6111 or place/24.5937,46.6111
  const qMatch = trimmed.match(/(?:q=|@|loc:|ll=|place\/)(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Case 4: Plain coordinate pair like "24.5937, 46.6111"
  const plainMatch = trimmed.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (plainMatch) {
    const lat = parseFloat(plainMatch[1]);
    const lng = parseFloat(plainMatch[2]);
    // Extra validation for plausible Saudi latitude (15 - 32) and longitude (34 - 56)
    if (!isNaN(lat) && !isNaN(lng) && lat >= 10 && lat <= 35 && lng >= 30 && lng <= 60) {
      return { lat, lng };
    }
  }

  // Case 5: Direct match with known Riyadh district name
  const matchedDistrict = RIYADH_DELIVERY_DISTRICTS.find(d => 
    trimmed.includes(d.name) || trimmed.replace(/^(حي\s*)/, '') === d.name.replace(/^(حي\s*)/, '')
  );
  if (matchedDistrict) {
    return { lat: matchedDistrict.lat, lng: matchedDistrict.lng };
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

  // If customer location has NO valid GPS coordinates, do NOT allow order and do NOT default to 5 SAR!
  if (!customerCoords) {
    return {
      distanceKm: null,
      deliveryFee: 0,
      minOrderValue: 20,
      isAllowed: false,
      statusMessage: 'يرجى التقاط موقعك الجغرافي عبر زر الدبوس لحساب رسوم التوصيل بدقة والتأكد من نطاق التغطية.',
      tierLabel: 'الموقع غير محدد'
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
      tierLabel: `ضمن نطاق 4 كم (يبعد ${distanceKm} كم - رسوم 5 ر.س)`
    };
  }

  // Tier 2: 4.01 - 7.00 km -> 7 SAR delivery, min order 20 SAR
  if (distanceKm <= 7.0) {
    return {
      distanceKm,
      deliveryFee: 7,
      minOrderValue: 20,
      isAllowed: true,
      tierLabel: `نطاق متوسط (يبعد ${distanceKm} كم - رسوم 7 ر.س)`
    };
  }

  // Tier 3: 7.01 - 10.00 km -> 10 SAR delivery, min order 30 SAR
  if (distanceKm <= 10.0) {
    return {
      distanceKm,
      deliveryFee: 10,
      minOrderValue: 30,
      isAllowed: true,
      tierLabel: `نطاق أقصى (يبعد ${distanceKm} كم - رسوم 10 ر.س)`
    };
  }

  // Tier 4: > 10.00 km -> Out of Delivery Zone (BLOCKED)
  return {
    distanceKm,
    deliveryFee: 10,
    minOrderValue: 30,
    isAllowed: false,
    statusMessage: `موقعك يبعد ${distanceKm} كم عن فرع ${branchName}، وهو خارج نطاق التوصيل المسموح (الحد الأقصى للتوصيل 10 كم). يمكنك اختيار الاستلام من الفرع.`,
    tierLabel: `خارج نطاق التوصيل (يبعد ${distanceKm} كم)`
  };
}
