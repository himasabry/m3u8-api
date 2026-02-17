import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url");

  const target = decodeURIComponent(url);

  try {
    const response = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "",
        "Origin": ""
      }
    });

    // نسخة مضمونة لكل chunk
    const contentType = response.headers.get("content-type") || "application/vnd.apple.mpegurl";
    res.setHeader("Content-Type", contentType);

    const body = await response.text();
    res.send(body);

  } catch (err) {
    res.status(500).send("Proxy fetch error");
  }
}
