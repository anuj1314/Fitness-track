import { readFile, writeFile, mkdir, copyFile, rm, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Marked } from 'marked';

const websiteRoot = fileURLToPath(new URL('../', import.meta.url));
const preferred = ['routine', 'diet-plan', 'nutrition'];
const labels = { routine: 'Daily routine', 'diet-plan': 'Diet plan', nutrition: 'Nutrition guide' };
const escapeHtml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export async function discoverGuides(directory) {
  const files = [];
  async function walk(relative = '') {
    const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
    for (const entry of entries) {
      const name = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile() && /\.md$/i.test(entry.name)) files.push(name);
    }
  }
  await walk();
  if (!files.length) throw new Error('No Markdown guides found in content/. Add at least one .md file.');
  const usedIds = new Set();
  const guides = [];
  for (const file of files) {
    const stem = file.replace(/\.md$/i, '');
    const slug = stem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) throw new Error(`Use a filename with letters or numbers: ${file}`);
    const id = `guide-${slug}`;
    if (usedIds.has(id)) throw new Error(`Conflicting guide filename: ${file}. Rename it to produce a unique URL.`);
    usedIds.add(id);
    const markdown = await readFile(path.join(directory, file), 'utf8');
    const heading = new Marked().lexer(markdown).find(token => token.type === 'heading' && token.depth === 1);
    const fallback = path.basename(stem).replace(/[-_]/g, ' ');
    const title = labels[stem] ?? (heading?.text ?? fallback).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '');
    guides.push({ file, id, title, markdown, stem });
  }
  return guides.sort((a, b) => {
    const priority = guide => preferred.includes(guide.stem) ? preferred.indexOf(guide.stem) : preferred.length;
    return priority(a) - priority(b) || a.title.localeCompare(b.title, 'en');
  });
}

export async function buildSite({
  contentDirectory = path.resolve(websiteRoot, '../content'),
  sourceDirectory = path.join(websiteRoot, 'src'),
  outputDirectory = path.join(websiteRoot, 'dist'),
} = {}) {
  const guides = await discoverGuides(contentDirectory);
  const links = new Map(guides.map(guide => [guide.file, `#${guide.id}`]));
  let html = await readFile(path.join(sourceDirectory, 'index.html'), 'utf8');
  for (const marker of ['<!-- GUIDES -->', '<!-- GUIDE_NAV -->', '<!-- GUIDE_COUNT -->']) {
    if (!html.includes(marker)) throw new Error(`Missing template insertion point: ${marker}`);
  }
  // Only remove the generated output directory, never source content.
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(path.join(outputDirectory, 'assets'), { recursive: true });
  const rendered = [];
  for (const [index, guide] of guides.entries()) {
    const renderer = new Marked({ renderer: {
      link({ href, title, tokens }) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(guide.file), href));
        const destination = links.get(resolved) ?? href;
        // Only repository-authored content is published. Reject unsafe link protocols.
        if (!/^(https?:\/\/|#)/i.test(destination)) return this.parser.parseInline(tokens);
        return `<a href="${escapeHtml(destination)}"${title ? ` title="${escapeHtml(title)}"` : ''}>${this.parser.parseInline(tokens)}</a>`;
      }
    } });
    rendered.push(`<article id="${guide.id}" class="guide-content"${index ? ' hidden' : ''}>${renderer.parse(guide.markdown)}</article>`);
    const download = path.join(outputDirectory, 'content', guide.file);
    await mkdir(path.dirname(download), { recursive: true });
    await copyFile(path.join(contentDirectory, guide.file), download);
    // Preserve previously published download URLs for top-level guides.
    if (!guide.file.includes('/')) await copyFile(download, path.join(outputDirectory, guide.file));
  }
  const navigation = guides.map((guide, index) => `<a href="#${guide.id}" class="guide-tab"${index ? '' : ' aria-current="true"'}>${escapeHtml(guide.title)}</a>`).join('');
  html = html.replace('<!-- GUIDES -->', () => rendered.join('\n'))
    .replace('<!-- GUIDE_NAV -->', () => navigation)
    .replace('<!-- GUIDE_COUNT -->', String(guides.length));
  await writeFile(path.join(outputDirectory, 'index.html'), html);
  for (const name of ['styles.css', 'app.mjs', 'calculator.mjs', 'favicon.svg']) {
    await copyFile(path.join(sourceDirectory, name), path.join(outputDirectory, 'assets', name));
  }
  await writeFile(path.join(outputDirectory, '.nojekyll'), '');
  return guides;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const guides = await buildSite();
  console.log(`Built website/dist/ with ${guides.length} automatically discovered Markdown guides.`);
}
