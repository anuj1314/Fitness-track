import { calculateMacros } from './calculator.mjs';

const form = document.querySelector('#macro-form');
const calories = document.querySelector('#calories');
const protein = document.querySelector('#protein');
const fat = document.querySelector('#fat');
const error = document.querySelector('#macro-error');

function updateMacros() {
  document.querySelector('#calories-value').textContent = `${Number(calories.value).toLocaleString('en-IN')} kcal`;
  if (!form.checkValidity()) {
    error.textContent = 'Enter protein between 80–220 g and fat between 40–120 g.';
    error.hidden = false;
    document.querySelector('#carbs-value').textContent = '—';
    document.querySelector('#macro-summary').textContent = 'Enter valid amounts to calculate your macro mix.';
    document.querySelector('.macro-bar').hidden = true;
    return;
  }
  try {
    const result = calculateMacros(Number(calories.value), Number(protein.value), Number(fat.value));
    const carbs = Math.round(result.carbs);
    document.querySelector('#carbs-value').textContent = carbs;
    for (const name of ['protein', 'fat', 'carb']) {
      document.querySelector(`#${name}-bar`).style.width = `${result[`${name}Percent`]}%`;
    }
    document.querySelector('.macro-bar').hidden = false;
    document.querySelector('#macro-summary').textContent = `${Number(calories.value).toLocaleString('en-IN')} kcal: ${protein.value} g protein, ${fat.value} g fat, ${carbs} g carbs (rounded).`;
    error.hidden = true;
  } catch (issue) {
    error.textContent = issue.message;
    error.hidden = false;
    document.querySelector('#carbs-value').textContent = '—';
    document.querySelector('.macro-bar').hidden = true;
    document.querySelector('#macro-summary').textContent = 'Reduce protein or fat, or increase calories.';
  }
}
form.addEventListener('input', updateMacros);
form.addEventListener('submit', event => event.preventDefault());
document.querySelector('#reset-macros').addEventListener('click', () => { form.reset(); updateMacros(); });
updateMacros();

function selectGuide() {
  const articles = [...document.querySelectorAll('.guide-content')];
  const id = location.hash.slice(1);
  if (!articles.some(article => article.id === id)) return;
  for (const article of articles) {
    article.hidden = article.id !== id;
    const tab = [...document.querySelectorAll('.guide-tab')].find(link => link.hash === `#${article.id}`);
    if (article.id === id) tab.setAttribute('aria-current', 'true');
    else tab.removeAttribute('aria-current');
  }
  requestAnimationFrame(() => document.querySelector('#guides').scrollIntoView({ block: 'start' }));
}
window.addEventListener('hashchange', selectGuide);
selectGuide();
document.querySelector('#guide-search').addEventListener('input', event => {
  const query = event.target.value.trim().toLocaleLowerCase();
  let matches = 0;
  for (const tab of document.querySelectorAll('.guide-tab')) {
    tab.hidden = !tab.textContent.toLocaleLowerCase().includes(query);
    if (!tab.hidden) matches++;
  }
  document.querySelector('#guide-search-result').textContent = matches ? '' : 'No guides match that title. Try another search.';
});
document.querySelector('#print-guide').addEventListener('click', () => window.print());

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of document.querySelectorAll('nav a')) {
        const active = link.hash === `#${entry.target.id}`;
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-15% 0px -65% 0px' });
  for (const section of document.querySelectorAll('main section[id]')) observer.observe(section);
}
