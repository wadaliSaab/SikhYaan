
import { AwsClient } from "aws4fetch";

const ALLOWED = /^(media|doubts)\/[\w-]+\.(jpg|png|webp)$/;

export default {
  async fetch(request, env, ctx): Promise<Response> {
   
    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET" },
      });
    }

 
    const url = new URL(request.url);

    let key: string;

    try {
      key = decodeURIComponent(url.pathname.slice(1));
    } catch {
      return new Response("Invalid URL", { status: 400 });
    }

    if (!ALLOWED.test(key)) {
      return new Response("Not found", { status: 404 });
    }

  
    const cacheKey = new Request(
      `${url.origin}${url.pathname}`,
      { method: "GET" }
    );

   
    const cached = await caches.default.match(cacheKey);

    if (cached) {
      const hit = new Response(cached.body, cached);
      hit.headers.set("x-cache", "HIT");
      return hit;
    }

  
    const aws = new AwsClient({
      accessKeyId: env.B2_KEY_ID,
      secretAccessKey: env.B2_APPLICATION_KEY,
      service: "s3",
      region: env.B2_REGION,
    });

    try {
      
      const origin = await aws.fetch(
        `${env.B2_ENDPOINT}/${env.B2_BUCKET}/${key}`
      );

      if (origin.status === 404) {
        return new Response("File not found in B2", { status: 404 });
      }

      if (origin.status === 401 || origin.status === 403) {
        return new Response("B2 access denied", {
          status: origin.status,
        });
      }

      if (!origin.ok) {
        return new Response("B2 origin error", { status: 502 });
      }

      
      const response = new Response(origin.body, origin);

      response.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );

      response.headers.set("x-cache", "MISS");

      
      ctx.waitUntil(
        caches.default.put(cacheKey, response.clone())
      );

      return response;

    } catch {
      return new Response("Failed to fetch from B2", {
        status: 502,
      });
    }
  },
} satisfies ExportedHandler<Env>;
