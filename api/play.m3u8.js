import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    incrementViewer(id);

    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;
    for (const group in data) {
      const found = data[group].find(ch => ch.id === id);
      if (found) { channel = found; break; }
    }

    if (!channel) return res.status(404).send("Not found");

    // إرسال الرابط النهائي مباشرة
    return res.json({
      url: channel.url,
      headers: channel.headers || {}
    });

  } catch (e) {
    return res.status(500).send("Server error");
  }
}
