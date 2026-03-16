import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

const REQUIRED_UA = "SUPER2026";

export default async function handler(req, res) {

  try {

    const { id, path: extraPath = "" } = req.query;

    if (!id) return res.status(400).send("Missing id");

    const ua = req.headers["user-agent"] || "";
    if (!ua.includes(REQUIRED_UA)) {
      return res.status(403).send("Forbidden");
    }

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

    if (!channel) return res.status(404).send("Channel not found");

    const baseUrl = channel.url.substring(0, channel.url.lastIndexOf("/") + 1);

    const targetUrl = extraPath
      ? baseUrl + extraPath
      : channel.url;

    const response = await fetch(targetUrl, {
      headers: {
        "Referer": channel.headers?.Referer || "",
        "Origin": channel.headers?.Origin || "",
        "User-Agent": channel.headers?.["User-Agent"] || "Mozilla/5.0"
      }
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", response.headers.get("content-type") || "application/octet-stream");

    return res.send(buffer);

  } catch (e) {
    console.error(e);
    return res.status(500).send("Server error");
  }

}
