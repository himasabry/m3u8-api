import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).send("Missing id");

  try {
    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;

    for (const group in data) {
      const found = data[group].find(ch => ch.id == id);
      if (found) {
        channel = found;
        break;
      }
    }

    if (!channel) return res.status(404).send("Channel not found");

    let sources = [];

    if (channel.sources) {
      sources = channel.sources;
    } else {
      sources = [{ url: channel.url, headers: channel.headers || {} }];
    }

    let lastError = null;

    for (const source of sources) {
      try {
        const response = await fetch(source.url, {
          headers: source.headers || {},
          redirect: "follow"
        });

        if (!response.ok) continue;

        res.setHeader(
          "Content-Type",
          response.headers.get("content-type") || "application/vnd.apple.mpegurl"
        );

        const buffer = Buffer.from(await response.arrayBuffer());
        return res.status(200).send(buffer);

      } catch (err) {
        lastError = err;
      }
    }

    return res.status(500).send("All sources failed");

  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
}
