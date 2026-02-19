import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url, ua, ref, org } = req.query;
  if (!url) return res.status(400).send("Missing url");

  try {
    const headers = {};
    if (ua) headers["User-Agent"] = ua;
    if (ref) headers["Referer"] = ref;
    if (org) headers["Origin"] = org;

    const upstream = await fetch(url, { headers, redirect: "follow" });

    const contentType = upstream.headers.get("content-type") || "";

    // لو m3u8 → نعيد كتابة روابط HTTP فقط
    if (contentType.includes("mpegurl")) {
      let body = await upstream.text();

      body = body.replace(/http:\/\/[^\s#]+/g, match => {
        return `/api/proxy.m3u8.js?url=${encodeURIComponent(match)}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(body);
    }

    // ts أو ملفات عادية
    res.setHeader("Access-Control-Allow-Origin", "*");
    upstream.body.pipe(res);

  } catch (e) {
    return res.status(500).send("Proxy error");
  }
}
