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

    // قراءة القنوات
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

    // 🔥 إزالة #hls
    const cleanUrl = channel.url.split("#")[0];

    // طلب البث
    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": channel.headers?.["User-Agent"] || "Mozilla/5.0",
        "Referer": channel.headers?.["Referer"] || ""
      }
    });

    const contentType = response.headers.get("content-type") || "";

    // 🎯 لو M3U8
    if (contentType.includes("mpegurl") || cleanUrl.includes(".m3u8")) {
      const text = await response.text();

      const modified = text.replace(/https?:\/\/[^\s]+/g, (url) => {
        return `https://${req.headers.host}/api/proxy?url=${encodeURIComponent(url)}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      return res.send(modified);
    }

    // 🎯 لو TS أو فيديو مباشر
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType || "video/mp2t");
    return res.send(Buffer.from(buffer));

  } catch (e) {
    console.error("PLAY ERROR:", e);
    return res.status(500).send("Server error");
  }
}
