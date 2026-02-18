import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url, ua, ref, org } = req.query;
  if (!url) return res.status(400).send("Missing url");

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": ua || "SUPER2026",
        "Referer": ref || "",
        "Origin": org || ""
      }
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/vnd.apple.mpegurl");

    upstream.body.pipe(res);

  } catch (e) {
    res.status(500).send("Proxy stream error");
  }
}
