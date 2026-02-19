import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url, ua, ref, org } = req.query;
  if (!url) return res.status(400).send("Missing url");

  try {
    const headers = {};
    if (ua) headers["User-Agent"] = ua;
    if (ref) headers["Referer"] = ref;
    if (org) headers["Origin"] = org;

    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const upstream = await fetch(url, {
      headers,
      redirect: "follow",
      timeout: 15000
    });

    const contentType = upstream.headers.get("content-type") || "";

    // لو m3u8 → نعدل فقط روابط http
    if (contentType.includes("mpegurl") || contentType.includes("application")) {
      let body = await upstream.text();

      body = body.replace(/http:\/\/[^\s#]+/g, match => {
        return `/api/proxy.m3u8.js?url=${encodeURIComponent(match)}&ua=${encodeURIComponent(ua || "")}&ref=${encodeURIComponent(ref || "")}&org=${encodeURIComponent(org || "")}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-store");
      return res.send(body);
    }

    res.status(upstream.status);

    upstream.headers.forEach((v, k) => {
      if (!["content-encoding", "transfer-encoding", "connection"].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");

    upstream.body.pipe(res);

  } catch (e) {
    console.error("PROXY ERROR:", e);
    return res.status(500).send("Proxy error");
  }
}
