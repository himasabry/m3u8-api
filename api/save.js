import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if(req.method !== "POST") return res.status(405).json({error:"Method not allowed"});

  const filePath = path.join(process.cwd(), "data", "channels.json");
  try {
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), "utf8");
    res.status(200).json({status:"ok"});
  } catch(e) {
    res.status(500).json({error: e.message});
  }
}
