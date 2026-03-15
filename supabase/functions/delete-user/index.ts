import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin or super_admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is admin or super_admin
    const { data: isSuper } = await adminClient.rpc("is_super_admin", { _user_id: caller.id });
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isSuper && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin or super_admin required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Prevent self-deletion
    if (user_id === caller.id) {
      return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // If caller is admin (not super_admin), ensure target is in same org
    if (!isSuper) {
      const { data: callerOrgId } = await adminClient.rpc("get_user_org_id", { _user_id: caller.id });
      const { data: targetOrgId } = await adminClient.rpc("get_user_org_id", { _user_id: user_id });
      if (callerOrgId !== targetOrgId) {
        return new Response(JSON.stringify({ error: "Cannot delete users from other organizations" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Prevent admin from deleting another admin or super_admin
      const { data: targetIsAdmin } = await adminClient.rpc("has_role", { _user_id: user_id, _role: "admin" });
      const { data: targetIsSuper } = await adminClient.rpc("is_super_admin", { _user_id: user_id });
      if (targetIsAdmin || targetIsSuper) {
        return new Response(JSON.stringify({ error: "Cannot delete admin or super admin users" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Delete related data - handle follow_up_bookings and leads first (no cascade)
    console.log("Deleting follow_up_bookings for user:", user_id);
    const { error: fubErr } = await adminClient.from("follow_up_bookings").delete().eq("booked_by", user_id);
    if (fubErr) console.error("follow_up_bookings delete error:", fubErr);

    console.log("Deleting leads for user:", user_id);
    const { error: leadsErr } = await adminClient.from("leads").delete().eq("captured_by", user_id);
    if (leadsErr) console.error("leads delete error:", leadsErr);

    console.log("Deleting user_roles for user:", user_id);
    const { error: rolesErr } = await adminClient.from("user_roles").delete().eq("user_id", user_id);
    if (rolesErr) console.error("user_roles delete error:", rolesErr);

    console.log("Deleting org_members for user:", user_id);
    const { error: orgErr } = await adminClient.from("org_members").delete().eq("user_id", user_id);
    if (orgErr) console.error("org_members delete error:", orgErr);

    console.log("Deleting profiles for user:", user_id);
    const { error: profErr } = await adminClient.from("profiles").delete().eq("user_id", user_id);
    if (profErr) console.error("profiles delete error:", profErr);

    // Delete from auth
    console.log("Deleting auth user:", user_id);
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) {
      console.error("Auth delete error:", deleteError);
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("User deleted successfully:", user_id);
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Caught error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
