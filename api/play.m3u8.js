import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

const REQUIRED_UA = "SUPER2026";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
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

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    // 🔥 لو القناة عادية → redirect مباشر
    if (!channel.headers) {
      return res.redirect(channel.url);
    }

    // 🔥 لو فيها headers (زي ostora) → proxy
    const cleanUrl = channel.url.split("#")[0];

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": channel.headers["User-Agent"],
        "Referer": channel.headers["Referer"]
      }
    });

    const contentType = response.headers.get("content-type") || "";

    // 🎯 لو m3u8
    if (contentType.includes("mpegurl")) {
      const text = await response.text();

      const modified = text.replace(/https?:\/\/[^\s]+/g, (url) => {
        return `https://${req.headers.host}/api/proxy?url=${encodeURIComponent(url)}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      return res.send(modified);
    }

    // 🎯 باقي الأنواع (mp4 / ts)
    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", contentType || "video/mp2t");

    return res.send(Buffer.from(buffer));

  } catch (e) {
    console.error("PLAY ERROR:", e);
    return res.status(500).send("Server error");
  }
}
