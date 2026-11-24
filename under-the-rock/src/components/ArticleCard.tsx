"use client";

import type { Article } from "@/lib/types";

const TYPE_LABEL: Record<Article["sourceType"], string> = {
  news: "News",
  agency: "Agency release",
  "federal-register": "Official rule/notice",
  court: "Court docket",
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

export default function ArticleCard({ a, catLabels }: { a: Article; catLabels: Record<string, string> }) {
  return (
    <article className={`card type-${a.sourceType}`}>
      <div className="card-meta">
        <span className="badge">{TYPE_LABEL[a.sourceType]}</span>
        <span className="source">{a.source}</span>
        <span className="dot">·</span>
        <time dateTime={a.publishedAt}>{timeAgo(a.publishedAt)}</time>
      </div>

      <h3 className="card-title">
        <a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a>
      </h3>

      {a.summary ? (
        <div className="overview">
          <span className="label">Overview</span>
          <p>{a.summary}</p>
        </div>
      ) : (
        <p className="muted small">No summary available — tap through to the original.</p>
      )}
      {a.whyItMatters && (
        <p className="why">
          <span className="label">Why it matters</span> {a.whyItMatters}
        </p>
      )}

      <div className="card-foot">
        <a className="read" href={a.url} target="_blank" rel="noopener noreferrer">Read original →</a>
        <div className="chips">
          {a.categories.map((c) => (
            <span key={c} className="chip">{catLabels[c] ?? c}</span>
          ))}
        </div>
      </div>

      {a.alsoCoveredBy?.length ? (
        <details className="also">
          <summary>Also covered by {a.alsoCoveredBy.length} other source{a.alsoCoveredBy.length > 1 ? "s" : ""}</summary>
          <ul>
            {a.alsoCoveredBy.map((o) => (
              <li key={o.url}><a href={o.url} target="_blank" rel="noopener noreferrer">{o.source}</a></li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}
