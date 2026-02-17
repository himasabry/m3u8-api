export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url");

  const target = decodeURIComponent(url);

  const r = await fetch(target, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "",
      "Origin": ""
    }
  });

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.send(await r.text());
}
