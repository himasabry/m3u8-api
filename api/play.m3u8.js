import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing id");

  const filePath = path.join(process.cwd(), "data", "channels.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let channel = null;
  for (const group in data) {
    const found = data[group].find(ch => ch.id == id);
    if (found) { channel = found; break; }
  }

  if (!channel) return res.status(404).send("Channel not found");

  // 🟢 قناة جودة تلقائية ABR
  if (channel.streams) {

    const base =
      `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/api/proxy.m3u8?url=`;

    const high = base + encodeURIComponent(channel.streams.high);
    const mid  = base + encodeURIComponent(channel.streams.mid);
    const low  = base + encodeURIComponent(channel.streams.low);

    const playlist = `#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=3840x2160
${high}

#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1920x1080
${mid}

#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480
${low}
`;

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    return res.send(playlist);
  }

  // 🔵 قناة عادية
  res.redirect(channel.url);
}
