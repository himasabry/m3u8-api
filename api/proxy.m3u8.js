import fetch from "node-fetch";

const UA =
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("Missing url");
  }

  try {

    const upstream = await fetch(url,{
      redirect:"follow",
      timeout:15000,

      headers:{
        "User-Agent":UA
      }
    });

    const contentType =
      upstream.headers.get(
        "content-type"
      ) || "";

    // m3u8
    if (
      contentType.includes(
        "mpegurl"
      ) ||
      url.includes(
        ".m3u8"
      )
    ) {

      let body =
        await upstream.text();

      body =
        body.replace(
          /(https?:\/\/[^\s]+)/g,

          (u)=>
            `/api/ts?url=${encodeURIComponent(u)}`
        );

      res.setHeader(
        "Content-Type",
        "application/vnd.apple.mpegurl"
      );

      res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
      );

      return res.send(body);
    }

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    upstream.body.pipe(res);

  } catch (e) {

    console.error(
      "PROXY ERROR:",
      e
    );

    return res
      .status(500)
      .send(
        "Proxy error"
      );
  }
}
