'use client';

import { useState } from 'react';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  pricePeriod: string;
  features: string[];
  ctaText: string;
  ctaVariant: 'primary' | 'secondary';
  isPopular?: boolean;
  isFree?: boolean;
}

interface PricingCardProps {
  onSelectPlan?: (planId: string) => void;
}

export default function PricingCard({ onSelectPlan }: PricingCardProps) {
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>('yearly');

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'For starters',
      price: 'Free',
      pricePeriod: '',
      features: [
        'Full Bible access',
        '1 episode per day',
        '3 conversations per day',
        'Email support',
      ],
      ctaText: 'Continue with Free',
      ctaVariant: 'secondary',
      isFree: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For individual scholars and students.',
      price: billingFrequency === 'yearly' ? '$99' : '$10',
      pricePeriod: billingFrequency === 'yearly' ? '/year' : '/month',
      features: [
        'Full Bible access',
        'Unlimited episodes per day',
        'Unlimited conversations per day',
        'Priority email support',
      ],
      ctaText: 'Get started',
      ctaVariant: 'primary',
      isPopular: true,
    },
    {
      id: 'organization',
      name: 'Organization',
      description: 'For institutions and congregations.',
      price: billingFrequency === 'yearly' ? '$90' : '$10',
      pricePeriod: billingFrequency === 'yearly' ? '/user/year' : '/user/month',
      features: [
        'User management',
        'Content distribution',
        'Conversation management',
        'Email support',
      ],
      ctaText: 'Contact us',
      ctaVariant: 'secondary',
    },
  ];

  const handlePlanClick = (planId: string) => {
    onSelectPlan?.(planId);
  };

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
          ):
          (
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
            key={plan.name}
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
              onClick={() => handlePlanClick(plan.id)}
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
