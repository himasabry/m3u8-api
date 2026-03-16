import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

const REQUIRED_UA = "SUPER2026";

export default async function handler(req, res) {

  try {

    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    const ua = req.headers["user-agent"] || "";
    if (!ua.includes(REQUIRED_UA)) {
      return res.status(403).send("Forbidden");
    }

    incrementViewer(id);

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

    if (!channel) return res.status(404).send("Channel not found");

    const url = channel.url;

    // لو MPD نعمل Proxy
    if (url.includes(".mpd")) {

      const response = await fetch(url, {
        headers: {
          "Referer": channel.headers?.Referer || "",
          "Origin": channel.headers?.Origin || "",
          "User-Agent": channel.headers?.["User-Agent"] || "Mozilla/5.0"
        }
      });

      const text = await response.text();

      res.setHeader("Content-Type", "application/dash+xml");
      return res.send(text);

    }

    // باقي القنوات redirect
    return res.redirect(url);

  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }

}
