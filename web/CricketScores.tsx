import { useEffect, useState } from "react";
import { PanelPaper } from "./PanelPaper.tsx";

type Match = { title: string; id: string };
type Scores = { matches: Match[]; published: string };
export function useCricketScores() {
  const [scores, setScores] = useState<Scores>();
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/cricket", {
          signal: controller.signal,
        });
        if (!response.ok) throw Error();
        const xml = new DOMParser().parseFromString(
          await response.text(),
          "application/xml",
        );
        if (!xml.querySelector("rss > channel")) throw Error();
        const matches = Array.from(
          xml.querySelectorAll("channel > item"),
        ).flatMap((item) => {
          const title = item
            .querySelector("title")
            ?.textContent?.trim()
            .replace(/\s+/g, " ");
          const id = item
            .querySelector("guid")
            ?.textContent?.match(/\/match\/(\d+)\.html/)?.[1];
          return title && id ? [{ title, id }] : [];
        });
        if (!controller.signal.aborted) {
          setScores({
            matches,
            published:
              xml.querySelector("channel > pubDate")?.textContent || "",
          });
          setError(false);
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void refresh();
    const interval = setInterval(refresh, 120000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);
  const matches = scores?.matches ?? [];
  const featured =
    matches.find((m) => /\d/.test(m.title) && /\bIndia\b/.test(m.title)) ??
    matches.find((m) => /\d/.test(m.title)) ??
    matches[0];
  const sides = featured?.title.split(/\s+v\s+/);
  const side =
    sides?.find((s) => s.includes("*")) ?? sides?.find((s) => /\d/.test(s));
  const runs = side?.match(/\d+(?:\/\d+)?/g)?.at(-1);
  const team = side?.split(/\s+\d/)[0].trim() ?? "";
  const code = team.includes(" ")
    ? team
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 4)
    : team.slice(0, 3);
  const board = runs
    ? code.toUpperCase() + " " + runs
    : error
      ? "OFFLINE"
      : scores
        ? matches.length
          ? "FIXTURES"
          : "NO MATCH"
        : "CRICKET";
  return { scores, error, board };
}

export function CricketScores({
  feed,
  onClose,
}: {
  feed: ReturnType<typeof useCricketScores>;
  onClose: () => void;
}) {
  const date = Date.parse(feed.scores?.published ?? "");
  return (
    <aside className="bot-desk surface-panel" aria-label="Cricket scores">
      <PanelPaper>
        <div className="desk-head">
          <h2>Cricket scores</h2>
          <button onClick={onClose} aria-label="Close cricket scores">
            ×
          </button>
        </div>
        <p>
          ESPNcricinfo
          {Number.isFinite(date) &&
            " · " +
              new Date(date).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
        </p>
        {feed.error && (
          <p role="status">
            {feed.scores
              ? "Showing the last update. Reconnecting…"
              : "Score feed unavailable. Retrying automatically."}
          </p>
        )}
        {!feed.scores && !feed.error && <p>Fetching scores…</p>}
        {feed.scores?.matches.length === 0 && <p>No matches listed.</p>}
        {feed.scores?.matches.map((m) => (
          <a
            className="match-score"
            key={m.id}
            href={
              "https://www.espncricinfo.com/ci/engine/match/" + m.id + ".html"
            }
            target="_blank"
            rel="noreferrer"
          >
            {m.title}
          </a>
        ))}
      </PanelPaper>
    </aside>
  );
}
