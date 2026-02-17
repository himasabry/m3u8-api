import fs from "fs";
import path from "path";

const REQUIRED_UA = "SUPER2026"; // حماية UA
const VIEWERS_FILE = path.join(process.cwd(), "data", "viewers.json");

// زيادة المشاهدين مؤقتًا
function incrementViewer(id) {
  try {
    const data = JSON.parse(fs.readFileSync(VIEWERS_FILE, "utf8"));
    data[id] = (data[id] || 0) + 1;
    fs.writeFileSync(VIEWERS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Viewer count error:", e.message);
  }
}

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    // 🔐 حماية User-Agent
    const ua = req.headers["user-agent"] || "";
    if (!ua.includes(REQUIRED_UA)) {
      return res.status(403).send("Forbidden: Invalid User-Agent");
    }

    // زيادة عدّاد المشاهدين
    incrementViewer(id);

    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;
    for (const group in data) {
      const found = data[group].find(ch => ch.id === id);
      if (found) { channel = found; break; }
    }

    if (!channel) return res.status(404).send("Channel not found");

    // إذا فيه Headers → استخدم البروكسي
    if (
      channel.headers &&
      (channel.headers["User-Agent"] ||
        channel.headers["Referer"] ||
        channel.headers["Origin"])
    ) {
      const params = new URLSearchParams({
        url: channel.url,
        ua: channel.headers["User-Agent"] || "",
        ref: channel.headers["Referer"] || "",
        org: channel.headers["Origin"] || ""
      });
      return res.redirect(`/api/proxy.m3u8.js?${params.toString()}`);
    }

    // قناة عادية → redirect مباشر
    return res.redirect(channel.url);

  } catch (e) {
    return res.status(500).send("Server error: " + e.message);
  }
}
