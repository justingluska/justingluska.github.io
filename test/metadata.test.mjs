import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const SITE_URL = "https://www.justingluska.com/";

async function readText(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function extractJsonLd(html) {
  const match = html.match(
    /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i,
  );
  assert.ok(match, "homepage should include JSON-LD");
  return JSON.parse(match[1]);
}

async function assertFileExists(path) {
  await access(new URL(`../${path}`, import.meta.url));
}

async function readBytes(path) {
  return readFile(new URL(`../${path}`, import.meta.url));
}

test("homepage exposes canonical person metadata", async () => {
  const html = await readText("index.html");
  const jsonLd = extractJsonLd(html);

  assert.match(html, /<link rel="canonical" href="https:\/\/www\.justingluska\.com\/">/);
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<meta property="og:type" content="profile">/);
  assert.match(html, /<meta name="twitter:card" content="summary">/);
  assert.match(html, /<p[^>]*class="bio"[^>]*>/);
  assert.match(html, /href="\/about\/"/);

  assert.equal(jsonLd["@context"], "https://schema.org");
  assert.equal(jsonLd["@type"], "Person");
  assert.equal(jsonLd["@id"], `${SITE_URL}#justin-gluska`);
  assert.equal(jsonLd.name, "Justin Gluska");
  assert.equal(jsonLd.url, SITE_URL);
  assert.ok(
    jsonLd.description.includes("software-led product builder"),
    "description should include the canonical descriptor",
  );
  assert.equal(jsonLd.jobTitle, "Software-led product builder");
  assert.ok(jsonLd.sameAs.includes("https://github.com/justingluska"));
  assert.ok(jsonLd.sameAs.includes("https://twitter.com/gluska"));
  assert.ok(jsonLd.sameAs.includes("https://apps.apple.com/us/developer/justin-gluska/id1476556395"));
  assert.equal(jsonLd.image, "https://www.justingluska.com/images/justin-gluska.jpg");
});

test("about page exposes a sourced entity-home profile", async () => {
  const html = await readText("about/index.html");
  const css = await readText("css/blog.css");
  const jsonLd = extractJsonLd(html);

  assert.match(html, /<link rel="canonical" href="https:\/\/www\.justingluska\.com\/about\/">/);
  assert.match(html, /<img[^>]+src="\/images\/justin-gluska\.jpg"[^>]+alt="Justin Gluska"[^>]+width="96"[^>]+height="96"/);
  assert.match(css, /\.profile\s*{[\s\S]*grid-template-columns: 96px 1fr;/);
  assert.match(css, /\.profile-photo\s*{[\s\S]*width: 96px;[\s\S]*height: 96px;/);
  assert.match(html, /<h1>about me<\/h1>/);
  assert.match(html, /I'm a software-led product builder working across AI, SEO, content systems, and practical software tools\./);
  assert.match(html, /I build products and practical software tools around SEO, publishing, AI, and business problems\./);
  assert.doesNotMatch(html, /My first real internet project/i);
  assert.doesNotMatch(html, /300,000 visitors a month/i);
  assert.doesNotMatch(html, /That pulled me deeper into SEO/i);
  assert.doesNotMatch(html, /Syracuse University/);
  assert.doesNotMatch(html, /class="chapter/);
  assert.doesNotMatch(html, /class="fact-list"/);

  assert.equal(jsonLd["@type"], "Person");
  assert.equal(jsonLd["@id"], `${SITE_URL}#justin-gluska`);
  assert.equal(jsonLd.mainEntityOfPage, `${SITE_URL}about/`);
  assert.equal(jsonLd.image, `${SITE_URL}images/justin-gluska.jpg`);
  assert.ok(jsonLd.subjectOf.length >= 2);
});

test("about page keeps a compact profile layout", async () => {
  const html = await readText("about/index.html");
  const css = await readText("css/blog.css");

  assert.match(html, /<main class="profile">/);
  assert.match(html, /<section class="elsewhere">/);
  assert.match(css, /\.elsewhere\s*{/);
  assert.doesNotMatch(css, /\.chapter-title\s*{/);
  assert.doesNotMatch(css, /\.fact-list\s*{/);
  assert.doesNotMatch(css, /\.profile-photo-frame\s*{/);
});

test("headshot asset is present", async () => {
  await assertFileExists("images/justin-gluska.jpg");
});

test("favicon assets expose the homepage J mark", async () => {
  const homepage = await readText("index.html");
  const about = await readText("about/index.html");
  const faviconSvg = await readText("favicon.svg");
  const faviconPng = await readBytes("favicon.png");

  assert.match(homepage, /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml">/);
  assert.match(homepage, /<link rel="alternate icon" href="\/favicon\.png" type="image\/png">/);
  assert.match(about, /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml">/);
  assert.match(about, /<link rel="alternate icon" href="\/favicon\.png" type="image\/png">/);
  assert.match(faviconSvg, /viewBox="0 0 160 160"/);
  assert.match(faviconSvg, /M 0 0 L 150 0 L 100 150/);
  assert.deepEqual([...faviconPng.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  await assertFileExists("favicon.ico");
  await assertFileExists("favicon-32x32.png");
  await assertFileExists("favicon-16x16.png");
  await assertFileExists("apple-touch-icon.png");
});

test("crawl files expose the public pages", async () => {
  const robots = await readText("robots.txt");
  const sitemap = await readText("sitemap.xml");

  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/www\.justingluska\.com\/sitemap\.xml/);

  assert.match(sitemap, /<loc>https:\/\/www\.justingluska\.com\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/www\.justingluska\.com\/about\/<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/www\.justingluska\.com\/projects\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/www\.justingluska\.com\/blog\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/www\.justingluska\.com\/other\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/www\.justingluska\.com\/other\/zone-of-genius\/<\/loc>/);
});
