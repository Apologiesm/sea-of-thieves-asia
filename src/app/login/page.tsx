"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Authentication is not configured yet.");
      setLoading(false);
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        // Supabase already requests the minimum identity scopes. We do not
        // request guilds, connections, email, or message contents.
        scopes: "identify",
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <Container>
      <div className="mx-auto max-w-lg py-16 sm:py-24">
        <Image
          src="/brand/logo-asia.png"
          alt="Sea of Thieves Asia"
          width={644}
          height={456}
          priority
          sizes="168px"
          className="login-logo"
        />
        <Card>
          <h1 className="text-2xl font-bold text-content">Sign in with Discord</h1>
          <p className="mt-4 text-sm leading-relaxed text-content-muted">
            We use Discord only to verify your identity. We never read your
            messages, your servers, or your friends list.
          </p>
          <button
            type="button"
            onClick={signIn}
            disabled={loading}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-canvas hover:bg-brand-strong disabled:opacity-60"
          >
            {loading ? "Connecting…" : "Continue with Discord"}
          </button>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          <p className="mt-6 text-xs leading-relaxed text-content-muted">
            By continuing you agree to the collection of the minimum profile
            data described in the{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              privacy policy
            </Link>
            .
          </p>
        </Card>
      </div>
    </Container>
  );
}
