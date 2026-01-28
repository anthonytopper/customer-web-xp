'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface UserDropdownProps {
  userName?: string | null;
}

export function UserDropdown({ userName }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A181D] rounded-full"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity">
          {userName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1A181D]"></div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1A181D] dark:bg-[#1A181D] rounded-lg shadow-lg border border-zinc-800 py-1 z-50">
          <Link
            href="/account/manage"
            className="block px-4 py-2 text-sm text-white hover:bg-zinc-800 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            My Account
          </Link>
          <a
            href="/auth/logout"
            className="block px-4 py-2 text-sm text-red-300 hover:bg-zinc-800 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Logout
          </a>
        </div>
      )}
    </div>
  );
}
