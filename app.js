/* ==========================================================================
   WEATHER NOW — Complete Application Logic
   ========================================================================== */

// ============================================================
// 1. CONSTANTS & CONFIGURATION
// ============================================================

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL   = 'https://api.open-meteo.com/v1/forecast';

// WMO Weather interpretation codes → icon file + description
// Reference: https://open-meteo.com/en/docs#weathervariables
const WMO_CODES = {
  0:  { icon: 'icon-sunny.webp',         desc: 'Clear sky' },
  1:  { icon: 'icon-sunny.webp',         desc: 'Mainly clear' },
  2:  { icon: 'icon-partly-cloudy.webp', desc: 'Partly cloudy' },
  3:  { icon: 'icon-overcast.webp',      desc: 'Overcast' },
  45: { icon: 'icon-fog.webp',           desc: 'Fog' },
  48: { icon: 'icon-fog.webp',           desc: 'Depositing rime fog' },
  51: { icon: 'icon-drizzle.webp',       desc: 'Light drizzle' },
  53: { icon: 'icon-drizzle.webp',       desc: 'Moderate drizzle' },
  55: { icon: 'icon-drizzle.webp',       desc: 'Dense drizzle' },
  56: { icon: 'icon-drizzle.webp',       desc: 'Freezing drizzle' },
  57: { icon: 'icon-drizzle.webp',       desc: 'Dense freezing drizzle' },
  61: { icon: 'icon-rain.webp',          desc: 'Slight rain' },
  63: { icon: 'icon-rain.webp',          desc: 'Moderate rain' },
  65: { icon: 'icon-rain.webp',          desc: 'Heavy rain' },
  66: { icon: 'icon-rain.webp',          desc: 'Freezing rain' },
  67: { icon: 'icon-rain.webp',          desc: 'Heavy freezing rain' },
  71: { icon: 'icon-snow.webp',          desc: 'Slight snow' },
  73: { icon: 'icon-snow.webp',          desc: 'Moderate snow' },
  75: { icon: 'icon-snow.webp',          desc: 'Heavy snow' },
  77: { icon: 'icon-snow.webp',          desc: 'Snow grains' },
  80: { icon: 'icon-rain.webp',          desc: 'Rain showers' },
  81: { icon: 'icon-rain.webp',          desc: 'Moderate rain showers' },
  82: { icon: 'icon-rain.webp',          desc: 'Violent rain showers' },
  85: { icon: 'icon-snow.webp',          desc: 'Snow showers' },
  86: { icon: 'icon-snow.webp',          desc: 'Heavy snow showers' },
  95: { icon: 'icon-storm.webp',         desc: 'Thunderstorm' },
  96: { icon: 'icon-storm.webp',         desc: 'Thunderstorm with hail' },
  99: { icon: 'icon-storm.webp',         desc: 'Thunderstorm with heavy hail' },
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
    temperature: 'celsius',   // or 'fahrenheit'
    windSpeed: 'kmh',         // or 'mph'
    precipitation: 'mm',      // or 'inch'
  },
  selectedHourlyDay: 0, // index into daily arrays (0 = today)
};

// ============================================================
// 3. DOM REFERENCES
// ============================================================

const DOM = {
  // Search
  searchForm:        document.getElementById('search-form'),
  searchInput:       document.getElementById('search-input'),
  searchButton:      document.getElementById('search-button'),
  searchSuggestions:  document.getElementById('search-suggestions'),

  // Units
  unitsDropdown:     document.getElementById('units-dropdown'),
  unitsToggle:       document.getElementById('units-toggle'),
  unitsPanel:        document.getElementById('units-panel'),
  unitsSwitch:       document.getElementById('units-switch'),

  // App states
  loadingState:      document.getElementById('loading-state'),
  errorState:        document.getElementById('error-state'),
  noResultsState:    document.getElementById('no-results-state'),
  weatherContent:    document.getElementById('weather-content'),
  retryButton:       document.getElementById('retry-button'),

  // Weather data
  locationName:      document.getElementById('location-name'),
  currentDate:       document.getElementById('current-date'),
  currentIcon:       document.getElementById('current-icon'),
  currentTemp:       document.getElementById('current-temp'),
  feelsLike:         document.getElementById('feels-like'),
  humidity:          document.getElementById('humidity'),
  wind:              document.getElementById('wind'),
  precipitation:     document.getElementById('precipitation'),
  dailyGrid:         document.getElementById('daily-grid'),
  hourlyDaySelect:   document.getElementById('hourly-day-select'),
  hourlyList:        document.getElementById('hourly-list'),
};

// ============================================================
// 4. API FUNCTIONS
// ============================================================

/**
 * Searches for cities matching the query using the Open-Meteo Geocoding API.
 * Returns an array of location results.
 */
async function searchLocations(query) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Geocoding API error: ${response.status}`);
  const data = await response.json();
  return data.results || [];
}

/**
 * Fetches weather data for a given latitude/longitude.
 * Requests current conditions + 7-day daily + 24h×7 hourly data.
 * Returns the raw API response object.
 */
async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'weather_code', 'wind_speed_10m', 'precipitation'
    ].join(','),
    hourly: ['temperature_2m', 'weather_code'].join(','),
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min'
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

/**
 * Shows exactly one of the four possible app states.
 * Valid values: 'loading' | 'error' | 'no-results' | 'weather'
 */
function showAppState(stateName) {
  DOM.loadingState.hidden    = stateName !== 'loading';
  DOM.errorState.hidden      = stateName !== 'error';
  DOM.noResultsState.hidden  = stateName !== 'no-results';
  DOM.weatherContent.hidden  = stateName !== 'weather';
}

// ============================================================
// 6. RENDER FUNCTIONS
// ============================================================

/** Formats a date string like "Tuesday, Aug 5, 2025" */
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_NAMES_FULL[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Returns the weather icon path for a WMO code */
function getWeatherIcon(code) {
  const entry = WMO_CODES[code] || WMO_CODES[3]; // fallback to overcast
  return `./assets/images/${entry.icon}`;
}

/** Returns the weather description for a WMO code */
function getWeatherDesc(code) {
  return (WMO_CODES[code] || WMO_CODES[3]).desc;
}

/** Returns the temperature unit symbol */
function tempUnit() {
  return state.units.temperature === 'celsius' ? '°' : '°F';
}

/** Returns the wind speed unit label */
function windUnit() {
  return state.units.windSpeed === 'kmh' ? 'km/h' : 'mph';
}

/** Returns the precipitation unit label */
function precipUnit() {
  return state.units.precipitation === 'mm' ? 'mm' : 'in';
}

/**
 * Renders ALL weather data to the DOM.
 * Called after fetching weather or after changing units.
 */
function renderWeather() {
  const data = state.weatherData;
  if (!data) return;

  // --- Current Weather ---
  DOM.locationName.textContent = `${state.location.name}, ${state.location.country}`;
  DOM.currentDate.textContent  = formatDate(data.daily.time[0]);
  DOM.currentIcon.src          = getWeatherIcon(data.current.weather_code);
  DOM.currentIcon.alt          = getWeatherDesc(data.current.weather_code);
  DOM.currentTemp.textContent  = `${Math.round(data.current.temperature_2m)}°`;

  // --- Metrics ---
  DOM.feelsLike.textContent     = `${Math.round(data.current.apparent_temperature)}°`;
  DOM.humidity.textContent      = `${data.current.relative_humidity_2m}%`;
  DOM.wind.textContent          = `${Math.round(data.current.wind_speed_10m)} ${windUnit()}`;
  DOM.precipitation.textContent = `${data.current.precipitation} ${precipUnit()}`;

  // --- Daily Forecast ---
  renderDailyForecast(data);

  // --- Hourly Day Picker ---
  renderHourlyDayPicker(data);

  // --- Hourly Forecast for selected day ---
  renderHourlyForecast(data);

  showAppState('weather');
}

/** Renders the 7-day daily forecast cards */
function renderDailyForecast(data) {
  DOM.dailyGrid.innerHTML = '';

  data.daily.time.forEach((dateStr, i) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = DAY_NAMES_SHORT[d.getDay()];
    const code    = data.daily.weather_code[i];
    const high    = Math.round(data.daily.temperature_2m_max[i]);
    const low     = Math.round(data.daily.temperature_2m_min[i]);

    const card = document.createElement('div');
    card.className = 'daily-card';
    card.innerHTML = `
      <p class="daily-card__day">${dayName}</p>
      <img class="daily-card__icon" src="${getWeatherIcon(code)}" alt="${getWeatherDesc(code)}" width="40" height="40">
      <div class="daily-card__temps">
        <span class="daily-card__high">${high}°</span>
        <span class="daily-card__low">${low}°</span>
      </div>
    `;
    DOM.dailyGrid.appendChild(card);
  });
}

/** Populates the day picker <select> for hourly forecast */
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

/** Renders hourly rows for the currently selected day */
function renderHourlyForecast(data) {
  DOM.hourlyList.innerHTML = '';

  const dayIndex = state.selectedHourlyDay;
  // Each day has 24 hourly entries (index 0..23 for day 0, 24..47 for day 1, etc.)
  const startHour = dayIndex * 24;
  const endHour   = startHour + 24;

  // Determine which hours to show: for today, show from the current hour onward
  const now = new Date();
  let sliceStart = startHour;
  if (dayIndex === 0) {
    const currentHour = now.getHours();
    sliceStart = startHour + currentHour;
  }

  for (let i = sliceStart; i < endHour && i < data.hourly.time.length; i++) {
    const time = new Date(data.hourly.time[i]);
    const hour = time.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12  = hour % 12 === 0 ? 12 : hour % 12;

    const code = data.hourly.weather_code[i];
    const temp = Math.round(data.hourly.temperature_2m[i]);

    const row = document.createElement('div');
    row.className = 'hourly-row';
    row.innerHTML = `
      <img class="hourly-row__icon" src="${getWeatherIcon(code)}" alt="${getWeatherDesc(code)}" width="28" height="28">
      <span class="hourly-row__time">${h12} ${ampm}</span>
      <span class="hourly-row__temp">${temp}°</span>
    `;
    DOM.hourlyList.appendChild(row);
  }
}

// ============================================================
// 7. SEARCH LOGIC
// ============================================================

let searchTimeout = null;

/** Debounced live search as the user types */
function handleSearchInput() {
  const query = DOM.searchInput.value.trim();

  clearTimeout(searchTimeout);
  if (query.length < 2) {
    closeSuggestions();
    return;
  }

  // Show "searching..." feedback
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
    } catch {
      closeSuggestions();
    }
  }, 350);
}

/** Renders search suggestion items */
function renderSuggestions(results) {
  DOM.searchSuggestions.innerHTML = '';

  if (results.length === 0) {
    closeSuggestions();
    return;
  }

  results.forEach((loc) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.textContent = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}, ${loc.country}`;
    li.addEventListener('click', () => {
      selectLocation(loc);
    });
    DOM.searchSuggestions.appendChild(li);
  });

  DOM.searchSuggestions.classList.add('search__suggestions--open');
}

function closeSuggestions() {
  DOM.searchSuggestions.classList.remove('search__suggestions--open');
  DOM.searchSuggestions.innerHTML = '';
}

/** Called when a user selects a location from suggestions or submits the form */
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

/** Fetches weather for the current state.location and renders it */
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
// 8. UNITS LOGIC
// ============================================================

function toggleUnitsDropdown() {
  DOM.unitsDropdown.classList.toggle('units--open');
  const isOpen = DOM.unitsDropdown.classList.contains('units--open');
  DOM.unitsToggle.setAttribute('aria-expanded', isOpen);
}

function closeUnitsDropdown() {
  DOM.unitsDropdown.classList.remove('units--open');
  DOM.unitsToggle.setAttribute('aria-expanded', 'false');
}

/** Switches all units to imperial or metric at once */
function switchAllUnits() {
  const isMetric = state.units.temperature === 'celsius';

  if (isMetric) {
    // Switch to imperial
    state.units.temperature   = 'fahrenheit';
    state.units.windSpeed     = 'mph';
    state.units.precipitation = 'inch';
  } else {
    // Switch to metric
    state.units.temperature   = 'celsius';
    state.units.windSpeed     = 'kmh';
    state.units.precipitation = 'mm';
  }

  updateUnitsUI();
  if (state.weatherData) loadWeather();
}

/** Sets a single unit option */
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

/** Updates the visual state of the unit options (checkmarks + switch text) */
function updateUnitsUI() {
  const isMetric = state.units.temperature === 'celsius';
  DOM.unitsSwitch.textContent = isMetric ? 'Switch to Imperial' : 'Switch to Metric';

  // Update active states on all option buttons
  const options = DOM.unitsPanel.querySelectorAll('.units__option');
  options.forEach((btn) => {
    const unit = btn.dataset.unit;
    const isActive =
      unit === state.units.temperature ||
      unit === state.units.windSpeed ||
      unit === state.units.precipitation;

    btn.classList.toggle('units__option--active', isActive);
    btn.setAttribute('aria-checked', isActive);
  });
}

// ============================================================
// 9. EVENT LISTENERS
// ============================================================

// --- Search ---
DOM.searchInput.addEventListener('input', handleSearchInput);

DOM.searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = DOM.searchInput.value.trim();
  if (!query) return;

  closeSuggestions();
  showAppState('loading');

  try {
    const results = await searchLocations(query);
    if (results.length === 0) {
      showAppState('no-results');
      return;
    }
    await selectLocation(results[0]);
  } catch (err) {
    console.error('Search failed:', err);
    showAppState('error');
  }
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    closeSuggestions();
  }
});

// --- Units ---
DOM.unitsToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleUnitsDropdown();
});

DOM.unitsSwitch.addEventListener('click', () => {
  switchAllUnits();
});

DOM.unitsPanel.addEventListener('click', (e) => {
  const option = e.target.closest('.units__option');
  if (option) {
    setUnit(option.dataset.unit);
  }
});

// Close units dropdown on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.units')) {
    closeUnitsDropdown();
  }
});

// --- Hourly day picker ---
DOM.hourlyDaySelect.addEventListener('change', (e) => {
  state.selectedHourlyDay = parseInt(e.target.value, 10);
  renderHourlyForecast(state.weatherData);
});

// --- Retry button ---
DOM.retryButton.addEventListener('click', () => {
  if (state.location.lat && state.location.lon) {
    loadWeather();
  }
});

// ============================================================
// 10. INITIALIZATION
// ============================================================

/**
 * On page load: try geolocation first, then fall back to a default city.
 */
async function init() {
  showAppState('loading');

  // Attempt browser geolocation
  if ('geolocation' in navigator) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });

      const { latitude, longitude } = position.coords;

      // Reverse-lookup the city name via geocoding
      const reverseUrl = `${GEOCODING_URL}?name=&latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`;
      
      // Open-Meteo doesn't support reverse geocoding, so just use coordinates with a label
      state.location = {
        name: 'Your Location',
        country: '',
        lat: latitude,
        lon: longitude,
      };

      // Try to get a proper name by searching nearby
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`);
        const geo = await response.json();
        if (geo && geo.address) {
          state.location.name = geo.address.city || geo.address.town || geo.address.village || 'Your Location';
          state.location.country = geo.address.country || '';
        }
      } catch {
        // Keep "Your Location" as fallback
      }

      await loadWeather();
      return;
    } catch {
      // Geolocation denied or failed — fall through to default
    }
  }

  // Default: Berlin, Germany
  state.location = { name: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.41 };
  await loadWeather();
}

init();
