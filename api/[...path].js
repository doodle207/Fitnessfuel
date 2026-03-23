export default async function handler(req, res) {
  const BACKEND_URL = process.env.BACKEND_URL || "https://easetracker.replit.app";

  const url = new URL(req.url, `https://${req.headers.host}`);
  const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() !== "host") {
      headers[key] = value;
    }
  }
  headers["x-forwarded-host"] = url.hostname;

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", url.origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.status(204).end();
    return;
  }

  try {
    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? req : undefined,
      redirect: "follow",
      duplex: hasBody ? "half" : undefined,
    });

    res.status(response.status);

    for (const [key, value] of response.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower !== "transfer-encoding" && lower !== "content-encoding") {
        res.setHeader(key, value);
      }
    }

    res.setHeader("Access-Control-Allow-Origin", url.origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");

    const body = await response.arrayBuffer();
    res.end(Buffer.from(body));
  } catch (error) {
    console.error("[Proxy Error]", error);
    res.status(502).json({ error: "Proxy error", message: error.message });
  }
}
