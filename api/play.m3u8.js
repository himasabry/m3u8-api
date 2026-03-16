import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

const REQUIRED_UA = "SUPER2026";

export default async function handler(req, res) {
  try {

    const { id, segment } = req.query;
    if (!id) return res.status(400).send("Missing id");

    const ua = req.headers["user-agent"] || "";
    if (!ua.includes(REQUIRED_UA)) {
      return res.status(403).send("Forbidden");
    }

    incrementViewer(id);

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

    const url = channel.url;

    // base path
    const base = url.substring(0, url.lastIndexOf("/") + 1);

    // ====== تحميل segment ======
    if (segment) {

      const segUrl = base + segment;

      const response = await fetch(segUrl, {
        headers: {
          "Referer": channel.headers?.Referer || "",
          "Origin": channel.headers?.Origin || "",
          "User-Agent": channel.headers?.["User-Agent"] || "Mozilla/5.0"
        }
      });

      const buffer = Buffer.from(await response.arrayBuffer());

      res.setHeader("Content-Type", "video/mp4");
      return res.send(buffer);
    }

    // ====== تحميل mpd ======

    const response = await fetch(url, {
      headers: {
        "Referer": channel.headers?.Referer || "",
        "Origin": channel.headers?.Origin || "",
        "User-Agent": channel.headers?.["User-Agent"] || "Mozilla/5.0"
      }
    });

    let text = await response.text();

    // تعديل روابط segments
    text = text.replace(/(media=")([^"]+)/g, `$1/api/play.m3u8?id=${id}&segment=$2`);
    text = text.replace(/(initialization=")([^"]+)/g, `$1/api/play.m3u8?id=${id}&segment=$2`);

    res.setHeader("Content-Type", "application/dash+xml");
    res.send(text);

  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
}
