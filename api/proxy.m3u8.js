import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url");

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "",
        "Origin": ""
      }
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");

    upstream.body.pipe(res);
  } catch (e) {
    res.status(500).send("Proxy stream error");
  }
}
