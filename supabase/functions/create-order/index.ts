
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Function is working",
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});
