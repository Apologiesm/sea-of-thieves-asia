"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { NAV_LINKS, SITE } from "@/lib/content/site-config";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function AccountLinks({ user, mobile }: { user: User | null; mobile: boolean }) {
  const linkClass = mobile
    ? "block min-h-12 rounded-lg px-3 py-3 text-base text-content-muted hover:bg-surface-raised hover:text-content"
    : "inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-content-muted hover:bg-surface-raised hover:text-content";

  if (!user) {
    return (
      <Link href="/login" className={linkClass}>
        Sign in
      </Link>
    );
  }

  return (
    <>
      <Link href="/profile" className={linkClass}>
        Profile
      </Link>
      <Link href="/settings" className={linkClass}>
        Settings
      </Link>
      <form action="/auth/logout" method="post">
        <button type="submit" className={linkClass}>
          Sign out
        </button>
      </form>
    </>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ?? null);
    });
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      auth.subscription.unsubscribe();
    };
  }, []);

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
              <li className="ml-2 border-l border-border pl-2">
                <AccountLinks user={user} mobile={false} />
              </li>
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
              <li className="border-t border-border pt-2">
                <AccountLinks user={user} mobile />
              </li>
            </ul>
          </nav>
        </Container>
      </div>
    </header>
  );
}
