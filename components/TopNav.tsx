"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { DEMO_USER } from "@/lib/demo-content";

const NAV = [
  { label: "Home", href: "/", match: (path: string) => path === "/" },
  {
    label: "Applications",
    href: "/#applications",
    match: (path: string) => path.startsWith("/use-cases"),
  },
  {
    label: "Players",
    href: "/cms",
    match: (path: string) => path.startsWith("/cms"),
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
    <header className="sticky top-0 z-40 border-b border-gold-500/25 bg-navy-950 text-ivory-100">
      <div className="mx-auto flex h-[4.5rem] max-w-[1680px] items-center gap-8 px-6">
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
          <span className="leading-tight">
            <span className="block font-serif text-lg tracking-tight text-ivory-100">
              Enterprise AI Portal
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-300">
              Casino &amp; Resort
            </span>
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
                className={`relative px-4 py-6 text-sm tracking-wide transition-colors ${
                  active
                    ? "text-gold-300"
                    : "text-ivory-100/70 hover:text-ivory-100"
                }`}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-3 bottom-0 h-px bg-gold-500"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <form action="/" className="hidden lg:block">
            <label htmlFor="nav-search" className="sr-only">
              Search applications
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gold-300">
                <Icon name="search" className="size-4" />
              </span>
              <input
                id="nav-search"
                name="q"
                type="search"
                placeholder="Search applications"
                className="w-56 rounded-md border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-ivory-100 placeholder:text-ivory-100/45 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </form>

          <span className="hidden rounded-sm border border-gold-500/30 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-gold-300 sm:inline">
            Internal
          </span>

          <div className="flex items-center gap-3">
            <span
              className="grid size-9 place-items-center rounded-full bg-burgundy-700 text-xs font-semibold text-ivory-100"
              aria-hidden
            >
              {DEMO_USER.initials}
            </span>
            <span className="hidden leading-tight xl:block">
              <span className="block text-sm text-ivory-100">
                {DEMO_USER.name}
              </span>
              <span className="block text-xs text-ivory-100/60">
                {DEMO_USER.role}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
