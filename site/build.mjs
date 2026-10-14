#!/usr/bin/env node
// Renders README.md into a static site. Usage: node site/build.mjs [outDir]
// Everything on the page comes from README.md, the git repo and the GitHub API;
// site/template.html holds only layout. Set GITHUB_TOKEN to raise the API rate limit.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SITE, "..");
const OUT = resolve(process.argv[2] || join(ROOT, "_site"));
const BUILD_FILES = new Set(["template.html", "build.mjs"]);
const ICON_STAR = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 .9l2.2 4.5 4.9.7-3.6 3.5.9 4.9L8 12.2l-4.4 2.3.9-4.9L.9 6.1l4.9-.7z"/></svg>';

// ---------- helpers ----------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const snake = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "section";
const link = (href, html) => `<a href="${esc(href)}" target="_blank" rel="noopener">${html}</a>`;
const stripMd = (s) => s.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)|!\[[^\]]*\]\([^)]*\)/g, "")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();

function git(cmd) {
  try { return execSync(`git ${cmd}`, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; }
}

function shortUrl(u) {
  try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname).replace(/\/$/, ""); } catch { return u; }
}

function ghRepo(u) {
  const m = u.match(/^https?:\/\/(?:www\.)?github\.com\/([^/?#]+)\/([^/?#]+)/);
  return m ? { owner: m[1], name: m[2].replace(/\.git$/, "") } : null;
}

function formatStars(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e4) return Math.round(n / 1e3) + "k";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

// Markdown links, bare URLs, inline code and bold; everything else is escaped.
function inline(s) {
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)<]+)|`([^`]+)`|\*\*([^*]+)\*\*/g;
  let out = "", last = 0, m;
  while ((m = re.exec(s))) {
    out += esc(s.slice(last, m.index));
    if (m[1]) out += link(m[2], esc(m[1]));
    else if (m[3]) {
      const u = m[3].replace(/[.,;:]+$/, "");
      out += link(u, esc(shortUrl(u))) + esc(m[3].slice(u.length));
    } else if (m[4]) out += `<code>${esc(m[4])}</code>`;
    else out += `<strong>${esc(m[5])}</strong>`;
    last = re.lastIndex;
  }
  return out + esc(s.slice(last));
}

function nameFromUrl(u) {
  const repo = ghRepo(u);
  if (repo) return repo.name;
  try {
    const x = new URL(u), host = x.hostname.replace(/^www\./, ""), parts = x.pathname.split("/").filter(Boolean);
    if (host === "github.blog" && parts.length) return parts.at(-1).replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/-/g, " ");
    return host.split(".")[0];
  } catch { return u; }
}

function hostLabel(u) {
  const repo = ghRepo(u);
  if (repo) return `${repo.owner}/${repo.name}`;
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

function logoUrl(u) {
  const repo = ghRepo(u);
  if (repo) return { src: `https://github.com/${repo.owner}.png?size=72`, cls: "" };
  try {
    const host = new URL(u).hostname;
    // Project pages (owner.github.io) get the owner's avatar; other sites get their favicon.
    const pages = host.match(/^([^.]+)\.github\.io$/);
    if (pages) return { src: `https://github.com/${pages[1]}.png?size=72`, cls: "" };
    return { src: `https://icons.duckduckgo.com/ip3/${host}.ico`, cls: "ico" };
  } catch { return null; }
}

// ---------- parsing ----------

// Accepts "Name: url — desc", "[Name](url) — desc", "**Name** url - desc", or a bare URL.
function parseEntry(s) {
  const m = s.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)<]+)/);
  if (!m) return null;
  const url = m[2] || m[3].replace(/[.,;:]+$/, "");
  const before = stripMd(s.slice(0, m.index)).replace(/[\s:–—-]+$/, "");
  const after = s.slice(m.index + m[0].length).replace(/^[.,;:)]*\s*[—–-]*\s*/, "").trim();
  const label = before || (m[1] && stripMd(m[1])) || nameFromUrl(url);
  return { label, url, desc: after, named: Boolean(before || m[1]) };
}

function parse(md) {
  const doc = { title: "", intro: [], note: [], sections: [] };
  let sec = null, group = null, para = null;
  const flush = () => { para = null; };
  const addProse = (target, line) => {
    if (para && para.target === target) para.lines.push(line);
    else { para = { target, lines: [line] }; target.push(para.lines); }
  };

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    let m;
    if (!line) { flush(); continue; }
    if (/^<!--.*-->$/.test(line)) continue;
    if ((m = line.match(/^#\s+(.*)$/))) { doc.title = stripMd(m[1]); flush(); continue; }
    if ((m = line.match(/^##\s+(.*)$/))) {
      const name = stripMd(m[1]);
      sec = { name, id: slug(name), entries: [], prose: [], hasGroups: false };
      group = null; flush();
      if (sec.id !== "contents" && sec.id !== "table-of-contents") doc.sections.push(sec);
      continue;
    }
    if ((m = line.match(/^#{3,6}\s+(.*)$/)) && sec) { group = stripMd(m[1]); sec.hasGroups = true; flush(); continue; }
    if (!sec) {
      if (line.startsWith(">")) addProse(doc.note, line.replace(/^>\s?/, ""));
      else addProse(doc.intro, line);
      continue;
    }
    if ((m = line.match(/^(?:[-*+]|\d+\.)\s+(.*)$/))) {
      flush();
      const e = parseEntry(m[1]);
      if (e) { e.group = group; sec.entries.push(e); }
      else sec.prose.push([m[1]]);
      continue;
    }
    addProse(sec.prose, line.replace(/^>\s?/, ""));
  }
  for (const s of doc.sections) s.prose = s.prose.map((p) => p.join(" "));
  doc.intro = doc.intro.map((p) => p.join(" "));
  doc.note = doc.note.map((p) => p.join(" "));
  return doc;
}

// Decide how each entry is titled and grouped, and give it a stable anchor.
function layout(sec) {
  const labels = sec.entries.map((e) => e.label);
  sec.mode = sec.hasGroups ? "subheadings" : new Set(labels).size < labels.length ? "categories" : "flat";
  sec.entries.forEach((e, i) => {
    e.id = `${sec.id}-${i + 1}`;
    e.title = sec.mode === "categories" ? nameFromUrl(e.url) : e.label;
    e.groupName = sec.mode === "subheadings" ? e.group || "" : sec.mode === "categories" ? e.label : "";
  });
}

// ---------- GitHub data ----------

async function fetchRepos(entries) {
  const token = process.env.GITHUB_TOKEN;
  const keys = [...new Set(entries.map((e) => ghRepo(e.url)).filter(Boolean).map((r) => `${r.owner}/${r.name}`))];
  const out = new Map();
  let failed = 0;
  await Promise.all(keys.map(async (key) => {
    try {
      const res = await fetch(`https://api.github.com/repos/${key}`, {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "awesome-list-site", ...(token && { Authorization: `Bearer ${token}` }) },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      out.set(key.toLowerCase(), { stars: data.stargazers_count, archived: data.archived });
    } catch { failed++; }
  }));
  if (failed) console.log(`GitHub stats unavailable for ${failed} of ${keys.length} repos; those rows show no star count.`);
  return out;
}

// ---------- rendering ----------

function entryRow(e, repos) {
  const repo = ghRepo(e.url);
  const info = repo && repos.get(`${repo.owner}/${repo.name}`.toLowerCase());
  const logo = logoUrl(e.url);
  const search = [e.title, e.label, e.groupName, e.desc, e.url].filter(Boolean).join(" ").toLowerCase();
  const badges = [
    info?.archived ? '<span class="archived">archived</span>' : "",
    info && typeof info.stars === "number" ? `<span class="stars" title="${info.stars.toLocaleString("en-US")} GitHub stars">${ICON_STAR}${formatStars(info.stars)}</span>` : "",
  ].join("");
  const meta = (badges ? `<span class="badges">${badges}</span>` : "") +
    `<span class="host" title="${esc(e.url)}">${esc(hostLabel(e.url))}</span>`;
  return `<li class="entry" id="${e.id}" data-search="${esc(search)}">` +
    `<span class="logo" aria-hidden="true">${esc([...e.title.trim()][0] || "?")}` +
    (logo ? `<img class="${logo.cls}" src="${esc(logo.src)}" alt="" width="36" height="36" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : "") +
    `</span><div class="entry-main"><a class="entry-title" href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>` +
    (e.desc ? `<p class="entry-desc">${inline(e.desc)}</p>` : "") +
    `</div><div class="entry-meta">${meta}</div></li>`;
}

function renderSection(sec, repos) {
  let body = "";
  if (sec.mode === "flat") {
    if (sec.entries.length) body = `<ul class="entries">${sec.entries.map((e) => entryRow(e, repos)).join("")}</ul>`;
  } else {
    const groups = new Map();
    for (const e of sec.entries) {
      if (!groups.has(e.groupName)) groups.set(e.groupName, []);
      groups.get(e.groupName).push(e);
    }
    for (const [g, list] of groups) {
      body += `<div class="group">` +
        (g ? `<p class="group-label">${esc(g)}<span>${list.length}</span></p>` : "") +
        `<ul class="entries">${list.map((e) => entryRow(e, repos)).join("")}</ul></div>`;
    }
  }
  const n = sec.entries.length;
  return `<section class="sec" id="${sec.id}" aria-labelledby="h-${sec.id}">` +
    `<div class="section-head"><h2 id="h-${sec.id}">${esc(sec.name)}</h2>` +
    (n ? `<span class="count" title="${n} ${n === 1 ? "entry" : "entries"}">${n}</span>` : "") + `</div>` +
    sec.prose.map((p) => `<p class="prose">${inline(p)}</p>`).join("") +
    (body ? `<div class="panel">${body}</div>` : "") + `</section>`;
}

function renderTree(sections) {
  const listed = sections.filter((s) => s.entries.length);
  return listed.map((s, i) => {
    const branch = i === listed.length - 1 ? "└─ " : "├─ ";
    const dots = s.entries.map((e) => `<a href="#${e.id}" title="${esc(e.title)}" aria-label="${esc(e.title)}"></a>`).join("");
    return `<li class="row" style="--i:${i}"><a class="label" href="#${s.id}"><span class="br">${branch}</span>` +
      `<span class="nm">${snake(s.name)}</span><span class="n">${s.entries.length}</span></a><span class="dots">${dots}</span></li>`;
  }).join("");
}

function repoInfo() {
  let repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    const m = git("config --get remote.origin.url").match(/github\.com[:/](.+?)(?:\.git)?$/);
    repo = m ? m[1] : "";
  }
  const branch = process.env.GITHUB_REF_NAME || git("rev-parse --abbrev-ref HEAD") || "main";
  const url = repo ? `https://github.com/${repo}` : "";
  return { url, readme: url ? `${url}#readme` : "README.md", edit: url ? `${url}/edit/${branch}/README.md` : "README.md" };
}

async function build() {
  const md = readFileSync(join(ROOT, "README.md"), "utf8");
  const doc = parse(md);
  const repo = repoInfo();

  const meta = { overview: null, contributing: null };
  const body = [];
  for (const s of doc.sections) {
    if (!s.entries.length && (s.id === "overview" || s.id === "about") && !meta.overview) meta.overview = s;
    else if (!s.entries.length && /^contribut/.test(s.id) && !meta.contributing) meta.contributing = s;
    else body.push(s);
  }
  body.forEach(layout);
  const all = body.flatMap((s) => s.entries);
  const repos = await fetchRepos(all);

  const total = all.length;
  const counted = body.filter((s) => s.entries.length).length;
  const title = doc.title || "Awesome list";
  const awesome = title.match(/^awesome[\s_-]+(.+)$/i);
  const description = stripMd(doc.intro[0] || meta.overview?.prose[0] || title);
  const updated = git("log -1 --format=%cs -- README.md") || new Date().toISOString().slice(0, 10);

  const vars = {
    TITLE: esc(title),
    TITLE_MAIN: esc(awesome ? awesome[1] : title),
    KICKER: (awesome ? '<span class="tag">awesome</span>' : "") + `<span><b>${total}</b> resources · <b>${counted}</b> sections</span>`,
    DESCRIPTION: esc(description),
    TAGLINE: doc.intro.map((p, i) => `<p class="${i ? "overview" : "tagline"}">${inline(p)}</p>`).join(""),
    OVERVIEW: meta.overview ? meta.overview.prose.map((p) => `<p class="overview">${inline(p)}</p>`).join("") : "",
    ROOT_NODE: esc(snake(title)),
    TOTAL: String(total),
    TREE: renderTree(body),
    TOC: body.map((s) => `<li data-for="${s.id}"><a href="#${s.id}">${esc(s.name)}<span>${s.entries.length || ""}</span></a></li>`).join(""),
    SECTIONS: body.map((s) => renderSection(s, repos)).join("\n"),
    CONTRIBUTING_TITLE: esc(meta.contributing?.name || "Contributing"),
    CONTRIBUTING: [...(meta.contributing?.prose || []), ...doc.note].map((p) => `<p>${inline(p)}</p>`).join("") || "<p>Pull requests welcome.</p>",
    REPO_URL: esc(repo.url || "#"),
    README_URL: esc(repo.readme),
    EDIT_URL: esc(repo.edit),
    UPDATED: esc(updated),
    BUILT: new Date().toISOString().slice(0, 10),
  };

  const template = readFileSync(join(SITE, "template.html"), "utf8");
  const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`template.html uses unknown placeholder {{${k}}}`);
    return vars[k];
  });

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "index.html"), html);
  for (const f of readdirSync(SITE)) if (!BUILD_FILES.has(f)) copyFileSync(join(SITE, f), join(OUT, f));

  const unnamed = body.flatMap((s) => s.entries.filter((e) => !e.named).map((e) => `  ${s.name}: ${e.url}`));
  const notes = body.flatMap((s) => (s.entries.length ? s.prose.map((p) => `  ${s.name}: ${p}`) : []));
  console.log(`Built ${join(OUT, "index.html")}: ${total} entries in ${counted} sections, ${repos.size} with GitHub stats.`);
  if (unnamed.length) console.log(`Entries without a name (titled from the URL):\n${unnamed.join("\n")}`);
  if (notes.length) console.log(`Text without a link (shown as section notes):\n${notes.join("\n")}`);
}

await build();
