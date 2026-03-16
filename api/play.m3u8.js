import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

const REQUIRED_UA = "SUPER2026";

export default function handler(req, res) {
  try {

    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    // حماية User-Agent
    const uaClient = req.headers["user-agent"] || "";
    if (!uaClient.includes(REQUIRED_UA)) {
      return res.status(403).send("Forbidden");
    }

    // زيادة المشاهدين
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

    if (!channel || !channel.url) {
      return res.status(404).send("Channel not found");
    }

    const url = channel.url;

    // ===== MPD DASH =====
    if (url.includes(".mpd")) {

      const params = new URLSearchParams({
        url: url,
        ref: channel.headers?.Referer || "",
        ua: channel.headers?.["User-Agent"] || "",
        org: channel.headers?.Origin || ""
      });

      return res.redirect(302, `/api/dash-proxy.js?${params.toString()}`);

    }

    // ===== M3U8 =====
    if (url.includes(".m3u8")) {

      const params = new URLSearchParams({
        url: url,
        ref: channel.headers?.Referer || "",
        ua: channel.headers?.["User-Agent"] || "",
        org: channel.headers?.Origin || ""
      });

      return res.redirect(302, `/api/hls-proxy.js?${params.toString()}`);

    }

    // ===== روابط عادية =====
    return res.redirect(302, url);

  } catch (e) {
    console.error("PLAY ERROR:", e);
    return res.status(500).send("Server error");
  }
}
