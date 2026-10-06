import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildSite, discoverGuides } from '../scripts/build.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'fitness-content-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const content = path.join(root, 'content');
  await mkdir(content);
  return { root, content };
}

test('new and nested Markdown guides appear automatically, with resolved links', async t => {
  const { root, content } = await fixture(t);
  await mkdir(path.join(content, 'training'));
  await writeFile(path.join(content, 'routine.md'), '# Morning routine\n\n[Workout](training/workout.md)\n');
  await writeFile(path.join(content, 'training/workout.md'), '# Strength & recovery\n\n[Routine](../routine.md)\n\n- Squats\n- Rest\n');
  await writeFile(path.join(content, 'ignore.txt'), 'Not a guide');
  const output = path.join(root, 'dist');
  const guides = await buildSite({ contentDirectory: content, outputDirectory: output });
  assert.equal(guides.length, 2);
  const html = await readFile(path.join(output, 'index.html'), 'utf8');
  assert.match(html, /class="guide-tab">Strength &amp; recovery<\/a>/);
  assert.match(html, /id="guide-training-workout" class="guide-content" hidden/);
  assert.match(html, /href="#guide-training-workout">Workout<\/a>/);
  assert.match(html, /href="#guide-routine">Routine<\/a>/);
  assert.match(html, /<li>Squats<\/li>/);
  assert.match(html, /2 guides/);
  assert.equal(await readFile(path.join(output, 'content/training/workout.md'), 'utf8'), '# Strength & recovery\n\n[Routine](../routine.md)\n\n- Squats\n- Rest\n');
  // Changed and removed files must be reflected on the next build.
  await writeFile(path.join(content, 'routine.md'), '# Updated routine\n\nNew timing.');
  await rm(path.join(content, 'training/workout.md'));
  await buildSite({ contentDirectory: content, outputDirectory: output });
  const rebuilt = await readFile(path.join(output, 'index.html'), 'utf8');
  assert.match(rebuilt, /New timing/);
  assert.doesNotMatch(rebuilt, /Strength &amp; recovery/);
  await assert.rejects(readFile(path.join(output, 'content/training/workout.md')));
});

test('ambiguous filenames fail instead of producing broken guide navigation', async t => {
  const { content } = await fixture(t);
  await writeFile(path.join(content, 'Meal Plan.md'), '# One');
  await writeFile(path.join(content, 'meal-plan.md'), '# Two');
  await assert.rejects(discoverGuides(content), /Conflicting guide filename/);
});

test('guide titles are escaped and unsafe Markdown link protocols are rejected', async t => {
  const { root, content } = await fixture(t);
  await writeFile(path.join(content, 'notes.md'), '# <img src=x onerror=alert(1)>\n\n[Unsafe](javascript:alert)');
  await buildSite({ contentDirectory: content, outputDirectory: path.join(root, 'dist') });
  const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
  assert.match(html, /class="guide-tab" aria-current="true">&lt;img/);
  assert.doesNotMatch(html, /href="javascript:/);
});
