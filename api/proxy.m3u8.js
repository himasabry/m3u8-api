import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url, ua, ref, org } = req.query;

  if (!url) return res.status(400).send("Missing url");

  try {
    const headers = {};

    if (ua) headers["User-Agent"] = ua;
    if (ref) headers["Referer"] = ref;
    if (org) headers["Origin"] = org;

    const upstream = await fetch(url, { headers });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/octet-stream"
    );

    upstream.body.pipe(res);
  } catch (e) {
    res.status(500).send("Proxy error: " + e.message);
  }
}
