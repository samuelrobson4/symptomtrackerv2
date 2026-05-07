"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Symptoms" },
  { href: "/medications", label: "Medications" },
  { href: "/connections", label: "Connections" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-[#e0e0e0]">
      <div className="max-w-5xl mx-auto px-6 flex items-center gap-8 h-16">
        <span className="text-[#1a73e8] font-medium text-lg tracking-tight">
          HealthTracker
        </span>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#e8f0fe] text-[#1a73e8]"
                    : "text-[#5f6368] hover:bg-[#f1f3f4]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <a
            href="/api/export"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1a73e8] border border-[#1a73e8] rounded-full hover:bg-[#e8f0fe] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </a>
        </div>
      </div>
    </header>
  );
}
