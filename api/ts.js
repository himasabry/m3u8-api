import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send("Missing url");

    const upstream = await fetch(url, {
      headers: { "User-Agent": "SUPER2026" }
    });

    res.setHeader("Content-Type", "video/mp2t");
    upstream.body.pipe(res);

  } catch (e) {
    res.status(500).send("TS Proxy Error");
  }
}
