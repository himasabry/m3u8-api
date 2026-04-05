import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

const REQUIRED_UA = "SUPER2026";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    // حماية User-Agent
    const ua = req.headers["user-agent"] || "";
    if (!ua.includes(REQUIRED_UA)) {
      return res.status(403).send("Forbidden");
    }

    // زيادة المشاهدين
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

    const response = await fetch(channel.url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://ostora.pages.dev/",
        "Origin": "https://ostora.pages.dev"
      },
      redirect: "follow"
    });

    const contentType = response.headers.get("content-type") || "";

    // لو m3u8
    if (contentType.includes("mpegurl") || channel.url.includes(".m3u8")) {
      const text = await response.text();

      const modified = text.replace(/https?:\/\/[^\s]+/g, (url) => {
        return `${req.headers.host}/api/proxy?url=${encodeURIComponent(url)}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      return res.send(modified);
    }

    // لو فيديو مباشر أو ts
    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", contentType || "video/mp2t");
    return res.send(Buffer.from(buffer));

  } catch (e) {
    console.error("PLAY ERROR:", e);
    return res.status(500).send("Server error");
  }
}
