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

    // لو m3u8 → نعدل روابط HTTP فقط بشكل آمن
    if (contentType.includes("mpegurl")) {
      let body = await upstream.text();

      // regex يحافظ على كل التعليقات والتنسيق
      body = body.replace(/^(http:\/\/[^\s#]+)/gm, match => {
        return `/api/proxy.m3u8.js?url=${encodeURIComponent(match)}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-store");
      return res.send(body);
    }

    // TS أو ملفات أخرى → تمر مباشرة مع Range support
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.headers.range) headers["Range"] = req.headers.range;
    upstream.body.pipe(res);

  } catch (e) {
    console.error("PROXY ERROR:", e);
    return res.status(500).send("Proxy error");
  }
}
