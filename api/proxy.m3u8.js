import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url");

  try {
    const upstream = await fetch(url, { redirect: "follow", timeout: 15000 });
    const contentType = upstream.headers.get("content-type") || "";

    if (contentType.includes("mpegurl")) {
      let body = await upstream.text();

      body = body.replace(/http:\/\/[^\s#]+/g, match => {
        return `/api/proxy.m3u8.js?url=${encodeURIComponent(match)}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(body);
    }

    upstream.body.pipe(res);

  } catch (e) {
    console.error("PROXY ERROR:", e);
    return res.status(500).send("Proxy error");
  }
}
