import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

// 🔥 User Agents
const NEW_UA = "SUPERTV20266";
const OLD_UA = "SUPERTV2026";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

const ua = req.headers["user-agent"] || "";

const ip =
  req.headers["x-forwarded-for"]?.split(",")[0] ||
  req.socket?.remoteAddress ||
  "unknown";

console.log({
  channel: id,
  ip,
  ua,
  time: new Date().toISOString()
});
    incrementViewer(id);

    // =========================
    // 🔴 1 - المصيدة (اليوزر القديم)
    // =========================
    if (ua.includes(OLD_UA.toLowerCase()) || ua.includes("superlivetv")) {
      // بدل فيديو (الأكثر استقرارًا)
      return res.redirect(
        "https://github.com/himasabry/video/raw/refs/heads/main/output.m3u8"
      );
    }

    // =========================
    // ❌ 2 - أي حد مش اليوزر الجديد يتمنع
    // =========================
    if (!ua.includes(NEW_UA.toLowerCase())) {
      return res.status(403).send("Forbidden");
    }

    // =========================
    // ✅ 3 - اليوزر الجديد (تشغيل القنوات)
    // =========================
    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;

    for (const group of Object.values(data)) {
      const found = group.find((ch) => ch.id === id);
      if (found) {
        channel = found;
        break;
      }
    }

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    // =========================
    // 📺 القنوات العادية
    // =========================
    if (!channel.url.includes("ostora")) {
      return res.redirect(channel.url);
    }

    // =========================
    // 🌐 ostora handling
    // =========================
    const cleanUrl = channel.url.split("#")[0];

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://ostora.pages.dev/",
      },
    });

    return res.redirect(response.url);

  } catch (e) {
    console.error("PLAY ERROR:", e);
    return res.status(500).send("Server error");
  }
}
