import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { group, id } = req.query;

  if (!group || !id) {
    return res.status(400).send("Missing parameters");
  }

  try {
    const filePath = path.join(process.cwd(), "data", "channels.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!data[group]) {
      return res.status(404).send("Group not found");
    }

    const channel = data[group].find(ch => ch.id == id);

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
