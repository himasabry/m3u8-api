import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { url, ua, ref, org } = req.query;
    if (!url) return res.status(400).send("Missing url");

    const headers = {};
    if (ua) headers["User-Agent"] = ua;
    if (ref) headers["Referer"] = ref;
    if (org) headers["Origin"] = org;

    const upstream = await fetch(url, { headers });
    const contentType = upstream.headers.get("content-type") || "";

    // لو ملف m3u8 → نعيد كتابة روابط ts
    if (contentType.includes("mpegurl") || url.includes(".m3u8")) {

      let text = await upstream.text();
      const base = new URL(url);

      text = text.replace(/^(?!#)(.+)$/gm, line => {
        if (line.startsWith("http")) {
          return `/api/ts.js?url=${encodeURIComponent(line)}`;
        }
        return `/api/ts.js?url=${encodeURIComponent(new URL(line, base).href)}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      return res.send(text);
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    upstream.body.pipe(res);

  } catch (e) {
    res.status(500).send("Proxy Error: " + e.message);
  }
}
