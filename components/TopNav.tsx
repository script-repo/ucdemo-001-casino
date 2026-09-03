"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { DEMO_USER } from "@/lib/demo-content";

/**
 * Only routes that exist are listed. "Applications" jumps to the catalogue on
 * the dashboard rather than being a separate page, because the dashboard is the
 * catalogue.
 */
const NAV = [
  { label: "Home", href: "/", match: (path: string) => path === "/" },
  {
    label: "Applications",
    href: "/#applications",
    match: (path: string) => path.startsWith("/use-cases"),
  },
  {
    label: "Resources",
    href: "/resources",
    match: (path: string) => path.startsWith("/resources"),
  },
];

export function TopNav() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-8 px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3"
          aria-label="Enterprise AI Portal home"
        >
          <svg viewBox="0 0 24 24" className="size-7 text-gold-500" aria-hidden>
            <path
              d="M12 2 22 12 12 22 2 12 12 2Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path d="M12 7 17 12 12 17 7 12 12 7Z" fill="currentColor" />
          </svg>
          <span className="font-serif text-lg tracking-tight text-navy-950">
            Enterprise AI Portal
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-4 py-5 text-sm transition-colors ${
                  active
                    ? "text-burgundy-700"
                    : "text-charcoal-700 hover:text-navy-950"
                }`}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-3 bottom-0 h-0.5 bg-gold-500"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {/* A GET form so search works from any page: the dashboard reads ?q. */}
          <form action="/" className="hidden lg:block">
            <label htmlFor="nav-search" className="sr-only">
              Search applications
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-700">
                <Icon name="search" className="size-4" />
              </span>
              <input
                id="nav-search"
                name="q"
                type="search"
                placeholder="Search applications"
                className="w-56 rounded-md border border-stone-200 bg-mist-100 py-2 pl-9 pr-3 text-sm text-charcoal-900 placeholder:text-slate-700 focus:border-navy-700 focus:outline-none"
              />
            </div>
          </form>

          {/* Section 35.1 — classification stays visible on operational surfaces. */}
          <span className="hidden rounded-sm border border-stone-200 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-700 sm:inline">
            Internal
          </span>

          <div className="flex items-center gap-3">
            <span
              className="grid size-9 place-items-center rounded-full bg-burgundy-700 text-xs font-semibold text-white"
              aria-hidden
            >
              {DEMO_USER.initials}
            </span>
            <span className="hidden leading-tight xl:block">
              <span className="block text-sm text-charcoal-900">
                {DEMO_USER.name}
              </span>
              <span className="block text-xs text-slate-700">
                {DEMO_USER.role}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
