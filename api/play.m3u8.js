import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

const REQUIRED_UA = "SUPER2026";

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    const uaClient = req.headers["user-agent"] || "";
    if (!uaClient.includes(REQUIRED_UA)) {
      return res.status(403).send("Forbidden");
    }

    incrementViewer(id);

    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;
    for (const group of Object.values(data)) {
      channel = group.find(ch => ch.id === id);
      if (channel) break;
    }

    if (!channel || !channel.url) {
      return res.status(404).send("Channel not found");
    }

    // 🔥 ارجع للسلوك الطبيعي
    return res.redirect(302, channel.url);

  } catch (e) {
    console.error("PLAY ERROR:", e);
    return res.status(500).send("Server error");
  }
}
