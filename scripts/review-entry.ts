#!/usr/bin/env bun
/**
 * Database Entry Review Script
 * Helps maintainers review and update old entries by:
 * 1. Finding the oldest entries based on git history
 * 2. Opening browser windows to the entry and its URLs
 * 3. Opening VS Code to the YAML file
 * 4. Serving a local page with image download functionality
 * 5. Handling commit and restart
 */

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { basename, dirname, resolve } from 'path';
import * as readline from 'readline';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

// Import shared utilities from the app
import { getDatabasePath, getGitTimestamps } from '../app/lib/data';
import { CATEGORIES } from '../app/lib/types';
// Shared image processing (single source of truth; fixes the raw-buffer bug).
import { processImage } from './crop-image';

const DATABASE_PATH = getDatabasePath();
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

interface Entry {
  id: string;
  category: string;
  filePath: string;
  name: string;
  url?: string;
  urls: string[];
  updated: Date | null;
  data: Record<string, unknown>;
}

function log(color: keyof typeof colors, ...args: unknown[]) {
  console.log(colors[color], ...args, colors.reset);
}

/**
 * Extract all URLs from an entry
 */
function extractUrls(data: Record<string, unknown>): string[] {
  const urls: string[] = [];

  function extract(obj: unknown) {
    if (typeof obj === 'string') {
      // Check if it looks like a URL
      if (obj.match(/^https?:\/\//)) {
        urls.push(obj);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(extract);
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(extract);
    }
  }

  extract(data);
  return [...new Set(urls)]; // Deduplicate
}

/**
 * Load all entries with their timestamps
 */
function loadAllEntries(): Entry[] {
  const entries: Entry[] = [];
  const timestamps = getGitTimestamps();

  for (const category of CATEGORY_IDS) {
    const categoryPath = resolve(DATABASE_PATH, category);
    if (!existsSync(categoryPath)) continue;

    const files = readdirSync(categoryPath).filter(
      (f) => f.endsWith('.yaml') && !f.startsWith('_')
    );

    for (const file of files) {
      const filePath = resolve(categoryPath, file);
      const id = basename(file, '.yaml');

      try {
        const content = readFileSync(filePath, 'utf-8');
        const data = parseYaml(content) as Record<string, unknown>;

        entries.push({
          id,
          category,
          filePath,
          name: (data.name as string) || id,
          url: data.url as string | undefined,
          urls: extractUrls(data),
          // getGitTimestamps() returns full paths as keys
          updated: timestamps.get(filePath) || null,
          data,
        });
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
      }
    }
  }

  return entries;
}

/**
 * Pick a random entry from the oldest N entries
 */
function pickRandomOldest(entries: Entry[], poolSize: number = 10): Entry {
  // Sort by updated date (oldest first, null dates first)
  const sorted = [...entries].sort((a, b) => {
    if (!a.updated && !b.updated) return 0;
    if (!a.updated) return -1;
    if (!b.updated) return 1;
    return a.updated.getTime() - b.updated.getTime();
  });

  // Pick random from oldest pool
  const pool = sorted.slice(0, Math.min(poolSize, sorted.length));
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Open a URL in the default browser
 */
function openBrowser(url: string) {
  const platform = process.platform;
  const cmd = platform === 'win32' ? 'start' : platform === 'darwin' ? 'open' : 'xdg-open';

  try {
    if (platform === 'win32') {
      execSync(`start "" "${url}"`, { shell: 'cmd.exe' });
    } else {
      execSync(`${cmd} "${url}"`);
    }
  } catch (error) {
    console.error(`Failed to open ${url}:`, error);
  }
}

/**
 * Open a file in VS Code
 */
function openInVSCode(filePath: string) {
  try {
    execSync(`code "${filePath}"`);
  } catch (error) {
    console.error(`Failed to open ${filePath} in VS Code:`, error);
  }
}

/**
 * Generate the image picker HTML page
 */
function generateImagePickerHtml(entry: Entry, serverPort: number): string {
  const bookmarkletCode = `
(function() {
  // Toggle: if already active, remove and exit
  if (window.__imgPickerActive) {
    document.querySelectorAll('.__imgPickerBtn, #__imgPickerOverlay, #__imgPickerCloseBtn').forEach(el => el.remove());
    document.querySelectorAll('.__imgPickerHighlight').forEach(el => el.classList.remove('__imgPickerHighlight'));
    const style = document.getElementById('__imgPickerStyle');
    if (style) style.remove();
    window.__imgPickerActive = false;
    return;
  }
  window.__imgPickerActive = true;

  const overlay = document.createElement('div');
  overlay.id = '__imgPickerOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);z-index:999999;pointer-events:none;';
  document.body.appendChild(overlay);

  const style = document.createElement('style');
  style.id = '__imgPickerStyle';
  style.textContent = \`
    .__imgPickerBtn {
      position: absolute;
      background: #22c55e;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      z-index: 1000000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      pointer-events: auto;
    }
    .__imgPickerBtn:hover { background: #16a34a; }
    .__imgPickerHighlight { outline: 3px solid #22c55e !important; outline-offset: 2px; }
  \`;
  document.head.appendChild(style);

  const imgs = document.querySelectorAll('img');
  imgs.forEach((img, i) => {
    if (img.width < 50 || img.height < 50) return;

    const rect = img.getBoundingClientRect();
    const btn = document.createElement('button');
    btn.className = '__imgPickerBtn';
    btn.textContent = '⬇ Download';
    btn.style.top = (rect.top + window.scrollY + 5) + 'px';
    btn.style.left = (rect.left + window.scrollX + 5) + 'px';

    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.textContent = '⏳ Saving...';
      btn.disabled = true;

      try {
        const res = await fetch('http://localhost:${serverPort}/download-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: img.src })
        });
        const data = await res.json();
        if (data.success) {
          btn.textContent = '✓ Saved!';
          btn.style.background = '#3b82f6';
        } else {
          btn.textContent = '✗ Error';
          btn.style.background = '#ef4444';
        }
      } catch (err) {
        btn.textContent = '✗ Failed';
        btn.style.background = '#ef4444';
      }
    };

    img.classList.add('__imgPickerHighlight');
    document.body.appendChild(btn);
  });

  const closeBtn = document.createElement('button');
  closeBtn.id = '__imgPickerCloseBtn';
  closeBtn.textContent = '✕ Close Image Picker';
  closeBtn.style.cssText = 'position:fixed;top:10px;right:10px;background:#ef4444;color:white;border:none;border-radius:4px;padding:8px 16px;font-size:14px;cursor:pointer;z-index:1000001;';
  closeBtn.onclick = () => {
    document.querySelectorAll('.__imgPickerBtn, #__imgPickerOverlay').forEach(el => el.remove());
    document.querySelectorAll('.__imgPickerHighlight').forEach(el => el.classList.remove('__imgPickerHighlight'));
    style.remove();
    closeBtn.remove();
    window.__imgPickerActive = false;
  };
  document.body.appendChild(closeBtn);
})();
  `
    .trim()
    .replace(/\s+/g, ' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Review: ${entry.name}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
      background: #1a1a2e;
      color: #eee;
      min-height: 100vh;
    }
    h1 { color: #22c55e; margin-bottom: 5px; }
    .meta { color: #888; margin-bottom: 20px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #3b82f6; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .url-list { list-style: none; padding: 0; }
    .url-list li { margin: 10px 0; }
    .url-list a {
      color: #60a5fa;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .url-list a:hover { text-decoration: underline; }
    .bookmarklet {
      display: inline-block;
      background: #22c55e;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      cursor: grab;
      margin: 10px 0;
    }
    .bookmarklet:hover { background: #16a34a; }
    .instructions {
      background: #2a2a3e;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .instructions ol { margin: 10px 0; padding-left: 20px; }
    .instructions li { margin: 8px 0; }
    code {
      background: #333;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', monospace;
    }
    .status { padding: 10px; background: #2a2a3e; border-radius: 8px; margin-top: 20px; }
    .images { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .images img { max-width: 150px; max-height: 150px; object-fit: cover; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>📝 ${entry.name}</h1>
  <div class="meta">
    Category: <strong>${entry.category}</strong> |
    Last updated: <strong>${entry.updated ? entry.updated.toISOString().split('T')[0] : 'Never'}</strong>
  </div>

  <div class="section">
    <h2>🔗 URLs to Review</h2>
    <ul class="url-list">
      <li>
        <a href="http://localhost:5173/${entry.category}/${entry.id}" target="_blank">
          🏠 Entry on Dev Server
        </a>
      </li>
      ${entry.urls
        .map(
          (url) => `
      <li>
        <a href="${url}" target="_blank">
          🌐 ${url.length > 60 ? url.substring(0, 60) + '...' : url}
        </a>
      </li>
      `
        )
        .join('')}
    </ul>
  </div>

  <div class="section">
    <h2>📸 Image Picker</h2>
    <div class="instructions">
      <p><strong>To add images to this entry:</strong></p>
      <ol>
        <li>Drag this button to your bookmarks bar:
          <a class="bookmarklet" href="javascript:${encodeURIComponent(bookmarkletCode)}">📷 Pick Images</a>
        </li>
        <li>Open any of the URLs above in a new tab</li>
        <li>Click the bookmarklet in your bookmarks bar</li>
        <li>Click the green "⬇ Download" button on any image you want</li>
        <li>The image will be saved automatically to the entry</li>
      </ol>
    </div>
    <div class="status" id="imageStatus">
      <strong>Downloaded Images:</strong>
      <div class="images" id="downloadedImages"></div>
    </div>
  </div>

  <div class="section">
    <h2>📁 Files</h2>
    <p>YAML file: <code>${entry.filePath}</code></p>
  </div>

  <script>
    // Poll for downloaded images
    async function refreshImages() {
      try {
        const res = await fetch('/downloaded-images');
        const data = await res.json();
        const container = document.getElementById('downloadedImages');
        if (data.images.length === 0) {
          container.innerHTML = '<em style="color:#888">No images downloaded yet</em>';
        } else {
          container.innerHTML = data.images.map(img =>
            '<img src="/images/' + img + '" alt="' + img + '" title="' + img + '">'
          ).join('');
        }
      } catch (e) {}
    }
    refreshImages();
    setInterval(refreshImages, 2000);
  </script>
</body>
</html>`;
}

/**
 * Download an image from a URL
 */
async function downloadImage(
  url: string,
  entry: Entry
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    // Create images directory if it doesn't exist
    const imagesDir = resolve(dirname(entry.filePath), 'images');
    if (!existsSync(imagesDir)) {
      mkdirSync(imagesDir, { recursive: true });
    }

    // Fetch the image
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    const isSvg = contentType.includes('svg');
    const isGif = contentType.includes('gif');

    // Use entry ID as base filename
    const baseFilename = entry.id;

    // Fetch and process
    const buffer = Buffer.from(await response.arrayBuffer());

    let finalBuffer: Buffer;
    let filename: string;

    if (isSvg) {
      // Keep SVGs as-is
      finalBuffer = buffer;
      filename = `${baseFilename}.svg`;
    } else if (isGif) {
      // Keep GIFs as-is (may be animated)
      finalBuffer = buffer;
      filename = `${baseFilename}.gif`;
    } else {
      // Process raster images: remove background and crop
      log('dim', `    Processing image (removing background, cropping)...`);
      finalBuffer = await processImage(buffer);
      filename = `${baseFilename}.png`; // Always output as PNG for transparency
    }

    // Ensure unique filename
    let finalPath = resolve(imagesDir, filename);
    let counter = 1;
    while (existsSync(finalPath)) {
      const ext = filename.split('.').pop();
      const base = filename.replace(`.${ext}`, '');
      filename = `${base}-${counter}.${ext}`;
      finalPath = resolve(imagesDir, filename);
      counter++;
    }

    writeFileSync(finalPath, finalBuffer);

    // Update the YAML file with the image
    updateEntryImage(entry, filename);

    return { success: true, filename };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Update the entry's YAML file with a new image
 */
function updateEntryImage(entry: Entry, filename: string) {
  try {
    const content = readFileSync(entry.filePath, 'utf-8');
    const data = parseYaml(content) as Record<string, unknown>;

    // Add to images array if it exists, otherwise set as primary image
    if (Array.isArray(data.images)) {
      if (!data.images.includes(filename)) {
        data.images.push(filename);
      }
    } else if (data.image) {
      // Already has a primary image, create images array
      data.images = [data.image as string, filename];
    } else {
      // Set as primary image
      data.image = filename;
    }

    writeFileSync(entry.filePath, stringifyYaml(data, { lineWidth: 0 }));
    log('green', `  ✓ Updated ${entry.id}.yaml with image: ${filename}`);
  } catch (error) {
    console.error('Error updating YAML:', error);
  }
}

/**
 * Create and start the local server for image downloads
 */
function startServer(entry: Entry, port: number): Promise<ReturnType<typeof createServer>> {
  const downloadedImages: string[] = [];
  const imagesDir = resolve(dirname(entry.filePath), 'images');

  return new Promise((resolvePromise) => {
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = req.url || '/';

      // Serve the main page
      if (url === '/' || url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(generateImagePickerHtml(entry, port));
        return;
      }

      // Serve downloaded images
      if (url.startsWith('/images/')) {
        const filename = basename(url);
        const filePath = resolve(imagesDir, filename);
        if (existsSync(filePath)) {
          const ext = filename.split('.').pop()?.toLowerCase();
          const contentType =
            ext === 'png'
              ? 'image/png'
              : ext === 'gif'
                ? 'image/gif'
                : ext === 'webp'
                  ? 'image/webp'
                  : ext === 'svg'
                    ? 'image/svg+xml'
                    : 'image/jpeg';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(readFileSync(filePath));
          return;
        }
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      // List downloaded images
      if (url === '/downloaded-images') {
        let images: string[] = [];
        if (existsSync(imagesDir)) {
          images = readdirSync(imagesDir).filter((f) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ images }));
        return;
      }

      // Download image endpoint
      if (url === '/download-image' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const { url: imageUrl } = JSON.parse(body);
            log('cyan', `  📥 Downloading: ${imageUrl.substring(0, 60)}...`);
            const result = await downloadImage(imageUrl, entry);

            if (result.success && result.filename) {
              downloadedImages.push(result.filename);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: String(error) }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.listen(port, () => {
      resolvePromise(server);
    });
  });
}

/**
 * Prompt user for commit message and commit
 */
async function promptAndCommit(entry: Entry): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolvePromise) => {
    console.log('');
    log('yellow', '═'.repeat(60));
    log('yellow', '  Ready to commit?');
    log('yellow', '═'.repeat(60));
    console.log('');
    console.log('  Type your commit message and press Enter to commit.');
    console.log("  Or type 'skip' to skip this entry.");
    console.log('  Or press Ctrl+C to exit completely.');
    console.log('');

    rl.question('  Commit message: ', (message) => {
      rl.close();

      if (!message || message.toLowerCase() === 'skip') {
        log('yellow', '  Skipped.');
        resolvePromise(false);
        return;
      }

      try {
        // Stage the entry file and any images
        const imagesDir = resolve(dirname(entry.filePath), 'images');
        execSync(`git add "${entry.filePath}"`, { cwd: DATABASE_PATH });
        if (existsSync(imagesDir)) {
          execSync(`git add "${imagesDir}"`, { cwd: DATABASE_PATH });
        }

        // Commit
        execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
          cwd: DATABASE_PATH,
          stdio: 'inherit',
        });

        log('green', '  ✓ Committed successfully!');
        resolvePromise(true);
      } catch (error) {
        log('red', '  ✗ Commit failed:', error);
        resolvePromise(false);
      }
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.clear();
  log('bright', '');
  log('bright', '  ╔════════════════════════════════════════════════════════╗');
  log('bright', '  ║        📋 Database Entry Review Tool                   ║');
  log('bright', '  ╚════════════════════════════════════════════════════════╝');
  console.log('');

  // Load entries and sort by age
  log('cyan', '  Loading entries...');
  const entries = loadAllEntries();
  log('green', `  ✓ Found ${entries.length} entries across ${CATEGORY_IDS.length} categories`);
  console.log('');

  // Show oldest entries
  const sorted = [...entries].sort((a, b) => {
    if (!a.updated && !b.updated) return 0;
    if (!a.updated) return -1;
    if (!b.updated) return 1;
    return a.updated.getTime() - b.updated.getTime();
  });

  log('yellow', '  📅 Oldest 10 entries:');
  sorted.slice(0, 10).forEach((e, i) => {
    const date = e.updated ? e.updated.toISOString().split('T')[0] : 'Never';
    console.log(`     ${i + 1}. [${date}] ${e.category}/${e.id}`);
  });
  console.log('');

  // Pick random from oldest
  const entry = pickRandomOldest(entries);
  log('magenta', `  🎲 Selected: ${entry.category}/${entry.id}`);
  log('dim', `     Name: ${entry.name}`);
  log('dim', `     URLs: ${entry.urls.length} found`);
  console.log('');

  // Start local server
  const serverPort = 3456;
  log('cyan', `  Starting image picker server on port ${serverPort}...`);
  const server = await startServer(entry, serverPort);
  log('green', `  ✓ Server running at http://localhost:${serverPort}`);
  console.log('');

  // Open VS Code
  log('cyan', '  Opening YAML file in VS Code...');
  openInVSCode(entry.filePath);

  // Open browsers
  log('cyan', '  Opening browser windows...');

  // Small delay between browser opens to avoid issues
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Open local review page first
  openBrowser(`http://localhost:${serverPort}`);
  await delay(500);

  // Open dev server entry page
  openBrowser(`http://localhost:5173/${entry.category}/${entry.id}`);
  await delay(500);

  // Open external URLs
  for (const url of entry.urls) {
    openBrowser(url);
    await delay(300);
  }

  log('green', `  ✓ Opened ${entry.urls.length + 2} browser tabs`);
  console.log('');

  log('bright', '  ════════════════════════════════════════════════════════');
  log('bright', '  Review the entry and add images using the image picker.');
  log('bright', '  When done, return here to commit your changes.');
  log('bright', '  ════════════════════════════════════════════════════════');

  // Wait for commit
  const committed = await promptAndCommit(entry);

  // Cleanup
  server.close();

  if (committed) {
    console.log('');
    log('cyan', '  Restarting for next entry...');
    console.log('');

    // Restart this script
    const child = spawn(process.argv[0], [process.argv[1]], {
      stdio: 'inherit',
      detached: false,
    });

    child.on('error', (err) => {
      log('red', '  Failed to restart:', err);
      process.exit(1);
    });
  } else {
    console.log('');
    log('yellow', "  Done! Run 'bun run review' to continue later.");
    console.log('');
  }
}

main().catch(console.error);
