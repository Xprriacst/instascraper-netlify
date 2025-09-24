import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  return new Response(JSON.stringify({ 
    message: "Hello from Netlify Functions!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  }), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};

export const config: Config = {
  path: "/api/hello"
};
