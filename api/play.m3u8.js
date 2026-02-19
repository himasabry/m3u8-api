import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

const REQUIRED_UA = "SUPER2026";

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    const ua = req.headers["user-agent"] || "";
    if (!ua.includes(REQUIRED_UA)) {
      return res.status(403).send("Forbidden UA");
    }

    incrementViewer(id);

    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel;
    for (const g in data) {
      const f = data[g].find(c => c.id === id);
      if (f) { channel = f; break; }
    }

    if (!channel) return res.status(404).send("Channel not found");

    // تحويل http → https عبر iframe safe redirect
    let url = channel.url;
    if (url.startsWith("http://")) {
      url = "https://cors.isomorphic-git.org/" + url;
    }

    return res.redirect(url);

  } catch (e) {
    return res.status(500).send(e.message);
  }
}
