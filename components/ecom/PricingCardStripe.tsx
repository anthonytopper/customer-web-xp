'use client';

import { useState, useEffect } from 'react';
import type { StripeProduct } from '@/app/api/stripe/products/route';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  pricePeriod: string;
  priceId: string;
  features: string[];
  ctaText: string;
  ctaVariant: 'primary' | 'secondary';
  isPopular?: boolean;
  isFree?: boolean;
}

interface PricingCardStripeProps {
  onSelectPlan?: (planId: string, priceId: string) => void;
}

export default function PricingCardStripe({ onSelectPlan }: PricingCardStripeProps) {
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>('yearly');
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/stripe/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatPrice = (amount: number | null, currency: string): string => {
    if (amount === null) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getPricePeriod = (interval: 'month' | 'year' | null, intervalCount: number): string => {
    if (!interval) return '';
    if (interval === 'month') {
      return intervalCount === 1 ? '/month' : `/${intervalCount} months`;
    }
    if (interval === 'year') {
      return intervalCount === 1 ? '/year' : `/${intervalCount} years`;
    }
    return '';
  };

  const convertToPlans = (products: StripeProduct[]): PricingPlan[] => {
    const plans: (PricingPlan | null)[] = products.map((product) => {
      // Find prices for the selected billing frequency
      const relevantPrices = product.prices.filter((price) => {
        if (!price.recurring) return false;
        const interval = price.recurring.interval;
        return billingFrequency === 'yearly' ? interval === 'year' : interval === 'month';
      });

      // If no prices for selected frequency, try to find any recurring price
      const pricesToUse = relevantPrices.length > 0 
        ? relevantPrices 
        : product.prices.filter((p) => p.recurring !== null);

      if (pricesToUse.length === 0) return null;

      // Use the first price (you might want to add logic to select the "default" one)
      const selectedPrice = pricesToUse[0];
      const isFree = selectedPrice.unit_amount === null || selectedPrice.unit_amount === 0;

      // Extract features from metadata or use description
      const features: string[] = [];
      if (product.metadata?.features) {
        try {
          const parsedFeatures = JSON.parse(product.metadata.features);
          if (Array.isArray(parsedFeatures)) {
            features.push(...parsedFeatures);
          }
        } catch {
          // If parsing fails, try splitting by comma or newline
          features.push(...product.metadata.features.split(/[,\n]/).map(f => f.trim()).filter(Boolean));
        }
      } else if (product.description) {
        // Fallback: split description by newlines or bullets
        features.push(...product.description.split(/\n|•/).map(f => f.trim()).filter(Boolean).slice(0, 4));
      }

      // Default features if none found
      if (features.length === 0) {
        features.push('Full access', 'Premium features', 'Email support');
      }

      // Determine if popular (from metadata or first product)
      const isPopular = product.metadata?.popular === 'true' || 
                       (products.length > 0 && products[0].id === product.id);

      return {
        id: product.id,
        name: product.name,
        description: product.metadata?.description || product.description || '',
        price: isFree ? 'Free' : formatPrice(selectedPrice.unit_amount, selectedPrice.currency),
        pricePeriod: isFree ? '' : getPricePeriod(selectedPrice.recurring?.interval || null, selectedPrice.recurring?.interval_count || 1),
        priceId: selectedPrice.id,
        features: features.slice(0, 4), // Limit to 4 features for UI consistency
        ctaText: isFree ? 'Continue with Free' : 'Get started',
        ctaVariant: isPopular ? 'primary' : 'secondary',
        isPopular: isPopular || false,
        isFree,
      };
    });

    return plans
      .filter((plan): plan is PricingPlan => plan !== null)
      .sort((a, b) => {
        // Sort: free first, then by price
        if (a.isFree && !b.isFree) return -1;
        if (!a.isFree && b.isFree) return 1;
        if (a.isFree && b.isFree) return 0;
        
        // Extract numeric price for sorting
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
        return priceA - priceB;
      });
  };

  const handlePlanClick = (plan: PricingPlan) => {
    onSelectPlan?.(plan.id, plan.priceId);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
        <div className="text-center">
          <p className="text-lg text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const plans = convertToPlans(products);

  if (plans.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
        <div className="text-center">
          <p className="text-lg text-gray-600">No pricing plans available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <p className="mb-4 text-sm font-medium text-blue-600">Pricing</p>
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          Get unlimited access.
        </h1>
        <p className="text-lg text-gray-600">
          Discover the ideal plan, beginning at under $2 per week.
        </p>
      </div>

      {/* Billing Frequency Toggle */}
      <div className="mb-12 flex rounded-full bg-gray-200 p-1">
        <button
          onClick={() => setBillingFrequency('monthly')}
          className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
            billingFrequency === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-gray-600 hover:text-gray-700'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingFrequency('yearly')}
          className={`relative rounded-full px-6 py-2 text-sm font-medium transition-colors ${
            billingFrequency === 'yearly'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-gray-600 hover:text-gray-700'
          }`}
        >
          Yearly
          {billingFrequency === 'yearly' ? (
            <span className="ml-2 rounded-full bg-blue-700 px-2 py-0.5 text-xs">
              Save 25%
            </span>
          ) : (
            <span className="ml-2 rounded-full bg-gray-300 px-2 py-0.5 text-xs">
              Save 25%
            </span>
          )}
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="mb-12 grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl bg-white p-8 shadow-md ${
              plan.isPopular ? 'border-2 border-blue-500' : 'border border-gray-200'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 right-6 rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">
                Most Popular
              </div>
            )}

            <h3 className="mb-2 text-2xl font-bold text-gray-900">{plan.name}</h3>
            <p className="mb-6 text-sm text-gray-600">{plan.description}</p>

            <div className="mb-6">
              {plan.isFree ? (
                <div className="text-4xl font-bold text-gray-900">Free</div>
              ) : (
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="ml-2 text-sm text-gray-600">{plan.pricePeriod}</span>
                </div>
              )}
            </div>

            <ul className="mb-8 space-y-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanClick(plan)}
              className={`w-full rounded-lg py-3 px-4 font-medium transition-colors ${
                plan.ctaVariant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {plan.ctaText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Check Icon Component
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
