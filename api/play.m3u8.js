import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

// 👇 اليوزر الجديد (التطبيق)
const NEW_UA = "SUPERLIVETV2026";

// 👇 اليوزر القديم (السارقين)
const OLD_UA = "SUPER2026";

// 👇 فيديو المصيدة
const FAKE_VIDEO = "https://example.com/fake.mp4";

export default async function handler(req, res) {

  try {

    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    const ua = req.headers["user-agent"] || "";

    incrementViewer(id);

    // 🔴 لو اليوزر القديم → شغل فيديو المصيدة
    if (ua.includes(OLD_UA)) {

      const response = await fetch(FAKE_VIDEO, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Access-Control-Allow-Origin", "*");

      return response.body.pipe(res);
    }

    // ❌ أي UA غير الجديد → بلوك
    if (!ua.includes(NEW_UA)) {
      return res.status(403).send("Forbidden");
    }

    // ✅ UA الجديد → تشغيل طبيعي
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

    // ===== القنوات العادية =====
    if (!channel.url.includes("ostora")) {
      return res.redirect(channel.url);
    }

    // ===== ostora =====
    const cleanUrl = channel.url.split("#")[0];

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://ostora.pages.dev/"
      }
    });

    const finalUrl = response.url;

    return res.redirect(finalUrl);

  } catch (e) {

    console.error("PLAY ERROR:", e);
    return res.status(500).send("Server error");

  }

}
