"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { NAV_LINKS, SITE } from "@/lib/content/site-config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-canvas/95 backdrop-blur-md">
      <Container>
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-md py-2"
            onClick={() => setOpen(false)}
          >
            <span className="brand-glyph" aria-hidden="true">
              <span />
            </span>
            <span className="text-sm font-bold tracking-tight text-content sm:text-base">
              {SITE.name}
            </span>
            <Badge>BETA</Badge>
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1 lg:gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-content-muted transition-colors hover:bg-surface-raised hover:text-content"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-content md:hidden"
          >
            <span className="flex flex-col gap-1" aria-hidden="true">
              <span className={cn("h-px w-4 bg-current transition-transform", open && "translate-y-[3px] rotate-45")} />
              <span className={cn("h-px w-4 bg-current transition-transform", open && "-translate-y-[3px] -rotate-45")} />
            </span>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </Container>

      <div
        ref={menuRef}
        id="mobile-navigation"
        hidden={!open}
        className="border-t border-border bg-surface md:hidden"
      >
        <Container>
          <nav aria-label="Mobile" className="py-3">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block min-h-12 rounded-lg px-3 py-3 text-base text-content-muted hover:bg-surface-raised hover:text-content"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>
    </header>
  );
}
