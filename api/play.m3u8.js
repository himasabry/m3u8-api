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

  // 🟢 قناة ABR (جودة تلقائية)
  if (channel.streams) {

    const base = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}/api/proxy?url=`;

    const high = encodeURIComponent(channel.streams.high);
    const mid  = encodeURIComponent(channel.streams.mid);
    const low  = encodeURIComponent(channel.streams.low);

    const playlist = `#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=3840x2160
${base}${high}

#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1920x1080
${base}${mid}

#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480
${base}${low}
`;

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    return res.send(playlist);
  }

  // 🔵 قناة عادية
  res.redirect(channel.url);
}
