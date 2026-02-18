import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data", "channels.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let m3u = "#EXTM3U\n";

  for (const category in data) {
    for (const ch of data[category]) {
      m3u += `#EXTINF:-1 tvg-id="${ch.id}" group-title="${category}",${ch.name}\n`;
      m3u += `${req.headers.host ? `https://${req.headers.host}` : ""}/api/play.m3u8?id=${ch.id}\n`;
    }
  }

  res.setHeader("Content-Type", "application/x-mpegURL");
  res.setHeader("Content-Disposition", "attachment; filename=SuperTV.m3u");
  res.status(200).send(m3u);
}
