import fs from "fs";
import path from "path";

export default async function handler(req, res) {

  const { id, file } = req.query;

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

  if (!channel) {
    return res.status(404).send("Channel not found");
  }

  const base = channel.url.substring(0, channel.url.lastIndexOf("/") + 1);

  // تحميل segment
  if (file) {

    const segmentUrl = base + file;

    const response = await fetch(segmentUrl, {
      headers: {
        "Referer": "https://akotv/"
      }
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(buffer);

  }

  // تحميل MPD
  const response = await fetch(channel.url, {
    headers: {
      "Referer": "https://akotv/"
    }
  });

  let text = await response.text();

  // تعديل روابط segments
  text = text.replace(/(media=")([^"]+)/g, `$1/api/play?id=${id}&file=$2`);
  text = text.replace(/(initialization=")([^"]+)/g, `$1/api/play?id=${id}&file=$2`);

  res.setHeader("Content-Type", "application/dash+xml");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.send(text);

}
