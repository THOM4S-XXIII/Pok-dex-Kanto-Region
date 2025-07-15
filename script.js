// Globale konstanter og hjelpere
const TYPE_COLORS = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};
const API_ROOT = 'https://pokeapi.co/api/v2';
const $ = (q) => document.querySelector(q);
const loader = $('#loader');
const errorMsg = $('#error-msg');
const pokeList = $('#pokemon-list');
const searchInput = $('#search');
const detailsModal = $('#details-modal');
const whosModal = $('#whos-modal');
const randomBtn = $('#random-btn');
let currentPkmn = [];
let cachedTypes = null;
function showLoader(show = true) {
  loader.style.display = show ? 'block' : 'none';
}
function showError(msg = '') {
  errorMsg.textContent = msg;
}
function clearError() {
  errorMsg.textContent = '';
}
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function padId(n) {
  return '#' + String(n).padStart(3, '0');
}
// Henter listen over 151 pokemon (de orginale) fra pokeAPI og oppdaterer hovedgalleriet
async function fetchMons() {
  showError('');
  showLoader(true);
  pokeList.innerHTML = '';
  try {
    const offset = 0;
    const count = 151;
    const url = `${API_ROOT}/pokemon?offset=${offset}&limit=${count}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Could not fetch Pokémon data.');
    const data = await res.json();
    let allMons = data.results.map((p, i) => ({
      name: p.name,
      url: p.url,
      id: offset + i + 1,
    }));
    currentPkmn = allMons;
    renderPokemonGallery(allMons);
  } catch (err) {
    showError('Load error: ' + err.message);
  } finally {
    showLoader(false);
  }
}
// Lager og viser hvert Pokemon kort, basert på listen
function renderPokemonGallery(list) {
  pokeList.innerHTML = list.length
    ? ''
    : '<div style="opacity:.65">No Pokémon found!</div>';
  list.forEach((poke) => {
    pokeList.innerHTML += `
      <div class="poke-card" tabindex="0" data-id="${poke.id}" data-name="${
      poke.name
    }">
        <span class="poke-id">${padId(poke.id)}</span>
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${
          poke.id
        }.png" alt="${poke.name}">
        <div class="poke-card-content">
          <div class="poke-name">${poke.name}</div>
          <div class="type-list" id="card-types-${poke.id}">
            <span style="opacity:.5;">Loading…</span>
          </div>
        </div>
      </div>`;
    fetch(`${API_ROOT}/pokemon/${poke.id}`)
      .then((r) => r.json())
      .then((data) => {
        $(`#card-types-${poke.id}`).innerHTML = data.types
          .map(
            (t) =>
              `<span class="type-chip" style="background:${
                TYPE_COLORS[t.type.name] || '#999'
              }">${cap(t.type.name)}</span>`
          )
          .join(' ');
      });
  });
}
// Who's That Pokémon modal
randomBtn.addEventListener('click', showWhoModal);
let whosCurrent = null;
// Viser modal med tilfeldig Pokemon silhuett
function showWhoModal() {
  const randId = Math.floor(Math.random() * 151) + 1;
  whosCurrent = randId;
  whosModal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="hideWhoModal()">✖</button>
      <div class="whos-hint">Who's that Pokémon?</div>
      <div class="whos-img-bg">
        <img class="whos-silhouette" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${randId}.png" alt="???">
      </div>
      <button class="reveal-btn" id="reveal-btn">Reveal</button>
    </div>
  `;
  whosModal.classList.remove('hidden');
  $('#reveal-btn').onclick = function () {
    hideWhoModal();
    showDetails(randId);
  };
}
window.hideWhoModal = function () {
  whosModal.classList.add('hidden');
};
whosModal.addEventListener('click', (e) => {
  if (e.target === whosModal) hideWhoModal();
});
// Detaljmodal: henter og viser detaljer om valgt Pokemon
async function showDetails(id) {
  showLoader(true);
  try {
    const poke = await fetch(`${API_ROOT}/pokemon/${id}`).then((r) => r.json());
    const [strengths, weaknesses] = await fetchTypeMatchups(
      poke.types.map((t) => t.type.name)
    );
    detailsModal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" onclick="hideDetails()">✖</button>
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${
          poke.id
        }.png" alt="${poke.name}">
        <h2>${cap(poke.name)} <span style="font-size:.85em;color:#aaa">${padId(
      poke.id
    )}</span></h2>
        <div class="type-list">
          ${poke.types
            .map(
              (t) =>
                `<span class="type-chip" style="background:${
                  TYPE_COLORS[t.type.name] || '#999'
                }">${cap(t.type.name)}</span>`
            )
            .join(' ')}
        </div>
        <div class="stat-table">
          ${poke.stats
            .map(
              (s) => `
            <span class="stat-cell">
              ${cap(s.stat.name)}: ${s.base_stat}
              <div class="stats-bar"><div class="stats-bar-fill" style="width:${
                Math.min(s.base_stat, 120) * 0.8 + 15
              }px"></div></div>
            </span>
          `
            )
            .join('')}
        </div>
        <div class="type-matchup-row">
          <div><b>Effective against:</b> ${
            strengths.length
              ? strengths
                  .map(
                    (type) =>
                      `<span class="type-chip" style="background:${
                        TYPE_COLORS[type] || '#789'
                      }">${cap(type)}</span>`
                  )
                  .join(' ')
              : 'None'
          }</div>
          <div><b>Weak to:</b> ${
            weaknesses.length
              ? weaknesses
                  .map(
                    (type) =>
                      `<span class="type-chip" style="background:${
                        TYPE_COLORS[type] || '#789'
                      }">${cap(type)}</span>`
                  )
                  .join(' ')
              : 'None'
          }</div>
        </div>
      </div>
    `;
    detailsModal.classList.remove('hidden');
  } finally {
    showLoader(false);
  }
}
window.hideDetails = function () {
  detailsModal.classList.add('hidden');
};
detailsModal.addEventListener('click', (e) => {
  if (e.target === detailsModal) hideDetails();
});
// Henter styrker/svakheter fra API basert på type
async function fetchTypeMatchups(typeNames) {
  if (!cachedTypes) {
    const res = await fetch(`${API_ROOT}/type`);
    const data = await res.json();
    cachedTypes = await Promise.all(
      data.results.map((t) => fetch(t.url).then((r) => r.json()))
    );
  }
  let strengths = new Set();
  let weaknesses = new Set();
  for (const t of cachedTypes) {
    if (typeNames.includes(t.name)) {
      t.damage_relations.double_damage_to.forEach((x) => strengths.add(x.name));
      t.damage_relations.double_damage_from.forEach((x) =>
        weaknesses.add(x.name)
      );
    }
  }
  strengths = [...strengths].filter((x) => !typeNames.includes(x));
  weaknesses = [...weaknesses].filter((x) => !typeNames.includes(x));
  return [strengths, weaknesses];
}
searchInput.addEventListener('input', (e) => {
  const search = searchInput.value.trim().toLowerCase();
  if (!search) {
    renderPokemonGallery(currentPkmn);
  } else {
    renderPokemonGallery(
      currentPkmn.filter(
        (p) => p.name.includes(search) || padId(p.id).includes(search)
      )
    );
  }
});
pokeList.addEventListener('click', (e) => {
  let card = e.target.closest('.poke-card');
  if (card) showDetails(card.dataset.id);
});
pokeList.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    let card = e.target.closest('.poke-card');
    if (card) showDetails(card.dataset.id);
  }
});
// INIT(initialisering)
(async function () {
  document.head.innerHTML +=
    '<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&amp;family=VT323&amp;display=swap" rel="stylesheet">';
  await fetchMons();
})();
// Legger til en knapp for å scrolle til toppen
const scrollTopBtn = document.getElementById('scroll-top-btn');
window.addEventListener('scroll', () => {
  scrollTopBtn.style.display = window.scrollY > 250 ? 'block' : 'none';
});
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
