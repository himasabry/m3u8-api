import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing id");

  const filePath = path.join(process.cwd(), "data", "channels.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let channel = null;
  for (const group in data) {
    const found = data[group].find(ch => ch.id === id);
    if (found) { channel = found; break; }
  }

  if (!channel) return res.status(404).send("Channel not found");

  res.redirect(channel.url);
}
