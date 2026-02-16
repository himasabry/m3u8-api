import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send("Missing id");
  }

  try {
    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let channel = null;

    // البحث داخل كل الجروبات
    for (const group in data) {
      const found = data[group].find(ch => ch.id == id);
      if (found) {
        channel = found;
        break;
      }
    }

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    const headers = channel.headers || {};

    const response = await fetch(channel.url, {
      headers
    });

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.status(200).send(await response.text());

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}
