'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Articles", href: "/home/articles" },
  { label: "Saved Articles", href: "/home/saved-articles" },
  { label: "Reading Plans", href: "/home/reading-plans" },
  { label: "Library", href: "/home/library" },
  { label: "Conversations", href: "/home/conversations", disabled: true },
  { label: "Notebook", href: "/home/notebook", disabled: true },
];

export default function HomeSubnav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const baseClasses =
          "rounded-full border px-3.5 py-2.5 text-sm leading-[1.268] transition-colors";
        const activeClasses =
          "bg-[#3C3D47] text-white border-[#3C3D47] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]";
        const inactiveClasses =
          "bg-white text-[#3C3D47] border-[#BFBFC1] hover:border-[#3C3D47]";
        const disabledClasses =
          "bg-[#EDEFF0] text-[#3C3D47] border-[#BFBFC1] opacity-50 pointer-events-none";
        const className = [
          baseClasses,
          item.disabled ? disabledClasses : isActive ? activeClasses : inactiveClasses,
        ]
          .filter(Boolean)
          .join(" ");

        const buttonStyle = {
          fontFamily: "var(--font-inter), sans-serif",
        };

        if (item.disabled) {
          return (
            <span
              key={item.href}
              className={className}
              style={buttonStyle}
              aria-disabled="true"
            >
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={className}
            style={buttonStyle}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
