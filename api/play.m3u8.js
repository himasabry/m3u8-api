import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

const REQUIRED_UA = "SUPER2026";

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    // حماية User-Agent
    const ua = (req.headers["user-agent"] || "").toUpperCase();
    if (!ua.includes(REQUIRED_UA)) {
      return res.status(403).send("Forbidden");
    }

    // تعطيل التخزين المؤقت
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // زيادة عداد المشاهدين في الذاكرة
    incrementViewer(id);

    const filePath = path.join(process.cwd(), "data", "channels.json");
    if (!fs.existsSync(filePath)) {
      return res.status(500).send("channels.json not found");
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;
    for (const group of Object.values(data)) {
      channel = group.find(ch => ch.id === id);
      if (channel) break;
    }

    if (!channel || !channel.url) {
      return res.status(404).send("Channel not found");
    }

    // بروكسي إذا فيه Headers
    if (channel.headers && Object.keys(channel.headers).length) {
      const params = new URLSearchParams({
        url: channel.url,
        ua: channel.headers["User-Agent"] || "",
        ref: channel.headers["Referer"] || "",
        org: channel.headers["Origin"] || ""
      });

      return res.redirect(302, `/api/proxy.m3u8.js?${params.toString()}`);
    }

    // Redirect مباشر
    return res.redirect(302, channel.url);

  } catch (err) {
    console.error("STREAM ERROR:", err);
    return res.status(500).send("Internal Server Error");
  }
}
