import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMacros } from '../site/calculator.mjs';

test('current 2,900 kcal plan allocates 385 g carbohydrates', () => {
  const result = calculateMacros(2900, 160, 80);
  assert.equal(result.carbs, 385);
  assert.ok(Math.abs(result.proteinPercent + result.fatPercent + result.carbPercent - 100) < 1e-10);
});
test('original 3,000 kcal example allocates 410 g carbohydrates', () => {
  assert.equal(calculateMacros(3000, 160, 80).carbs, 410);
});
test('changing protein preserves the calorie budget', () => {
  assert.equal(calculateMacros(2900, 170, 80).carbs, 375);
});
test('impossible budgets and invalid numbers are rejected', () => {
  for (const values of [[500,160,80], [NaN,160,80], [2900,-1,80], [0,160,80]]) {
    assert.throws(() => calculateMacros(...values), RangeError);
  }
});
