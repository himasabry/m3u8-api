export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url");

  const target = decodeURIComponent(url);

  try {
    const r = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "",
        "Origin": ""
      }
    });

    let body = await r.text();

    const base =
      `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/api/proxy.m3u8?url=`;

    // تحويل كل الروابط داخل m3u8 لتعدي من البروكسي
    body = body.replace(/(https?:\/\/[^\s"'<>]+)/g, (match) => {
      return base + encodeURIComponent(match);
    });

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(body);

  } catch (e) {
    res.status(500).send("Proxy Error");
  }
}
