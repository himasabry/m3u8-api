export default function handler(req, res) {
  const { id } = req.query;

  const channels = {
    "116900": "http://135.125.109.73:9000/Bein%20Sports%201%204K%20QA_.m3u8"
  };

  if (!channels[id]) {
    res.status(404).send("#EXTM3U\n# Channel not found");
    return;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.send(`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=6000000
${channels[id]}`);
}
