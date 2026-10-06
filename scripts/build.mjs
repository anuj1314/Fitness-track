import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = fileURLToPath(new URL('../', import.meta.url));
const guides = ['routine', 'diet-plan', 'nutrition'];
const guideLinks = new Map(guides.map(name => [`${name}.md`, `#guide-${name}`]));
marked.use({ renderer: {
  link({ href, title, tokens }) {
    const destination = guideLinks.get(href) ?? href;
    // Repository-authored Markdown only. Reject unsafe link protocols.
    if (!/^(https?:\/\/|#|[\w-]+\.md$)/i.test(destination)) return this.parser.parseInline(tokens);
    const escaped = destination.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    return `<a href="${escaped}"${title ? ` title="${title.replaceAll('"', '&quot;')}"` : ''}>${this.parser.parseInline(tokens)}</a>`;
  }
}});
await rm(`${root}dist`, { recursive: true, force: true });
await mkdir(`${root}dist/assets`, { recursive: true });
const rendered = [];
for (const name of guides) {
  const markdown = await readFile(`${root}${name}.md`, 'utf8');
  rendered.push(`<article id="guide-${name}" class="guide-content" ${name !== 'routine' ? 'hidden' : ''}>${marked.parse(markdown)}</article>`);
  await copyFile(`${root}${name}.md`, `${root}dist/${name}.md`);
}
let html = await readFile(`${root}site/index.html`, 'utf8');
if (!html.includes('<!-- GUIDES -->')) throw new Error('Missing Markdown insertion point');
html = html.replace('<!-- GUIDES -->', rendered.join('\n'));
await writeFile(`${root}dist/index.html`, html);
for (const name of ['styles.css', 'app.mjs', 'calculator.mjs', 'favicon.svg']) {
  await copyFile(`${root}site/${name}`, `${root}dist/assets/${name}`);
}
await writeFile(`${root}dist/.nojekyll`, '');
console.log('Built dist/: website and all three Markdown guides.');
