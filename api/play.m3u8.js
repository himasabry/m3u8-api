import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { incrementViewer } from "./viewers.js";

// 🔥 User Agents
const NEW_UA = "SUPERTV2026";
const OLD_UA = "SUPERLIVETV2026";

// 🎥 فيديو المصيدة (مصدر مباشر مضمون)
const FAKE_VIDEO =
  "https://raw.githubusercontent.com/himasabry/video/main/fake.mp4";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    const ua = (req.headers["user-agent"] || "").toLowerCase();

    incrementViewer(id);

    // =========================
    // 🔴 1 - اليوزر القديم (مصيدة)
    // =========================
    if (ua.includes(OLD_UA.toLowerCase())) {
      const response = await fetch(FAKE_VIDEO);

      if (!response.ok || !response.body) {
        return res.status(502).send("Trap video failed");
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Access-Control-Allow-Origin", "*");

      const stream = Readable.fromWeb(response.body);
      return stream.pipe(res);
    }

    // =========================
    // ❌ 2 - أي غير اليوزر الجديد مرفوض
    // =========================
    if (!ua.includes(NEW_UA.toLowerCase())) {
      return res.status(403).send("Forbidden");
    }

    // =========================
    // ✅ 3 - اليوزر الجديد (تشغيل عادي)
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
