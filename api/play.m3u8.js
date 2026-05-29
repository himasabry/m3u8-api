import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

// 🔥 User Agents
const NEW_UA = "SUPERTV2026";
const OLD_UA = "SUPERLIVETV2026";

// 🎥 Trap Video (رابط مباشر ثابت)
const FAKE_VIDEO =
  "https://raw.githubusercontent.com/himasabry/video/main/fake.mp4";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    const ua = (req.headers["user-agent"] || "").toLowerCase();

    incrementViewer(id);

    // =========================
    // 🔴 1 - اليوزر القديم (المصيدة)
    // =========================
    if (ua.includes(OLD_UA.toLowerCase()) || ua.includes("superlivetv")) {
      const response = await fetch(FAKE_VIDEO);

      if (!response.ok) {
        return res.status(502).send("Trap video failed");
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Access-Control-Allow-Origin", "*");

      // ✔️ تحميل كامل (بدون stream مشاكل)
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return res.end(buffer);
    }

    // =========================
    // ❌ 2 - غير اليوزر الجديد يتمنع
    // =========================
    if (!ua.includes(NEW_UA.toLowerCase())) {
      return res.status(403).send("Forbidden");
    }

    // =========================
    // ✅ 3 - اليوزر الجديد (تشغيل طبيعي)
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
    // 📺 قنوات عادية
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
