export function calculateMacros(calories, protein, fat) {
  if (![calories, protein, fat].every(Number.isFinite) || calories <= 0 || protein < 0 || fat < 0) {
    throw new RangeError('Enter valid calorie and macro amounts.');
  }
  const proteinCalories = protein * 4;
  const fatCalories = fat * 9;
  const carbCalories = calories - proteinCalories - fatCalories;
  if (carbCalories < 0) throw new RangeError('Protein and fat exceed your calorie target.');
  return {
    carbs: carbCalories / 4,
    proteinPercent: proteinCalories / calories * 100,
    fatPercent: fatCalories / calories * 100,
    carbPercent: carbCalories / calories * 100,
  };
}
