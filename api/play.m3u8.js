import fs from "fs";
import path from "path";

const REQUIRED_UA = "SUPER2026";

export default async function handler(req, res) {

  try {

    const { id, file } = req.query;

    if (!id) return res.status(400).send("Missing id");

    // حماية User-Agent
    const ua = req.headers["user-agent"] || "";
    if (!ua.includes(REQUIRED_UA)) {
      return res.status(403).send("Forbidden");
    }

    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;

    for (const group of Object.values(data)) {
      const found = group.find(ch => ch.id === id);
      if (found) {
        channel = found;
        break;
      }
    }

    if (!channel) return res.status(404).send("Channel not found");

    const base = channel.url.substring(0, channel.url.lastIndexOf("/") + 1);

    const headers = {
      "Referer": channel.headers?.Referer || "https://akotv/",
      "User-Agent": channel.headers?.["User-Agent"] || "Mozilla/5.0"
    };

    // ===== تحميل segments =====
    if (file) {

      const segmentUrl = base + file;

      const response = await fetch(segmentUrl, { headers });

      const buffer = Buffer.from(await response.arrayBuffer());

      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(buffer);
    }

    // ===== تحميل MPD =====
    const response = await fetch(channel.url, { headers });

    let text = await response.text();

    text = text.replace(/(media=")([^"]+)/g, `$1/api/play.m3u8?id=${id}&file=$2`);
    text = text.replace(/(initialization=")([^"]+)/g, `$1/api/play.m3u8?id=${id}&file=$2`);

    res.setHeader("Content-Type", "application/dash+xml");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.send(text);

  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }

}
