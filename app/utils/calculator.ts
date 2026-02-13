import {
  ServiceCategory,
  CalculatorSelections,
  QuoteResult,
  SelectedService,
} from '../types/calculator';

// ============================================
// SERVICE CATEGORIES DATA
// In a real WordPress integration, this would
// come from the WordPress REST API via ACF fields
// ============================================
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'project_type',
    title: 'Project Type',
    icon: '🚀',
    multiSelect: false,
    options: [
      {
        id: 'landing_page',
        label: 'Landing Page',
        description: 'Single page, conversion-focused website',
        basePrice: 800,
        timelineWeeks: 1,
      },
      {
        id: 'business_website',
        label: 'Business Website',
        description: '5-10 pages with contact forms',
        basePrice: 2500,
        timelineWeeks: 3,
      },
      {
        id: 'ecommerce',
        label: 'E-Commerce Store',
        description: 'WooCommerce with product catalog',
        basePrice: 5000,
        timelineWeeks: 6,
      },
      {
        id: 'custom_web_app',
        label: 'Custom Web App',
        description: 'Complex application with user authentication',
        basePrice: 9000,
        timelineWeeks: 10,
      },
    ],
  },
  {
    id: 'design',
    title: 'Design',
    icon: '🎨',
    multiSelect: false,
    options: [
      {
        id: 'template',
        label: 'Premium Template',
        description: 'Customized premium WordPress theme',
        basePrice: 300,
        timelineWeeks: 1,
      },
      {
        id: 'custom_design',
        label: 'Custom Design',
        description: 'Unique design built from scratch',
        basePrice: 1500,
        timelineWeeks: 2,
      },
      {
        id: 'ui_system',
        label: 'Full UI System',
        description: 'Complete design system with Figma files',
        basePrice: 3000,
        timelineWeeks: 3,
      },
    ],
  },
  {
    id: 'features',
    title: 'Features & Integrations',
    icon: '⚡',
    multiSelect: true,
    options: [
      {
        id: 'contact_form',
        label: 'Contact Form',
        description: 'Advanced forms with email notifications',
        basePrice: 150,
        timelineWeeks: 0,
      },
      {
        id: 'blog',
        label: 'Blog / News Section',
        description: 'Full blog with categories and search',
        basePrice: 400,
        timelineWeeks: 1,
      },
      {
        id: 'multilingual',
        label: 'Multilingual (WPML)',
        description: 'Site in 2-3 languages',
        basePrice: 600,
        timelineWeeks: 1,
      },
      {
        id: 'react_component',
        label: 'React Interactive Feature',
        description: 'Custom React component (calculator, quiz, etc.)',
        basePrice: 800,
        timelineWeeks: 1,
      },
      {
        id: 'api_integration',
        label: 'Third-Party API',
        description: 'CRM, payment, maps, or data integration',
        basePrice: 700,
        timelineWeeks: 1,
      },
      {
        id: 'seo',
        label: 'SEO Optimization',
        description: 'Technical SEO, sitemap, schema markup',
        basePrice: 300,
        timelineWeeks: 0,
      },
    ],
  },
  {
    id: 'performance',
    title: 'Performance & Security',
    icon: '🛡️',
    multiSelect: true,
    options: [
      {
        id: 'basic',
        label: 'Basic (Caching + SSL)',
        description: 'Standard speed optimization and HTTPS',
        basePrice: 200,
        timelineWeeks: 0,
      },
      {
        id: 'advanced_perf',
        label: 'Advanced Performance',
        description: 'CDN, image optimization, 90+ PageSpeed score',
        basePrice: 500,
        timelineWeeks: 1,
      },
      {
        id: 'security',
        label: 'Security Hardening',
        description: 'Firewall, malware scanning, backup system',
        basePrice: 400,
        timelineWeeks: 0,
      },
    ],
  },
  {
    id: 'support',
    title: 'Ongoing Support',
    icon: '🔧',
    multiSelect: false,
    options: [
      {
        id: 'no_support',
        label: 'No Support Needed',
        description: 'One-time project delivery',
        basePrice: 0,
        timelineWeeks: 0,
      },
      {
        id: 'basic_support',
        label: 'Basic Support (3 months)',
        description: 'Bug fixes and minor updates',
        basePrice: 300,
        timelineWeeks: 0,
      },
      {
        id: 'full_support',
        label: 'Full Maintenance (1 year)',
        description: 'Updates, backups, security monitoring',
        basePrice: 900,
        timelineWeeks: 0,
      },
    ],
  },
];

// ============================================
// CALCULATOR LOGIC
// ============================================

export function calculateQuote(selections: CalculatorSelections): QuoteResult {
  const selectedServices: SelectedService[] = [];
  let totalPrice = 0;
  let totalWeeks = 0;

  // Loop through each category and its selections
  for (const category of SERVICE_CATEGORIES) {
    const selected = selections[category.id] || [];

    for (const optionId of selected) {
      const option = category.options.find((o) => o.id === optionId);
      if (!option) continue;

      selectedServices.push({
        categoryTitle: category.title,
        optionLabel: option.label,
        price: option.basePrice,
        weeks: option.timelineWeeks,
      });

      totalPrice += option.basePrice;
      // Timeline: parallel work possible, so take max not sum
      totalWeeks = Math.max(totalWeeks, option.timelineWeeks);
    }
  }

  // Add base timeline from project type
  const projectType = selections['project_type']?.[0];
  const projectOption = SERVICE_CATEGORIES[0].options.find(
    (o) => o.id === projectType
  );
  if (projectOption) {
    totalWeeks += projectOption.timelineWeeks;
  }

  // Volume discount: 10% off if total > 5000
  const discount = totalPrice > 5000 ? totalPrice * 0.1 : 0;
  const finalPrice = totalPrice - discount;

  // Determine tier
  let tier: QuoteResult['tier'] = 'starter';
  if (finalPrice > 8000) tier = 'enterprise';
  else if (finalPrice > 3000) tier = 'professional';

  return {
    totalPrice: Math.round(finalPrice),
    minPrice: Math.round(finalPrice * 0.9),
    maxPrice: Math.round(finalPrice * 1.15),
    totalWeeks: Math.max(totalWeeks, 1),
    selectedServices,
    tier,
  };
}

// Format CHF currency
export function formatCHF(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Get tier color
export function getTierColor(tier: QuoteResult['tier']): string {
  const colors = {
    starter: '#10b981',
    professional: '#3b82f6',
    enterprise: '#8b5cf6',
  };
  return colors[tier];
}

// Get tier label
export function getTierLabel(tier: QuoteResult['tier']): string {
  const labels = {
    starter: '🌱 Starter Package',
    professional: '⚡ Professional Package',
    enterprise: '🚀 Enterprise Package',
  };
  return labels[tier];
}

// ============================================
// SIMULATED WORDPRESS REST API CALLS
// In production, these would call real endpoints:
// GET /wp-json/wp/v2/posts
// GET /wp-json/wp/v2/calculator-config
// POST /wp-json/custom/v1/quote-submission
// ============================================

export async function fetchWordPressConfig(): Promise<{
  currency: string;
  discount_threshold: number;
  discount_percentage: number;
}> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  // This simulates: GET /wp-json/acf/v3/options/calculator_settings
  return {
    currency: 'CHF',
    discount_threshold: 5000,
    discount_percentage: 10,
  };
}

export async function submitQuoteToWordPress(
  formData: { name: string; email: string; company: string; message: string },
  quote: QuoteResult
): Promise<{ success: boolean; message: string; submissionId: number }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // This simulates: POST /wp-json/custom/v1/quote-submission
  // In real WordPress, this would:
  // 1. Create a custom post type "quote_submission"
  // 2. Save form data as post meta
  // 3. Send email notification via wp_mail()
  // 4. Return the post ID

  // Simulate occasional errors (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('WordPress API temporarily unavailable. Please try again.');
  }

  return {
    success: true,
    message: `Quote submitted successfully! We'll contact ${formData.email} within 24 hours.`,
    submissionId: Math.floor(Math.random() * 9000) + 1000,
  };
}
