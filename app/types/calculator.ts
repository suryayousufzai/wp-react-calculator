// ============================================
// TypeScript Types & Interfaces
// This file defines all data shapes used in
// the WordPress Project Cost Calculator
// ============================================

// Individual service option the client can select
export interface ServiceOption {
  id: string;
  label: string;
  description: string;
  basePrice: number;
  timelineWeeks: number;
}

// Category of services (e.g. Design, Development, Extras)
export interface ServiceCategory {
  id: string;
  title: string;
  icon: string;
  options: ServiceOption[];
  multiSelect: boolean; // can user pick multiple options?
}

// The user's current selections
export interface CalculatorSelections {
  [categoryId: string]: string[]; // categoryId -> array of selected option IDs
}

// Final quote result
export interface QuoteResult {
  totalPrice: number;
  minPrice: number;
  maxPrice: number;
  totalWeeks: number;
  selectedServices: SelectedService[];
  tier: 'starter' | 'professional' | 'enterprise';
}

export interface SelectedService {
  categoryTitle: string;
  optionLabel: string;
  price: number;
  weeks: number;
}

// WordPress REST API - Post type (simulated)
export interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  slug: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
  };
}

// WordPress REST API - Pricing config (custom endpoint)
export interface WordPressPricingConfig {
  id: number;
  title: { rendered: string };
  acf: {
    base_multiplier: number;
    currency: string;
    discount_threshold: number;
    discount_percentage: number;
  };
}

// Submission state for the quote form
export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

// Form data for quote submission
export interface QuoteFormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}
