#!/usr/bin/env node
/**
 * Shopora V11 product-photo fetcher.
 *
 * Goal:
 * - 40 distinct, high-resolution Pexels photos
 * - 5 photos for each of 8 Shopora product types
 * - stronger relevance ranking than the V1 script
 * - reject obvious brand/logo matches
 * - penalize people-heavy photos
 * - cache Pexels searches for 24h to save API quota
 * - create a review sheet + productId -> image map
 *
 * Run from repo root (Node 18+):
 *   PowerShell:
 *     $env:PEXELS_API_KEY="your_key"
 *     node scripts/fetch-product-images.mjs
 *
 * Optional:
 *   --only yoga-mat
 *   --size 1000
 *   --refresh            bypass 24h API search cache
 *
 * Manual curation:
 *   scripts/image-overrides.json
 *   {
 *     "pin": { "yoga-mat": [1234567] },
 *     "block": [7654321]
 *   }
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'client', 'public', 'products', 'real');
const CACHE_DIR = path.join(ROOT, 'scripts', '.pexels-cache');
const REVIEW_DIR = path.join(ROOT, 'scripts', '.image-review');
const MAP_FILE = path.join(ROOT, 'scripts', 'product-image-map.json');
const OVERRIDES_FILE = path.join(ROOT, 'scripts', 'image-overrides.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const CATEGORIES = [
  {
    name: 'Protein Powder',
    slug: 'protein-powder',
    productIds: [1001, 1002, 1003, 1004, 1005],
    productNames: ['CoreFuel Vanilla', 'CoreFuel Chocolate', 'PeakForm Strawberry', 'PureLift Cookies', 'Atlas Whey Mocha'],
    queries: [
      'protein powder supplement container studio',
      'whey protein powder scoop minimal',
      'protein supplement jar gym flat lay',
      'protein powder shaker scoop product',
    ],
    keywords: ['protein', 'powder', 'whey', 'supplement', 'scoop', 'jar', 'container'],
  },
  {
    name: 'Protein Bar',
    slug: 'protein-bar',
    productIds: [1006, 1007, 1008, 1009, 1010],
    productNames: ['PulseBar Cocoa', 'PulseBar Peanut', 'LeanBite Berry', 'LiftBar Almond', 'FuelSquare Coffee'],
    queries: [
      'protein bar minimal product food',
      'energy bar flat lay snack',
      'granola protein bar studio',
      'healthy snack bar close up',
    ],
    keywords: ['bar', 'protein', 'energy', 'granola', 'snack'],
  },
  {
    name: 'Jump Rope',
    slug: 'jump-rope',
    productIds: [1011, 1012, 1013, 1014, 1015],
    productNames: ['RopeRush Speed Pro', 'RopeRush Endurance', 'SwiftCord Beginner', 'AeroSkip Steel', 'TempoRope Flex'],
    queries: [
      'jump rope gym equipment flat lay',
      'skipping rope isolated fitness equipment',
      'jump rope on gym floor',
      'speed rope workout equipment close up',
    ],
    keywords: ['jump', 'rope', 'skipping', 'speed rope', 'fitness'],
  },
  {
    name: 'Resistance Bands',
    slug: 'resistance-bands',
    productIds: [1016, 1017, 1018, 1019, 1020],
    productNames: ['FlexForm Light', 'FlexForm Medium', 'FlexForm Heavy', 'LoopSet Pro', 'PowerBand Max'],
    queries: [
      'resistance bands fitness equipment flat lay',
      'exercise resistance bands isolated',
      'workout bands gym floor',
      'elastic fitness bands product',
    ],
    keywords: ['resistance', 'bands', 'band', 'elastic', 'fitness'],
  },
  {
    name: 'Fitness Tracker',
    slug: 'fitness-tracker',
    productIds: [1021, 1022, 1023, 1024, 1025],
    productNames: ['TrackOne Active', 'TrackOne Pulse', 'MoveSync Mini', 'MoveSync Pro', 'VitaBand Core'],
    queries: [
      'fitness tracker wrist band minimal product',
      'smart fitness band close up generic',
      'activity tracker wearable dark background',
      'fitness watch gym equipment flat lay',
    ],
    keywords: ['fitness', 'tracker', 'watch', 'wearable', 'activity', 'band'],
  },
  {
    name: 'Yoga Mat',
    slug: 'yoga-mat',
    productIds: [1026, 1027, 1028, 1029, 1030],
    productNames: ['GroundFlow Essential', 'GroundFlow Grip Pro', 'AlignMat Sand', 'AlignMat Sage', 'StudioBase Charcoal'],
    queries: [
      'rolled yoga mat minimal studio',
      'yoga mat flat lay equipment',
      'exercise mat isolated product',
      'yoga mat gym floor close up',
    ],
    keywords: ['yoga', 'mat', 'exercise mat', 'rolled mat'],
  },
  {
    name: 'Foam Roller',
    slug: 'foam-roller',
    productIds: [1031, 1032, 1033, 1034, 1035],
    productNames: ['RecoverRoll Soft', 'RecoverRoll Grid', 'ReleaseCore Firm', 'ReleaseCore Mini', 'MobilityRoll Wave'],
    queries: [
      'foam roller fitness equipment product',
      'foam roller gym floor flat lay',
      'massage foam roller isolated',
      'recovery roller fitness close up',
    ],
    keywords: ['foam', 'roller', 'recovery', 'massage', 'fitness'],
  },
  {
    name: 'Shaker Bottle',
    slug: 'shaker-bottle',
    productIds: [1036, 1037, 1038, 1039, 1040],
    productNames: ['MixFlow 600', 'MixFlow 750', 'HydraMix Smoke', 'HydraMix Coral', 'FuelBottle Frost'],
    queries: [
      'protein shaker bottle gym product',
      'shaker bottle fitness flat lay',
      'gym water bottle minimal product',
      'protein shake bottle close up',
    ],
    keywords: ['shaker', 'bottle', 'protein shake', 'water bottle', 'gym'],
  },
];

const PERSON_WORDS = [
  'woman', 'women', 'man', 'men', 'person', 'people', 'girl', 'boy', 'couple',
  'athlete', 'model', 'bodybuilder', 'runner', 'yogi', 'trainer', 'coach',
];

// Obvious third-party brands/logos should not become Shopora product imagery.
const HARD_BLOCK_WORDS = [
  'logo', 'nike', 'adidas', 'puma', 'reebok', 'under armour', 'gymshark',
  'apple watch', 'samsung', 'fitbit', 'garmin', 'myprotein', 'muscleblaze',
  'optimum nutrition', 'gatorade', 'decathlon', 'lululemon', 'reebok',
];

const PREFERRED_WORDS = [
  'minimal', 'isolated', 'flat lay', 'close up', 'studio', 'equipment', 'product',
  'black background', 'white background', 'gym floor', 'table',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const opts = {
    only: null,
    size: 1000,
    refresh: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--only') opts.only = argv[++i];
    else if (arg === '--size') opts.size = Number(argv[++i]);
    else if (arg === '--refresh') opts.refresh = true;
  }

  if (!Number.isInteger(opts.size) || opts.size < 700 || opts.size > 2000) {
    throw new Error('--size must be an integer between 700 and 2000');
  }

  return opts;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function normalizedText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function containsAny(text, words) {
  return words.some((word) => text.includes(word));
}

function cacheFileFor(query, orientation) {
  const key = crypto
    .createHash('sha1')
    .update(`${query}|${orientation}`)
    .digest('hex');

  return path.join(CACHE_DIR, `${key}.json`);
}

async function pexelsGet(apiKey, url) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (response.status === 429) {
      await sleep(1600 * attempt);
      continue;
    }

    if (response.status === 401) {
      throw new Error('Pexels rejected the API key (401). Check PEXELS_API_KEY.');
    }

    if (!response.ok) {
      throw new Error(`Pexels API failed (${response.status}): ${url}`);
    }

    return response.json();
  }

  throw new Error('Pexels rate limit hit repeatedly. Wait and run again.');
}

async function search(apiKey, query, orientation, refresh) {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const cacheFile = cacheFileFor(query, orientation);

  if (!refresh && (await fileExists(cacheFile))) {
    const stat = await fs.stat(cacheFile);
    if (Date.now() - stat.mtimeMs < CACHE_TTL_MS) {
      return readJson(cacheFile, []);
    }
  }

  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '80');
  url.searchParams.set('orientation', orientation);

  const data = await pexelsGet(apiKey, url.toString());
  const photos = data.photos ?? [];

  await fs.writeFile(cacheFile, JSON.stringify(photos, null, 2), 'utf8');
  return photos;
}

function scorePhoto(photo, category) {
  const alt = normalizedText(photo.alt);

  if (containsAny(alt, HARD_BLOCK_WORDS)) return -Infinity;

  let score = 0;

  for (const keyword of category.keywords) {
    if (alt.includes(keyword)) score += 10;
  }

  for (const word of PREFERRED_WORDS) {
    if (alt.includes(word)) score += 2;
  }

  for (const word of PERSON_WORDS) {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(alt)) score -= 8;
  }

  const shortest = Math.min(photo.width || 0, photo.height || 0);
  if (shortest >= 1800) score += 4;
  else if (shortest >= 1200) score += 2;

  const width = Number(photo.width || 1);
  const height = Number(photo.height || 1);
  const ratio = width / height;
  const squareDistance = Math.abs(Math.log(ratio));
  score -= squareDistance * 4;

  return score;
}

async function photoById(apiKey, id) {
  return pexelsGet(apiKey, `https://api.pexels.com/v1/photos/${id}`);
}

async function collectPool(apiKey, category, refresh) {
  const pool = new Map();

  // Square first gives better ecommerce card crops. Landscape is fallback/variety.
  for (const orientation of ['square', 'landscape']) {
    for (const query of category.queries) {
      const photos = await search(apiKey, query, orientation, refresh);

      for (const photo of photos) {
        if (Math.min(photo.width || 0, photo.height || 0) < 900) continue;
        pool.set(photo.id, photo);
      }

      await sleep(160);
    }
  }

  return [...pool.values()]
    .map((photo) => ({
      photo,
      score: scorePhoto(photo, category),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score);
}

function chooseDiverse(entries, count, { usedIds, blockedIds, photographerCounts }) {
  const chosen = [];

  const tryPass = (maxPerPhotographer) => {
    for (const entry of entries) {
      if (chosen.length >= count) break;

      const photo = entry.photo;
      if (!photo || usedIds.has(photo.id) || blockedIds.has(photo.id)) continue;

      const photographer = normalizedText(photo.photographer) || `unknown-${photo.id}`;
      const usedByPhotographer = photographerCounts.get(photographer) || 0;
      if (usedByPhotographer >= maxPerPhotographer) continue;

      chosen.push(entry);
      usedIds.add(photo.id);
      photographerCounts.set(photographer, usedByPhotographer + 1);
    }
  };

  tryPass(2);
  if (chosen.length < count) tryPass(Number.POSITIVE_INFINITY);

  return chosen;
}

function imageUrl(photo, size) {
  const url = new URL(photo.src.original);
  url.searchParams.set('auto', 'compress');
  url.searchParams.set('cs', 'tinysrgb');
  url.searchParams.set('fit', 'crop');
  url.searchParams.set('w', String(size));
  url.searchParams.set('h', String(size));
  url.searchParams.set('dpr', '1');
  return url.toString();
}

async function download(url, file) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}): ${url}`);
  }

  await fs.writeFile(file, Buffer.from(await response.arrayBuffer()));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

async function writeReviewSheet(manifest) {
  await fs.mkdir(REVIEW_DIR, { recursive: true });

  const groups = Object.entries(manifest.categories)
    .map(([slug, items]) => {
      const cards = items
        .map((item) => `
          <figure>
            <img src="../../client/public${escapeHtml(item.publicPath)}" alt="${escapeHtml(item.alt)}">
            <figcaption>
              <strong>#${item.productId} — ${escapeHtml(item.productName)}</strong><br>
              ${escapeHtml(item.category)}<br>
              Score: ${item.score.toFixed(1)} · Pexels ${item.pexelsId}<br>
              <a href="${escapeHtml(item.pexelsUrl)}" target="_blank" rel="noopener">Open photo page</a><br>
              Photo by ${escapeHtml(item.photographer)}
            </figcaption>
          </figure>`)
        .join('');

      return `<section><h2>${escapeHtml(slug)}</h2><div class="grid">${cards}</div></section>`;
    })
    .join('');

  const html = `<!doctype html>
<meta charset="utf-8">
<title>Shopora product photo review</title>
<style>
  body{font:14px system-ui;margin:28px;background:#f4f1ea;color:#111}
  h1{font-size:30px;margin-bottom:6px}h2{margin-top:38px;text-transform:capitalize}
  .note{max-width:900px;color:#555;line-height:1.6}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
  figure{margin:0;background:#fff;border:1px solid #d9d4ca;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.05)}
  img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#eee}
  figcaption{padding:12px 14px;line-height:1.55}
  a{color:#4f46e5}
</style>
<h1>Shopora — review all 40 product photos</h1>
<p class="note">
  Reject anything that shows a visible third-party logo, clearly branded packaging, a wrong product, or an awkward crop.
  Put its Pexels id into <code>scripts/image-overrides.json</code> under <code>block</code>, then run the fetcher again.
  You can pin a specific Pexels photo id per category under <code>pin</code>.
</p>
${groups}`;

  const reviewFile = path.join(REVIEW_DIR, 'index.html');
  await fs.writeFile(reviewFile, html, 'utf8');
  return reviewFile;
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const apiKey = env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing PEXELS_API_KEY. Set it only in your shell session; do not commit it.');
  }

  const opts = parseArgs(argv);
  const overrides = await readJson(OVERRIDES_FILE, { pin: {}, block: [] });
  const blockedIds = new Set((overrides.block || []).map(Number));
  const existingManifest = await readJson(path.join(OUT_DIR, 'manifest.json'), { categories: {} });

  const selectedCategories = CATEGORIES.filter((category) => !opts.only || category.slug === opts.only);
  if (!selectedCategories.length) {
    throw new Error(`Unknown --only value. Use one of: ${CATEGORIES.map((c) => c.slug).join(', ')}`);
  }

  const usedIds = new Set();
  const photographerCounts = new Map();

  // Keep IDs used by categories that are not being regenerated.
  for (const [slug, entries] of Object.entries(existingManifest.categories || {})) {
    if (selectedCategories.some((category) => category.slug === slug)) continue;
    for (const entry of entries) {
      if (entry.pexelsId) usedIds.add(Number(entry.pexelsId));
    }
  }

  const selections = new Map();

  for (const category of selectedCategories) {
    console.log(`\nSearching: ${category.name}`);

    const pinned = [];
    for (const id of overrides.pin?.[category.slug] || []) {
      if (blockedIds.has(Number(id))) continue;
      try {
        const photo = await photoById(apiKey, Number(id));
        if (!usedIds.has(photo.id)) {
          pinned.push({ photo, score: 999 });
          usedIds.add(photo.id);
        }
      } catch (error) {
        console.warn(`  ! pinned ${id} skipped: ${error.message}`);
      }
    }

    const pool = await collectPool(apiKey, category, opts.refresh);
    const needed = Math.max(0, 5 - pinned.length);
    const chosen = chooseDiverse(pool, needed, {
      usedIds,
      blockedIds,
      photographerCounts,
    });

    const finalSelection = [...pinned, ...chosen].slice(0, 5);

    if (finalSelection.length < 5) {
      throw new Error(
        `${category.name}: found only ${finalSelection.length}/5 safe candidates. ` +
        `Add good Pexels photo ids to scripts/image-overrides.json -> pin.${category.slug}, then rerun.`,
      );
    }

    selections.set(category.slug, finalSelection);
    for (const entry of finalSelection) {
      console.log(`  ${entry.photo.id}  score=${entry.score.toFixed(1)}  ${entry.photo.photographer}`);
    }
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'Pexels',
    license: 'https://www.pexels.com/license/',
    apiGuidelines: 'https://www.pexels.com/api/documentation/',
    categories: { ...(existingManifest.categories || {}) },
  };

  const imageMap = await readJson(MAP_FILE, {
    generatedAt: null,
    images: {},
  });

  for (const category of selectedCategories) {
    const entries = [];
    const chosen = selections.get(category.slug);

    for (let index = 0; index < 5; index += 1) {
      const selection = chosen[index];
      const photo = selection.photo;
      const productId = category.productIds[index];
      const productName = category.productNames[index];
      const file = `${category.slug}-${index + 1}.jpg`;
      const target = path.join(OUT_DIR, file);

      await download(imageUrl(photo, opts.size), target);

      const entry = {
        productId,
        productName,
        category: category.name,
        file,
        publicPath: `/products/real/${file}`,
        fallbackPath: `/products/generated/${productId}.svg`,
        pexelsId: photo.id,
        pexelsUrl: photo.url,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        alt: photo.alt || `${category.name} product photo`,
        avgColor: photo.avg_color || '#e7e5e4',
        score: selection.score,
      };

      entries.push(entry);
      imageMap.images[String(productId)] = entry;

      console.log(`  + ${file} -> product ${productId}`);
    }

    manifest.categories[category.slug] = entries;
  }

  imageMap.generatedAt = new Date().toISOString();

  await fs.writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  await fs.writeFile(MAP_FILE, JSON.stringify(imageMap, null, 2), 'utf8');

  const reviewFile = await writeReviewSheet(manifest);

  const total = Object.keys(imageMap.images).length;
  console.log(`\nDone. Product image map contains ${total} entries.`);
  console.log(`Manifest: ${path.join(OUT_DIR, 'manifest.json')}`);
  console.log(`Review sheet: ${reviewFile}`);

  if (!opts.only && total < 40) {
    console.warn(`WARNING: image map currently has ${total}/40 products. Run missing categories before migration.`);
  }

  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  });
}
