import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");
    if (!serviceKey || !authHeader) throw new Error("Server configuration or authentication is missing.");
    const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const token = authHeader.replace(/^Bearer\\s+/i, "");
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) return new Response(JSON.stringify({ error: "Authentication required." }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    const { data: profile, error: profileError } = await adminClient.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== "admin" || profile?.status !== "approved") return new Response(JSON.stringify({ error: "Only approved administrators can send staff invitations." }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    const body = await req.json();
    const invitationId = String(body.invitation_id || "");
    if (!invitationId) throw new Error("invitation_id is required.");
    const { data: invitation, error: invitationError } = await adminClient.from("department_staff_invitations").select("id,email,full_name,status").eq("id", invitationId).maybeSingle();
    if (invitationError) throw invitationError;
    if (!invitation || invitation.status !== "approved") return new Response(JSON.stringify({ error: "This staff invitation has not been approved or is no longer available." }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(invitation.email, {
      data: { account_type: "department_member", department_invitation_id: invitation.id, full_name: invitation.full_name },
    });
    if (inviteError) throw inviteError;
    await adminClient.from("department_staff_invitations").update({ status: "sent", auth_user_id: invited.user.id, updated_at: new Date().toISOString() }).eq("id", invitation.id).eq("status", "approved");
    return new Response(JSON.stringify({ success: true, message: "Invitation sent." }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unable to send invitation." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});