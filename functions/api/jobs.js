export async function onRequestGet(context) {
  try {
    // Interroge la base de données D1 (liaison DB)
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM jobs WHERE status = 'active' ORDER BY date_posted DESC"
    ).all();

    return new Response(JSON.stringify(results), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
