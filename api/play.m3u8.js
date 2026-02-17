import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    const filePath = path.join(process.cwd(), "data", "channels.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);

    let channel = null;
    for (const group in data) {
      const found = data[group].find(ch => ch.id == id);
      if (found) { channel = found; break; }
    }

    if (!channel) return res.status(404).send("Channel not found");

    return res.redirect(channel.url);

  } catch (e) {
    return res.status(500).send("Server error: " + e.message);
  }
}
