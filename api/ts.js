import fetch from "node-fetch";

export default async function handler(req, res) {
  try {

    const { url } = req.query;

    if (!url) {
      return res.status(400).send("Missing url");
    }

    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
      }
    });

    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") ||
      "video/mp2t"
    );

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    upstream.body.pipe(res);

  } catch (e) {

    console.error(e);

    return res
      .status(500)
      .send("TS Proxy Error");
  }
}
