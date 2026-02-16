import fs from "fs";
import path from "path";

export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing id");

  try {
    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;
    for (const group in data) {
      const found = data[group].find(ch => ch.id == id);
      if (found) { channel = found; break; }
    }

    if (!channel) return res.status(404).send("Channel not found");

    const sources = channel.sources
      ? channel.sources
      : [{ url: channel.url, headers: channel.headers || {} }];

    for (const source of sources) {
      try {
        const upstream = await fetch(source.url, {
          headers: source.headers || {},
          redirect: "follow"
        });

        if (!upstream.ok || !upstream.body) continue;

        res.writeHead(200, {
          "Content-Type": upstream.headers.get("content-type") || "application/vnd.apple.mpegurl",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*"
        });

        upstream.body.pipe(res);
        return;

      } catch (e) {
        continue;
      }
    }

    return res.status(500).send("All sources failed");

  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
}
