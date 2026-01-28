'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon } from '@/components/icons/HomeIcon';
import { ReadIcon } from '@/components/icons/ReadIcon';
import { ListenIcon } from '@/components/icons/ListenIcon';
import { ReflectIcon } from '@/components/icons/ReflectIcon';

const iconMap: Record<string, React.ComponentType> = {
  '/': HomeIcon,
  '/reader': ReadIcon,
  '/listen': ListenIcon,
  '/notebook': ReflectIcon,
};

export function NavigationContent() {
  const pathname = usePathname();
  
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Read', href: '/reader' },
    { label: 'Listen', href: '/listen' },
    { label: 'Reflect', href: '/notebook' },
  ];

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 dark:bg-[#1A181D] bg-slate-100 rounded-full px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const IconComponent = iconMap[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              isActive
                ? 'text-blue-500 bg-blue-500/10'
                : 'dark:text-white text-slate-700 hover:opacity-70'
            }`}
            title={item.label}
          >
            {IconComponent && <IconComponent />}
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
