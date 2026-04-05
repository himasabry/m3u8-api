export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send("Missing url");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://ostora.pages.dev/"
      }
    });

    const contentType = response.headers.get("content-type") || "video/mp2t";

    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    return res.send(Buffer.from(buffer));

  } catch (err) {
    console.error("PROXY ERROR:", err);
    return res.status(500).send("Proxy error");
  }
}
