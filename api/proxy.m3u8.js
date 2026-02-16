import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url");

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "SUPER2026"
      }
    });

    const body = await r.text();
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(body);
  } catch (e) {
    res.status(500).send("Proxy error");
  }
}
