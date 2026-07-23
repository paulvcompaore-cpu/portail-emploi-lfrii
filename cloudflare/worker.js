export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === "/api/jobs" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM jobs ORDER BY date_posted DESC"
        ).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/jobs" && request.method === "POST") {
        const job = await request.json();
        await env.DB.prepare(`
          INSERT INTO jobs (id, title, company, pays, region, ville, contract_types, description, date_posted, date_expiry, source_url, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title=excluded.title,
            company=excluded.company,
            status=excluded.status
        `).bind(
          job.id, job.title, job.company, job.pays, job.region, job.ville,
          job.contract_types, job.description, job.date_posted, job.date_expiry,
          job.source_url, job.status
        ).run();

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      if (path === "/api/archive-expired" && request.method === "POST") {
        const today = new Date().toISOString().split('T')[0];
        const res = await env.DB.prepare(
          "UPDATE jobs SET status = 'archived' WHERE date_expiry < ? AND status = 'active'"
        ).bind(today).run();

        return new Response(JSON.stringify({ archived_count: res.meta.changes }), { headers: corsHeaders });
      }

      return new Response("Route non trouvée", { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
