"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import Mascot, { type Mood } from "@/components/Mascot";
import type { Article } from "@/lib/types";

type Cat = { id: string; label: string; emoji: string; parentId?: string; defaultEnabled: boolean };
type SourceStatus = { name: string; ok: boolean; count: number; error?: string };
type Result = { articles: Article[]; sources: SourceStatus[]; aiSummaries: boolean; fetchedAt?: string };

const load = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export default function Home() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [celebrate, setCelebrate] = useState(false);

  // Load categories + saved preferences
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((cs: Cat[]) => {
        setCats(cs);
        setEnabled(load("utr:enabled", cs.filter((c) => c.defaultEnabled).map((c) => c.id)));
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        setAnimations(load("utr:animations", !reduce));
      });
  }, []);

  const run = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      setData(await r.json());
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1600);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFeed = useCallback(() => {
    if (!enabled.length) return setData({ articles: [], sources: [], aiSummaries: false });
    run(`/api/feed?categories=${enabled.join(",")}`);
  }, [enabled, run]);

  useEffect(() => {
    if (cats.length && searchTerm === null) loadFeed();
  }, [cats.length, enabled, searchTerm, loadFeed]);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return clearSearch();
    setSearchTerm(q);
    run(`/api/search?q=${encodeURIComponent(q)}`);
  };
  const clearSearch = () => {
    setQuery("");
    setSearchTerm(null);
  };

  const toggleCat = (id: string) => {
    const next = enabled.includes(id) ? enabled.filter((x) => x !== id) : [...enabled, id];
    setEnabled(next);
    save("utr:enabled", next);
    if (!next.includes(tab)) setTab("all");
  };
  const toggleAnimations = () => {
    setAnimations(!animations);
    save("utr:animations", !animations);
  };

  const catLabels = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, `${c.emoji} ${c.label}`])), [cats]);
  const visible = useMemo(() => {
    const list = data?.articles ?? [];
    return searchTerm || tab === "all" ? list : list.filter((a) => a.categories.includes(tab));
  }, [data, tab, searchTerm]);

  const mood: Mood = loading ? "dig" : celebrate ? "celebrate" : "idle";
  const failed = data?.sources.filter((s) => !s.ok) ?? [];

  return (
    <main className="wrap">
      <header className="top">
        <div className="brand">
          <Mascot mood={mood} size={64} animate={animations} />
          <div>
            <h1>under the rock</h1>
            <p className="tagline">news you'd otherwise miss</p>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setShowSettings(!showSettings)} aria-label="Settings">⚙︎</button>
      </header>

      {showSettings && (
        <section className="settings">
          <h2>Your interests</h2>
          <div className="toggles">
            {cats.map((c) => (
              <label key={c.id} className={`toggle ${c.parentId ? "sub" : ""}`}>
                <input type="checkbox" checked={enabled.includes(c.id)} onChange={() => toggleCat(c.id)} />
                <span>{c.emoji} {c.label}</span>
                {c.parentId && <em className="muted small"> subtopic of {catLabels[c.parentId]}</em>}
              </label>
            ))}
          </div>
          <p className="muted small">More categories can be added in <code>src/config/categories.ts</code>.</p>
          <label className="toggle">
            <input type="checkbox" checked={animations} onChange={toggleAnimations} />
            <span>Cute animations</span>
          </label>
        </section>
      )}

      <form className="search" onSubmit={doSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any topic (not limited to your interests)…"
          aria-label="Search news"
        />
        <button type="submit">Search</button>
      </form>

      {searchTerm ? (
        <div className="search-banner">
          Results for <strong>“{searchTerm}”</strong>
          <button className="link" onClick={clearSearch}>← back to my feed</button>
        </div>
      ) : (
        <nav className="tabs">
          <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>All</button>
          {cats.filter((c) => enabled.includes(c.id)).map((c) => (
            <button key={c.id} className={tab === c.id ? "on" : ""} onClick={() => setTab(c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
          <button className="refresh" onClick={loadFeed} disabled={loading} aria-label="Refresh">↻</button>
        </nav>
      )}

      {data && !data.aiSummaries && !loading && (
        <p className="notice">
          AI summaries are off, so each overview is the source's own blurb. Add an <code>ANTHROPIC_API_KEY</code> to <code>.env.local</code> to turn them on.
        </p>
      )}

      {error && <p className="notice err">Couldn't load news: {error}</p>}

      {loading && !data ? (
        /* ANIMATION SLOT: first-load / digging */
        <div className="state">
          <Mascot mood="dig" size={120} animate={animations} />
          <p>Digging for news…</p>
        </div>
      ) : visible.length === 0 && !loading ? (
        /* ANIMATION SLOT: empty state */
        <div className="state">
          <Mascot mood="sleep" size={120} animate={animations} />
          <p>{enabled.length || searchTerm ? "Nothing here yet. Quiet day under the rock." : "Turn on an interest in settings ⚙︎ to fill your feed."}</p>
        </div>
      ) : (
        <section className={`list ${loading ? "dim" : ""}`}>
          {visible.map((a) => (
            <ArticleCard key={a.id} a={a} catLabels={catLabels} />
          ))}
        </section>
      )}

      {data && data.sources.length > 0 && (
        <details className="sources">
          <summary>
            Sources checked: {data.sources.filter((s) => s.ok).length}/{data.sources.length} OK
            {failed.length ? ` · ${failed.length} unavailable` : ""}
          </summary>
          <ul>
            {data.sources.map((s) => (
              <li key={s.name} className={s.ok ? "" : "bad"}>
                {s.ok ? "✓" : "✗"} {s.name} {s.ok ? `(${s.count})` : `— ${s.error}`}
              </li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}
