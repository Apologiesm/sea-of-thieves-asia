import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

export async function requireModerator() {
  const context = await requireUser();
  if (!context) return null;
  const { data } = await context.supabase.rpc("is_moderator");
  if (!data) return null;
  return context;
}

export async function requireAdmin() {
  const context = await requireUser();
  if (!context) return null;
  const { data } = await context.supabase.rpc("is_admin");
  if (!data) return null;
  return context;
}

export async function requireOwner() {
  const context = await requireUser();
  if (!context) return null;
  const { data } = await context.supabase.rpc("is_owner_role");
  if (!data) return null;
  return context;
}

export async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
) {
  if (!supabase) return;
  await supabase.rpc("log_admin_action", {
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId,
    p_metadata: metadata,
  });
}
