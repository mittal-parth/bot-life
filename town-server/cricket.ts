// The public RSS channel advertises a two-minute update interval.
export function cricketFeed() {
  let cached = "";
  let expires = 0;
  let pending: Promise<string> | undefined;
  async function refresh() {
    const response = await fetch(
      "https://static.cricinfo.com/rss/livescores.xml",
      {
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) throw Error("Cricket feed unavailable");
    const xml = await response.text();
    if (!xml.includes("<channel>") || !xml.includes("</rss>"))
      throw Error("Invalid cricket feed");
    cached = xml;
    expires = Date.now() + 120000;
    return xml;
  }
  return async () => {
    try {
      if (Date.now() >= expires) {
        pending ??= refresh().finally(() => {
          pending = undefined;
        });
        await pending;
      }
      return new Response(cached, {
        headers: {
          "Content-Type": "application/rss+xml; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return new Response("Score feed unavailable", { status: 503 });
    }
  };
}
