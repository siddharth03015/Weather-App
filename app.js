/* ==========================================================================
   WEATHER NOW — Complete Application Logic (All Features)
   ========================================================================== */

// ============================================================
// 1. CONSTANTS & CONFIGURATION
// ============================================================

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL   = 'https://api.open-meteo.com/v1/forecast';

const WMO_CODES = {
  0:  { icon: 'icon-sunny.webp',         desc: 'Clear sky',              bg: 'sunny' },
  1:  { icon: 'icon-sunny.webp',         desc: 'Mainly clear',           bg: 'sunny' },
  2:  { icon: 'icon-partly-cloudy.webp', desc: 'Partly cloudy',          bg: 'cloudy' },
  3:  { icon: 'icon-overcast.webp',      desc: 'Overcast',               bg: 'cloudy' },
  45: { icon: 'icon-fog.webp',           desc: 'Fog',                    bg: 'cloudy' },
  48: { icon: 'icon-fog.webp',           desc: 'Depositing rime fog',    bg: 'cloudy' },
  51: { icon: 'icon-drizzle.webp',       desc: 'Light drizzle',          bg: 'rain' },
  53: { icon: 'icon-drizzle.webp',       desc: 'Moderate drizzle',       bg: 'rain' },
  55: { icon: 'icon-drizzle.webp',       desc: 'Dense drizzle',          bg: 'rain' },
  56: { icon: 'icon-drizzle.webp',       desc: 'Freezing drizzle',       bg: 'rain' },
  57: { icon: 'icon-drizzle.webp',       desc: 'Dense freezing drizzle', bg: 'rain' },
  61: { icon: 'icon-rain.webp',          desc: 'Slight rain',            bg: 'rain' },
  63: { icon: 'icon-rain.webp',          desc: 'Moderate rain',          bg: 'rain' },
  65: { icon: 'icon-rain.webp',          desc: 'Heavy rain',             bg: 'rain' },
  66: { icon: 'icon-rain.webp',          desc: 'Freezing rain',          bg: 'rain' },
  67: { icon: 'icon-rain.webp',          desc: 'Heavy freezing rain',    bg: 'rain' },
  71: { icon: 'icon-snow.webp',          desc: 'Slight snow',            bg: 'snow' },
  73: { icon: 'icon-snow.webp',          desc: 'Moderate snow',          bg: 'snow' },
  75: { icon: 'icon-snow.webp',          desc: 'Heavy snow',             bg: 'snow' },
  77: { icon: 'icon-snow.webp',          desc: 'Snow grains',            bg: 'snow' },
  80: { icon: 'icon-rain.webp',          desc: 'Rain showers',           bg: 'rain' },
  81: { icon: 'icon-rain.webp',          desc: 'Moderate rain showers',  bg: 'rain' },
  82: { icon: 'icon-rain.webp',          desc: 'Violent rain showers',   bg: 'rain' },
  85: { icon: 'icon-snow.webp',          desc: 'Snow showers',           bg: 'snow' },
  86: { icon: 'icon-snow.webp',          desc: 'Heavy snow showers',     bg: 'snow' },
  95: { icon: 'icon-storm.webp',         desc: 'Thunderstorm',           bg: 'rain' },
  96: { icon: 'icon-storm.webp',         desc: 'Thunderstorm with hail', bg: 'rain' },
  99: { icon: 'icon-storm.webp',         desc: 'Thunderstorm with heavy hail', bg: 'rain' },
};

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES     = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================
// 2. APPLICATION STATE
// ============================================================

const state = {
  location: { name: '', country: '', lat: 0, lon: 0 },
  weatherData: null,
  units: {
    temperature: 'celsius',
    windSpeed: 'kmh',
    precipitation: 'mm',
  },
  selectedHourlyDay: 0,
  favorites: JSON.parse(localStorage.getItem('weatherFavorites') || '[]'),
  compareLocations: [],
  theme: localStorage.getItem('weatherTheme') || 'auto',
};

// ============================================================
// 3. DOM REFERENCES
// ============================================================

const DOM = {
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  searchButton: document.getElementById('search-button'),
  searchSuggestions: document.getElementById('search-suggestions'),
  voiceSearchBtn: document.getElementById('voice-search-btn'),

  unitsDropdown: document.getElementById('units-dropdown'),
  unitsToggle: document.getElementById('units-toggle'),
  unitsPanel: document.getElementById('units-panel'),
  unitsSwitch: document.getElementById('units-switch'),

  themeToggle: document.getElementById('theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),

  favoritesBtn: document.getElementById('favorites-btn'),
  favoritesPanel: document.getElementById('favorites-panel'),
  favoritesClose: document.getElementById('favorites-close'),
  favoritesList: document.getElementById('favorites-list'),
  favoritesEmpty: document.getElementById('favorites-empty'),
  favToggle: document.getElementById('fav-toggle'),

  compareToggle: document.getElementById('compare-toggle'),
  compareSection: document.getElementById('compare-section'),
  compareClose: document.getElementById('compare-close'),
  compareGrid: document.getElementById('compare-grid'),

  loadingState: document.getElementById('loading-state'),
  errorState: document.getElementById('error-state'),
  noResultsState: document.getElementById('no-results-state'),
  weatherContent: document.getElementById('weather-content'),
  retryButton: document.getElementById('retry-button'),

  locationName: document.getElementById('location-name'),
  currentDate: document.getElementById('current-date'),
  currentIcon: document.getElementById('current-icon'),
  currentTemp: document.getElementById('current-temp'),
  feelsLike: document.getElementById('feels-like'),
  humidity: document.getElementById('humidity'),
  wind: document.getElementById('wind'),
  precipitation: document.getElementById('precipitation'),
  uvIndex: document.getElementById('uv-index'),
  visibility: document.getElementById('visibility'),
  pressure: document.getElementById('pressure'),
  dailyGrid: document.getElementById('daily-grid'),
  hourlyDaySelect: document.getElementById('hourly-day-select'),
  hourlyList: document.getElementById('hourly-list'),

  sunriseTime: document.getElementById('sunrise-time'),
  sunsetTime: document.getElementById('sunset-time'),
  sunProgress: document.getElementById('sun-progress'),
  sunDot: document.getElementById('sun-dot'),

  weatherBg: document.getElementById('weather-bg'),
  weatherParticles: document.getElementById('weather-particles'),
};

// ============================================================
// 4. API FUNCTIONS
// ============================================================

async function searchLocations(query) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Geocoding API error: ${response.status}`);
  const data = await response.json();
  return data.results || [];
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'weather_code', 'wind_speed_10m', 'precipitation',
      'uv_index', 'visibility', 'surface_pressure'
    ].join(','),
    hourly: ['temperature_2m', 'weather_code'].join(','),
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'sunrise', 'sunset', 'uv_index_max'
    ].join(','),
    temperature_unit: state.units.temperature,
    wind_speed_unit: state.units.windSpeed,
    precipitation_unit: state.units.precipitation,
    timezone: 'auto',
    forecast_days: 7,
  });
  const url = `${WEATHER_URL}?${params}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  return response.json();
}

// ============================================================
// 5. UI STATE MANAGEMENT
// ============================================================

function showAppState(stateName) {
  DOM.loadingState.hidden   = stateName !== 'loading';
  DOM.errorState.hidden     = stateName !== 'error';
  DOM.noResultsState.hidden = stateName !== 'no-results';
  DOM.weatherContent.hidden = stateName !== 'weather';
}

// ============================================================
// 6. RENDER FUNCTIONS
// ============================================================

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_NAMES_FULL[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getWeatherIcon(code) {
  const entry = WMO_CODES[code] || WMO_CODES[3];
  return `./assets/images/${entry.icon}`;
}

function getWeatherDesc(code) {
  return (WMO_CODES[code] || WMO_CODES[3]).desc;
}

function getWeatherBgType(code) {
  return (WMO_CODES[code] || WMO_CODES[3]).bg;
}

function windUnit() { return state.units.windSpeed === 'kmh' ? 'km/h' : 'mph'; }
function precipUnit() { return state.units.precipitation === 'mm' ? 'mm' : 'in'; }

function formatTime12h(isoString) {
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

function renderWeather() {
  const data = state.weatherData;
  if (!data) return;

  // Current Weather
  DOM.locationName.textContent = `${state.location.name}${state.location.country ? ', ' + state.location.country : ''}`;
  DOM.currentDate.textContent  = formatDate(data.daily.time[0]);
  DOM.currentIcon.src          = getWeatherIcon(data.current.weather_code);
  DOM.currentIcon.alt          = getWeatherDesc(data.current.weather_code);
  DOM.currentTemp.textContent  = `${Math.round(data.current.temperature_2m)}°`;

  // Metrics
  DOM.feelsLike.textContent     = `${Math.round(data.current.apparent_temperature)}°`;
  DOM.humidity.textContent      = `${data.current.relative_humidity_2m}%`;
  DOM.wind.textContent          = `${Math.round(data.current.wind_speed_10m)} ${windUnit()}`;
  DOM.precipitation.textContent = `${data.current.precipitation} ${precipUnit()}`;

  // Extended metrics
  if (data.current.uv_index !== undefined) {
    DOM.uvIndex.textContent = `${data.current.uv_index}`;
  }
  if (data.current.visibility !== undefined) {
    const visKm = (data.current.visibility / 1000).toFixed(1);
    DOM.visibility.textContent = `${visKm} km`;
  }
  if (data.current.surface_pressure !== undefined) {
    DOM.pressure.textContent = `${Math.round(data.current.surface_pressure)} hPa`;
  }

  // Sunrise/Sunset
  renderSunTimes(data);

  // Daily
  renderDailyForecast(data);

  // Hourly
  renderHourlyDayPicker(data);
  renderHourlyForecast(data);

  // Animated background
  updateWeatherBackground(data.current.weather_code);

  // Favorite toggle state
  updateFavToggle();

  showAppState('weather');
}

function renderSunTimes(data) {
  if (!data.daily.sunrise || !data.daily.sunset) return;

  const sunrise = data.daily.sunrise[0];
  const sunset  = data.daily.sunset[0];

  DOM.sunriseTime.textContent = formatTime12h(sunrise);
  DOM.sunsetTime.textContent  = formatTime12h(sunset);

  // Calculate sun progress
  const now       = new Date();
  const sunriseMs = new Date(sunrise).getTime();
  const sunsetMs  = new Date(sunset).getTime();
  const nowMs     = now.getTime();

  let progress = 0;
  if (nowMs >= sunriseMs && nowMs <= sunsetMs) {
    progress = ((nowMs - sunriseMs) / (sunsetMs - sunriseMs)) * 100;
  } else if (nowMs > sunsetMs) {
    progress = 100;
  }

  DOM.sunProgress.style.width = `${progress}%`;
  DOM.sunDot.style.left       = `${progress}%`;
}

function renderDailyForecast(data) {
  DOM.dailyGrid.innerHTML = '';
  data.daily.time.forEach((dateStr, i) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = DAY_NAMES_SHORT[d.getDay()];
    const code  = data.daily.weather_code[i];
    const high  = Math.round(data.daily.temperature_2m_max[i]);
    const low   = Math.round(data.daily.temperature_2m_min[i]);
    const card  = document.createElement('div');
    card.className = 'daily-card';
    card.innerHTML = `
      <p class="daily-card__day">${dayName}</p>
      <img class="daily-card__icon" src="${getWeatherIcon(code)}" alt="${getWeatherDesc(code)}" width="40" height="40">
      <div class="daily-card__temps">
        <span class="daily-card__high">${high}°</span>
        <span class="daily-card__low">${low}°</span>
      </div>`;
    DOM.dailyGrid.appendChild(card);
  });
}

function renderHourlyDayPicker(data) {
  DOM.hourlyDaySelect.innerHTML = '';
  data.daily.time.forEach((dateStr, i) => {
    const d = new Date(dateStr + 'T00:00:00');
    const option = document.createElement('option');
    option.value = i;
    option.textContent = DAY_NAMES_FULL[d.getDay()];
    if (i === state.selectedHourlyDay) option.selected = true;
    DOM.hourlyDaySelect.appendChild(option);
  });
}

function renderHourlyForecast(data) {
  DOM.hourlyList.innerHTML = '';
  const dayIndex  = state.selectedHourlyDay;
  const startHour = dayIndex * 24;
  const endHour   = startHour + 24;
  let sliceStart  = startHour;
  if (dayIndex === 0) sliceStart = startHour + new Date().getHours();

  for (let i = sliceStart; i < endHour && i < data.hourly.time.length; i++) {
    const time = new Date(data.hourly.time[i]);
    const hour = time.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12  = hour % 12 === 0 ? 12 : hour % 12;
    const code = data.hourly.weather_code[i];
    const temp = Math.round(data.hourly.temperature_2m[i]);
    const row  = document.createElement('div');
    row.className = 'hourly-row';
    row.innerHTML = `
      <img class="hourly-row__icon" src="${getWeatherIcon(code)}" alt="${getWeatherDesc(code)}" width="28" height="28">
      <span class="hourly-row__time">${h12} ${ampm}</span>
      <span class="hourly-row__temp">${temp}°</span>`;
    DOM.hourlyList.appendChild(row);
  }
}

// ============================================================
// 7. ANIMATED WEATHER BACKGROUNDS
// ============================================================

function updateWeatherBackground(weatherCode) {
  const bgType = getWeatherBgType(weatherCode);
  DOM.weatherParticles.innerHTML = '';

  switch (bgType) {
    case 'rain':
      for (let i = 0; i < 60; i++) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.height = Math.random() * 20 + 10 + 'px';
        drop.style.animationDuration = Math.random() * 0.5 + 0.5 + 's';
        drop.style.animationDelay = Math.random() * 2 + 's';
        DOM.weatherParticles.appendChild(drop);
      }
      break;

    case 'snow':
      for (let i = 0; i < 40; i++) {
        const flake = document.createElement('div');
        flake.className = 'snow-flake';
        flake.style.left = Math.random() * 100 + '%';
        flake.style.width = flake.style.height = Math.random() * 4 + 3 + 'px';
        flake.style.animationDuration = Math.random() * 3 + 4 + 's';
        flake.style.animationDelay = Math.random() * 5 + 's';
        DOM.weatherParticles.appendChild(flake);
      }
      break;

    case 'cloudy':
      for (let i = 0; i < 5; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud-puff';
        cloud.style.top = Math.random() * 40 + '%';
        cloud.style.width = Math.random() * 100 + 80 + 'px';
        cloud.style.height = Math.random() * 40 + 30 + 'px';
        cloud.style.animationDuration = Math.random() * 20 + 30 + 's';
        cloud.style.animationDelay = Math.random() * 10 + 's';
        DOM.weatherParticles.appendChild(cloud);
      }
      break;

    case 'sunny':
      const ray = document.createElement('div');
      ray.className = 'sun-ray';
      DOM.weatherParticles.appendChild(ray);
      break;
  }
}

// ============================================================
// 8. SEARCH LOGIC
// ============================================================

let searchTimeout = null;

function handleSearchInput() {
  const query = DOM.searchInput.value.trim();
  clearTimeout(searchTimeout);
  if (query.length < 2) { closeSuggestions(); return; }

  DOM.searchSuggestions.innerHTML = `
    <li class="search-loading">
      <img src="./assets/images/icon-loading.svg" alt="" width="18" height="18">
      Search in progress
    </li>`;
  DOM.searchSuggestions.classList.add('search__suggestions--open');

  searchTimeout = setTimeout(async () => {
    try {
      const results = await searchLocations(query);
      renderSuggestions(results);
    } catch { closeSuggestions(); }
  }, 350);
}

function renderSuggestions(results) {
  DOM.searchSuggestions.innerHTML = '';
  if (results.length === 0) { closeSuggestions(); return; }
  results.forEach(loc => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.textContent = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}, ${loc.country}`;
    li.addEventListener('click', () => selectLocation(loc));
    DOM.searchSuggestions.appendChild(li);
  });
  DOM.searchSuggestions.classList.add('search__suggestions--open');
}

function closeSuggestions() {
  DOM.searchSuggestions.classList.remove('search__suggestions--open');
  DOM.searchSuggestions.innerHTML = '';
}

async function selectLocation(loc) {
  state.location = {
    name: loc.name,
    country: loc.country || '',
    lat: loc.latitude,
    lon: loc.longitude,
  };
  DOM.searchInput.value = `${loc.name}, ${loc.country || ''}`;
  closeSuggestions();
  await loadWeather();
}

async function loadWeather() {
  showAppState('loading');
  try {
    const data = await fetchWeather(state.location.lat, state.location.lon);
    state.weatherData = data;
    state.selectedHourlyDay = 0;
    renderWeather();
  } catch (err) {
    console.error('Failed to fetch weather:', err);
    showAppState('error');
  }
}

// ============================================================
// 9. VOICE SEARCH
// ============================================================

function initVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    DOM.voiceSearchBtn.style.display = 'none';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  DOM.voiceSearchBtn.addEventListener('click', () => {
    DOM.voiceSearchBtn.classList.add('search__voice--active');
    recognition.start();
  });

  recognition.addEventListener('result', (e) => {
    const transcript = e.results[0][0].transcript;
    DOM.searchInput.value = transcript;
    DOM.voiceSearchBtn.classList.remove('search__voice--active');
    DOM.searchForm.dispatchEvent(new Event('submit'));
  });

  recognition.addEventListener('end', () => {
    DOM.voiceSearchBtn.classList.remove('search__voice--active');
  });

  recognition.addEventListener('error', () => {
    DOM.voiceSearchBtn.classList.remove('search__voice--active');
  });
}

// ============================================================
// 10. UNITS LOGIC
// ============================================================

function toggleUnitsDropdown() {
  DOM.unitsDropdown.classList.toggle('units--open');
  DOM.unitsToggle.setAttribute('aria-expanded', DOM.unitsDropdown.classList.contains('units--open'));
}

function closeUnitsDropdown() {
  DOM.unitsDropdown.classList.remove('units--open');
  DOM.unitsToggle.setAttribute('aria-expanded', 'false');
}

function switchAllUnits() {
  const isMetric = state.units.temperature === 'celsius';
  if (isMetric) {
    state.units = { temperature: 'fahrenheit', windSpeed: 'mph', precipitation: 'inch' };
  } else {
    state.units = { temperature: 'celsius', windSpeed: 'kmh', precipitation: 'mm' };
  }
  updateUnitsUI();
  if (state.weatherData) loadWeather();
}

function setUnit(unitValue) {
  switch (unitValue) {
    case 'celsius':    state.units.temperature = 'celsius'; break;
    case 'fahrenheit': state.units.temperature = 'fahrenheit'; break;
    case 'kmh':        state.units.windSpeed = 'kmh'; break;
    case 'mph':        state.units.windSpeed = 'mph'; break;
    case 'mm':         state.units.precipitation = 'mm'; break;
    case 'inch':       state.units.precipitation = 'inch'; break;
  }
  updateUnitsUI();
  if (state.weatherData) loadWeather();
}

function updateUnitsUI() {
  const isMetric = state.units.temperature === 'celsius';
  DOM.unitsSwitch.textContent = isMetric ? 'Switch to Imperial' : 'Switch to Metric';
  DOM.unitsPanel.querySelectorAll('.units__option').forEach(btn => {
    const unit = btn.dataset.unit;
    const isActive = unit === state.units.temperature || unit === state.units.windSpeed || unit === state.units.precipitation;
    btn.classList.toggle('units__option--active', isActive);
    btn.setAttribute('aria-checked', isActive);
  });
}

// ============================================================
// 11. DARK/LIGHT THEME
// ============================================================

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('weatherTheme', theme);

  if (theme === 'auto') {
    const hour = new Date().getHours();
    const isDark = hour < 6 || hour >= 20;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    DOM.themeIcon.textContent = isDark ? '🌙' : '☀️';
  } else {
    document.documentElement.setAttribute('data-theme', theme);
    DOM.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

function cycleTheme() {
  if (state.theme === 'auto') applyTheme('light');
  else if (state.theme === 'light') applyTheme('dark');
  else applyTheme('auto');
}

// ============================================================
// 12. FAVORITES / SAVED LOCATIONS
// ============================================================

function saveFavorites() {
  localStorage.setItem('weatherFavorites', JSON.stringify(state.favorites));
}

function addFavorite() {
  const { name, country, lat, lon } = state.location;
  const exists = state.favorites.some(f => f.lat === lat && f.lon === lon);
  if (!exists) {
    state.favorites.push({ name, country, lat, lon });
    saveFavorites();
  }
  updateFavToggle();
  renderFavorites();
}

function removeFavorite(lat, lon) {
  state.favorites = state.favorites.filter(f => !(f.lat === lat && f.lon === lon));
  saveFavorites();
  updateFavToggle();
  renderFavorites();
}

function updateFavToggle() {
  const isFav = state.favorites.some(f => f.lat === state.location.lat && f.lon === state.location.lon);
  DOM.favToggle.textContent = isFav ? '★' : '♡';
  DOM.favToggle.classList.toggle('current-weather__fav--active', isFav);
}

function renderFavorites() {
  DOM.favoritesList.innerHTML = '';
  DOM.favoritesEmpty.hidden = state.favorites.length > 0;

  state.favorites.forEach(fav => {
    const li = document.createElement('li');
    li.className = 'favorites-panel__item';
    li.innerHTML = `
      <span class="favorites-panel__name">${fav.name}, ${fav.country}</span>
      <button class="favorites-panel__remove" data-lat="${fav.lat}" data-lon="${fav.lon}" aria-label="Remove ${fav.name}">&times;</button>`;
    li.querySelector('.favorites-panel__name').addEventListener('click', () => {
      selectLocation({ name: fav.name, country: fav.country, latitude: fav.lat, longitude: fav.lon });
      DOM.favoritesPanel.hidden = true;
    });
    li.querySelector('.favorites-panel__remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFavorite(fav.lat, fav.lon);
    });
    DOM.favoritesList.appendChild(li);
  });
}

// ============================================================
// 13. COMPARE LOCATIONS
// ============================================================

async function addToCompare() {
  const { name, country, lat, lon } = state.location;
  const exists = state.compareLocations.some(c => c.lat === lat && c.lon === lon);
  if (exists) return;

  try {
    const data = await fetchWeather(lat, lon);
    state.compareLocations.push({
      name, country, lat, lon,
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      wind: Math.round(data.current.wind_speed_10m),
      desc: getWeatherDesc(data.current.weather_code),
      icon: getWeatherIcon(data.current.weather_code),
    });
    renderCompare();
    DOM.compareSection.hidden = false;
  } catch (err) {
    console.error('Compare fetch error:', err);
  }
}

function removeFromCompare(lat, lon) {
  state.compareLocations = state.compareLocations.filter(c => !(c.lat === lat && c.lon === lon));
  renderCompare();
  if (state.compareLocations.length === 0) DOM.compareSection.hidden = true;
}

function renderCompare() {
  DOM.compareGrid.innerHTML = '';
  state.compareLocations.forEach(loc => {
    const card = document.createElement('div');
    card.className = 'compare-card';
    card.innerHTML = `
      <button class="compare-card__remove" data-lat="${loc.lat}" data-lon="${loc.lon}" aria-label="Remove">&times;</button>
      <p class="compare-card__city">${loc.name}, ${loc.country}</p>
      <p class="compare-card__temp">${loc.temp}°</p>
      <p class="compare-card__detail">Feels like ${loc.feelsLike}° · ${loc.desc}</p>
      <p class="compare-card__detail">Humidity: ${loc.humidity}% · Wind: ${loc.wind} ${windUnit()}</p>`;
    card.querySelector('.compare-card__remove').addEventListener('click', () => {
      removeFromCompare(loc.lat, loc.lon);
    });
    DOM.compareGrid.appendChild(card);
  });
}

// ============================================================
// 14. PWA SERVICE WORKER
// ============================================================

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('SW registration failed:', err);
    });
  }
}

// ============================================================
// 15. EVENT LISTENERS
// ============================================================

// Search
DOM.searchInput.addEventListener('input', handleSearchInput);
DOM.searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = DOM.searchInput.value.trim();
  if (!query) return;
  closeSuggestions();
  showAppState('loading');
  try {
    const results = await searchLocations(query);
    if (results.length === 0) { showAppState('no-results'); return; }
    await selectLocation(results[0]);
  } catch { showAppState('error'); }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) closeSuggestions();
});

// Units
DOM.unitsToggle.addEventListener('click', (e) => { e.stopPropagation(); toggleUnitsDropdown(); });
DOM.unitsSwitch.addEventListener('click', switchAllUnits);
DOM.unitsPanel.addEventListener('click', (e) => {
  const option = e.target.closest('.units__option');
  if (option) setUnit(option.dataset.unit);
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.units')) closeUnitsDropdown();
});

// Hourly day picker
DOM.hourlyDaySelect.addEventListener('change', (e) => {
  state.selectedHourlyDay = parseInt(e.target.value, 10);
  renderHourlyForecast(state.weatherData);
});

// Retry
DOM.retryButton.addEventListener('click', () => {
  if (state.location.lat && state.location.lon) loadWeather();
});

// Theme
DOM.themeToggle.addEventListener('click', cycleTheme);

// Favorites
DOM.favoritesBtn.addEventListener('click', () => {
  DOM.favoritesPanel.hidden = !DOM.favoritesPanel.hidden;
  renderFavorites();
});
DOM.favoritesClose.addEventListener('click', () => { DOM.favoritesPanel.hidden = true; });
DOM.favToggle.addEventListener('click', () => {
  const isFav = state.favorites.some(f => f.lat === state.location.lat && f.lon === state.location.lon);
  if (isFav) removeFavorite(state.location.lat, state.location.lon);
  else addFavorite();
});

// Compare
DOM.compareToggle.addEventListener('click', addToCompare);
DOM.compareClose.addEventListener('click', () => { DOM.compareSection.hidden = true; });

// ============================================================
// 16. INITIALIZATION
// ============================================================

async function init() {
  showAppState('loading');
  applyTheme(state.theme);
  initVoiceSearch();
  registerServiceWorker();

  // Try geolocation
  if ('geolocation' in navigator) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      const { latitude, longitude } = position.coords;
      state.location = { name: 'Your Location', country: '', lat: latitude, lon: longitude };

      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`);
        const geo = await resp.json();
        if (geo && geo.address) {
          state.location.name = geo.address.city || geo.address.town || geo.address.village || 'Your Location';
          state.location.country = geo.address.country || '';
        }
      } catch { /* keep fallback name */ }

      await loadWeather();
      return;
    } catch { /* geolocation denied — fall through */ }
  }

  // Default city
  state.location = { name: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.41 };
  await loadWeather();
}

init();
