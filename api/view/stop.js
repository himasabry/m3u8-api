import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing id");

  const filePath = path.join(process.cwd(), "data", "viewers.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (data[id] && data[id] > 0) data[id] -= 1;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  res.status(200).json({ viewers: data[id] });
}
