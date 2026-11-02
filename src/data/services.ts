// src/data/services.ts

export interface ServiceProductItem {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  features?: string[];
  badge?: string;
  iconName?: 'Sun' | 'Cpu' | 'Zap';
}

export const realProducts: ServiceProductItem[] = [
  {
    id: '1',
    title: 'Solar Backup & Inverter Installation',
    description: 'Reliable residential and commercial solar power systems engineered for zero downtime by Engr. Abiodun Ajayi.',
    price: 'Negotiate on WhatsApp',
    category: 'Power Systems',
    badge: 'Popular Renewable',
    iconName: 'Sun',
    features: [
      'Pure sine wave hybrid inverters (1kVA - 50kVA)',
      'High-capacity Grade-A Lithium LiFePO4 battery banks',
      'Tier-1 monocrystalline solar panels with roof waterproofing',
      'Automated seamless grid/solar switchover',
    ],
  },
  {
    id: '2',
    title: 'Smart Home Automation',
    description: 'Advanced lighting, security, and climate control integration tailored for modern homes by Engr. Abiodun Ajayi.',
    price: 'Negotiate on WhatsApp',
    category: 'Automation',
    badge: 'Smart Living',
    iconName: 'Cpu',
    features: [
      'Touch glass switches & wireless app control',
      'Automated lighting scenes & occupancy sensors',
      'CCTV, video doorbell & smart lock integration',
      'Alexa & Google Home voice command synchronisation',
    ],
  },
  {
    id: '3',
    title: 'Electrical Infrastructure & Wiring',
    description: 'Professional commercial and residential electrical design, maintenance, and fault resolution by Engr. Abiodun Ajayi.',
    price: 'Negotiate on WhatsApp',
    category: 'Electrical',
    badge: 'Certified Engineering',
    iconName: 'Zap',
    features: [
      'Full conduit piping and 3-phase load-balanced cabling',
      'Distribution board (DB) and surge protection setup',
      'Luxury chandelier rigging and architectural lighting',
      'Comprehensive earthing and lightning arrestor systems',
    ],
  },
];
