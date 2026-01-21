// Mock data for testing the customer confirmation workflow
// Use ?mock=true URL parameter to enable mock mode

export interface MockShopSelection {
  id: string;
  shop_id: string;
  name: string;
  address: string;
  city: string;
  distance_km: number;
  estimated_price: number;
  rating: number;
  total_reviews: number;
  priority_order: number;
  is_mobile_service: boolean;
  adas_calibration_capability: boolean;
}

export interface MockLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

export interface MockCostEstimate {
  id: string;
  line_items: MockLineItem[];
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  notes?: string;
  created_at: string;
}

export interface MockJobData {
  id: string;
  customer_name: string;
  customer_email: string;
  service_type: string;
  damage_type: string;
  workflow_stage: 'new' | 'shop_selection' | 'awaiting_smartscan' | 'cost_approval' | 'approved' | 'completed';
  shop_selections?: MockShopSelection[];
  cost_estimate?: MockCostEstimate;
  customer_shop_selection?: string;
  customer_cost_approved?: boolean;
  vehicle_info?: {
    make: string;
    model: string;
    year: number;
  };
}

export const mockShopSelections: MockShopSelection[] = [
  {
    id: 'sel-1',
    shop_id: 'shop-autoglass-pro',
    name: 'AutoGlass Pro Berlin',
    address: 'Hauptstraße 123',
    city: 'Berlin',
    distance_km: 2.3,
    estimated_price: 299,
    rating: 4.8,
    total_reviews: 156,
    priority_order: 1,
    is_mobile_service: true,
    adas_calibration_capability: true,
  },
  {
    id: 'sel-2',
    shop_id: 'shop-glassfix',
    name: 'GlassFix Express',
    address: 'Berliner Allee 45',
    city: 'Berlin',
    distance_km: 4.1,
    estimated_price: 279,
    rating: 4.5,
    total_reviews: 89,
    priority_order: 2,
    is_mobile_service: false,
    adas_calibration_capability: true,
  },
  {
    id: 'sel-3',
    shop_id: 'shop-carglass-partner',
    name: 'Carglass Partner Mitte',
    address: 'Friedrichstraße 200',
    city: 'Berlin',
    distance_km: 5.8,
    estimated_price: 319,
    rating: 4.9,
    total_reviews: 234,
    priority_order: 3,
    is_mobile_service: true,
    adas_calibration_capability: true,
  },
];

export const mockCostEstimate: MockCostEstimate = {
  id: 'estimate-1',
  line_items: [
    {
      id: 'item-1',
      name: 'OEM Windshield',
      description: 'Original equipment manufacturer windshield glass',
      quantity: 1,
      unit_price: 180,
    },
    {
      id: 'item-2',
      name: 'Adhesive Kit',
      description: 'Professional grade urethane adhesive',
      quantity: 1,
      unit_price: 35,
    },
    {
      id: 'item-3',
      name: 'Primer Set',
      description: 'Glass and body primer',
      quantity: 1,
      unit_price: 15,
    },
    {
      id: 'item-4',
      name: 'ADAS Calibration',
      description: 'Camera and sensor recalibration',
      quantity: 1,
      unit_price: 89,
    },
  ],
  labor_cost: 120,
  parts_cost: 319,
  total_cost: 439,
  notes: 'Includes 2-year warranty on installation. ADAS calibration required due to camera-equipped windshield.',
  created_at: new Date().toISOString(),
};

export const mockJobStages: Record<string, MockJobData> = {
  // Job waiting for customer to select a shop
  'mock-shop-selection': {
    id: 'mock-shop-selection',
    customer_name: 'Max Mustermann',
    customer_email: 'max@example.com',
    service_type: 'replacement',
    damage_type: 'windshield_crack',
    workflow_stage: 'shop_selection',
    shop_selections: mockShopSelections,
    vehicle_info: {
      make: 'BMW',
      model: '3 Series',
      year: 2021,
    },
  },
  // Job waiting for customer cost approval
  'mock-cost-approval': {
    id: 'mock-cost-approval',
    customer_name: 'Anna Schmidt',
    customer_email: 'anna@example.com',
    service_type: 'replacement',
    damage_type: 'windshield_crack',
    workflow_stage: 'cost_approval',
    customer_shop_selection: 'shop-autoglass-pro',
    cost_estimate: mockCostEstimate,
    vehicle_info: {
      make: 'Mercedes',
      model: 'C-Class',
      year: 2022,
    },
  },
  // Job fully approved
  'mock-approved': {
    id: 'mock-approved',
    customer_name: 'Peter Müller',
    customer_email: 'peter@example.com',
    service_type: 'replacement',
    damage_type: 'windshield_crack',
    workflow_stage: 'approved',
    customer_shop_selection: 'shop-autoglass-pro',
    customer_cost_approved: true,
    cost_estimate: mockCostEstimate,
    vehicle_info: {
      make: 'Audi',
      model: 'A4',
      year: 2020,
    },
  },
};

// Available shops for insurer to select from
export const mockAvailableShops = [
  {
    id: 'shop-autoglass-pro',
    name: 'AutoGlass Pro Berlin',
    address: 'Hauptstraße 123',
    city: 'Berlin',
    postal_code: '10115',
    rating: 4.8,
    total_reviews: 156,
    is_mobile_service: true,
    adas_calibration_capability: true,
    acceptance_rate: 0.95,
    response_time_minutes: 15,
    quality_score: 4.9,
  },
  {
    id: 'shop-glassfix',
    name: 'GlassFix Express',
    address: 'Berliner Allee 45',
    city: 'Berlin',
    postal_code: '10178',
    rating: 4.5,
    total_reviews: 89,
    is_mobile_service: false,
    adas_calibration_capability: true,
    acceptance_rate: 0.88,
    response_time_minutes: 25,
    quality_score: 4.6,
  },
  {
    id: 'shop-carglass-partner',
    name: 'Carglass Partner Mitte',
    address: 'Friedrichstraße 200',
    city: 'Berlin',
    postal_code: '10117',
    rating: 4.9,
    total_reviews: 234,
    is_mobile_service: true,
    adas_calibration_capability: true,
    acceptance_rate: 0.92,
    response_time_minutes: 20,
    quality_score: 4.8,
  },
  {
    id: 'shop-quick-glass',
    name: 'QuickGlass Berlin',
    address: 'Kurfürstendamm 50',
    city: 'Berlin',
    postal_code: '10707',
    rating: 4.3,
    total_reviews: 67,
    is_mobile_service: false,
    adas_calibration_capability: false,
    acceptance_rate: 0.85,
    response_time_minutes: 30,
    quality_score: 4.4,
  },
  {
    id: 'shop-premium-auto',
    name: 'Premium Auto Glass',
    address: 'Potsdamer Platz 1',
    city: 'Berlin',
    postal_code: '10785',
    rating: 4.7,
    total_reviews: 112,
    is_mobile_service: true,
    adas_calibration_capability: true,
    acceptance_rate: 0.90,
    response_time_minutes: 18,
    quality_score: 4.7,
  },
];

// Common BOM items for cost estimation
export const mockBomTemplates = {
  repair: [
    { name: 'Resin Kit', description: 'Professional grade repair resin', unit_price: 25 },
    { name: 'UV Lamp', description: 'Curing light rental', unit_price: 10 },
    { name: 'Polishing Compound', description: 'Final finish compound', unit_price: 8 },
  ],
  replacement: [
    { name: 'OEM Windshield', description: 'Original equipment manufacturer glass', unit_price: 180 },
    { name: 'Adhesive Kit', description: 'Professional urethane adhesive', unit_price: 35 },
    { name: 'Primer Set', description: 'Glass and body primer', unit_price: 15 },
    { name: 'Molding Clips', description: 'Replacement trim clips', unit_price: 12 },
  ],
  adas: [
    { name: 'ADAS Calibration', description: 'Camera and sensor recalibration', unit_price: 89 },
    { name: 'Target Equipment', description: 'Calibration target rental', unit_price: 25 },
  ],
};
