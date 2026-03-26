/* =========================================================================
   WEATHER APP JAVASCRIPT LOGIC
   This file handles interaction, like fetching data from the internet
   and putting it into HTML elements.
   ========================================================================= */

// 1. SELECTING HTML ELEMENTS
// We use document.getElementById to grab the HTML tags we want to update later.
const appContainer = document.getElementById('weather-content');
const initialSearch = document.getElementById('initial-search');
const loadingSpinner = document.getElementById('loading-spinner');

// Search elements for the secondary dashboard search bar
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');

// Search elements for the initial big screen
const initCityInput = document.getElementById('init-city-input');
const initSearchBtn = document.getElementById('init-search-btn');

// Elements that display the weather data
const cityName = document.getElementById('city-name');
const weatherDescription = document.getElementById('weather-description');
const temperature = document.getElementById('temperature');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const precipitation = document.getElementById('precipitation');
const visibility = document.getElementById('visibility');
const weatherIcon = document.getElementById('weather-icon');
const forecastList = document.getElementById('forecast-list');

// Quick link buttons
const quickLinkBtns = document.querySelectorAll('.city-chip');


// 2. WEATHER CODES DICTIONARY
// The API returns numbers, not words (e.g. 0 means clear, 71 means snow). 
// We use this dictionary to translate the number into text, CSS classes, and Icons!
const weatherCodes = {
    0: { text: "Clear sky", class: "weather-clear", icon: "uil-sun" },
    1: { text: "Mainly clear", class: "weather-clear", icon: "uil-sun" },
    2: { text: "Partly cloudy", class: "weather-clouds", icon: "uil-cloud-sun" },
    3: { text: "Overcast", class: "weather-clouds", icon: "uil-clouds" },
    45: { text: "Fog", class: "weather-clouds", icon: "uil-cloud-wind" },
    48: { text: "Depositing rime fog", class: "weather-clouds", icon: "uil-cloud-wind" },
    51: { text: "Light drizzle", class: "weather-rain", icon: "uil-cloud-drizzle" },
    53: { text: "Moderate drizzle", class: "weather-rain", icon: "uil-cloud-drizzle" },
    55: { text: "Dense drizzle", class: "weather-rain", icon: "uil-cloud-drizzle" },
    56: { text: "Freezing drizzle", class: "weather-snow", icon: "uil-cloud-meatball" },
    57: { text: "Dense freezing drizzle", class: "weather-snow", icon: "uil-cloud-meatball" },
    61: { text: "Slight rain", class: "weather-rain", icon: "uil-cloud-showers-heavy" },
    63: { text: "Moderate rain", class: "weather-rain", icon: "uil-cloud-showers-heavy" },
    65: { text: "Heavy rain", class: "weather-rain", icon: "uil-cloud-showers-heavy" },
    66: { text: "Freezing rain", class: "weather-snow", icon: "uil-cloud-hail" },
    67: { text: "Heavy freezing rain", class: "weather-snow", icon: "uil-cloud-hail" },
    71: { text: "Snow fall", class: "weather-snow", icon: "uil-snowflake" },
    73: { text: "Moderate snow", class: "weather-snow", icon: "uil-snowflake" },
    75: { text: "Heavy snow", class: "weather-snow", icon: "uil-snowflake" },
    77: { text: "Snow grains", class: "weather-snow", icon: "uil-snowflake" },
    80: { text: "Rain showers", class: "weather-rain", icon: "uil-cloud-rain" },
    81: { text: "Moderate showers", class: "weather-rain", icon: "uil-cloud-showers-heavy" },
    82: { text: "Violent showers", class: "weather-rain", icon: "uil-cloud-showers-heavy" },
    85: { text: "Snow showers", class: "weather-snow", icon: "uil-snowflake" },
    86: { text: "Heavy snow showers", class: "weather-snow", icon: "uil-snowflake" },
    95: { text: "Thunderstorm", class: "weather-thunderstorm", icon: "uil-thunderstorm" },
    96: { text: "Thunderstorm + hail", class: "weather-thunderstorm", icon: "uil-thunderstorm" },
    99: { text: "Heavy Thunderstorm", class: "weather-thunderstorm", icon: "uil-thunderstorm" },
};

// Application Programming Interface (API) links we use to get free data
const geocodeURL = 'https://geocoding-api.open-meteo.com/v1/search';
const weatherURL = 'https://api.open-meteo.com/v1/forecast';

// 3. FETCH DATA FUNCTION
// Fetching data takes time, so we use an 'async' function. It pauses with 'await' until data is ready.
async function fetchWeather(city, isInitial = false) {
    try {
        // By user request, we always return to the main loading screen when fetching new cities.
        // So we hide the dashboard and show the initial search loader.
        appContainer.classList.add('hidden');
        initialSearch.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');
        errorMessage.classList.add('hidden');

        // Step A: Convert the City Name into Geographic Coordinates (Latitude/Longitude)
        // We use the Geocoding API for this.
        const geoResponse = await fetch(`${geocodeURL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoResponse.json();

        // If the array is empty, the city doesn't exist
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }

        // Extract the location data
        const { latitude, longitude, name, country } = geoData.results[0];

        // Step B: Fetch the Weather using the Latitude & Longitude we just got
        const weatherResponse = await fetch(`${weatherURL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`);

        if (!weatherResponse.ok) throw new Error('Failed to fetch weather');

        // Convert the response to a Javascript Object
        const weatherData = await weatherResponse.json();

        // Step C: Send the data over to our separate 'updateUI' function to draw it on the screen
        updateUI(name, country, weatherData);

        // Hide the initial search screen and reveal the completed dashboard!
        loadingSpinner.classList.add('hidden');
        initialSearch.classList.add('hidden');
        appContainer.classList.remove('hidden');

    } catch (error) {
        // If anything goes wrong, we end up here in the catch block. We show the user an error.
        loadingSpinner.classList.add('hidden');

        if (isInitial) {
            alert(error.message);
        } else {
            // Bring the dashboard back if it fails, and just show the red error text under the top search bar
            initialSearch.classList.add('hidden');
            appContainer.classList.remove('hidden');
            errorMessage.classList.remove('hidden');
            errorMessage.textContent = error.message;
        }
    }
}

// 4. UPDATE UI FUNCTION
// Takes the fresh API data and puts it into the HTML boxes.
function updateUI(name, country, data) {
    const current = data.current;
    const code = current.weather_code;

    // Find our translated weather condition
    const weatherContext = weatherCodes[code] || weatherCodes[0];

    // Check if the sun is down (is_day equals 0)
    const isNight = current.is_day === 0;

    // Update text content
    cityName.textContent = `${name}`;
    if (country) cityName.textContent += `, ${country}`;

    weatherDescription.textContent = weatherContext.text;

    // Math.round removes decimals (e.g. 24.3 becomes 24)
    temperature.textContent = `${Math.round(current.temperature_2m)}°`;
    humidity.textContent = `${current.relative_humidity_2m}%`;
    windSpeed.textContent = `${current.wind_speed_10m} km/h`;
    precipitation.textContent = `${current.precipitation} mm`;

    // Figure out visibility using current hour
    const currentHour = new Date().getHours();
    let vis = data.hourly?.visibility?.[currentHour] || data.hourly?.visibility?.[0] || 10000;
    visibility.textContent = `${Math.round(vis / 1000)} km`;

    // Logic to select the correct moon icon if it is night time
    let iconClass = weatherContext.icon;
    if (isNight && [0, 1].includes(code)) iconClass = 'uil-moon';
    else if (isNight && [2, 3].includes(code)) iconClass = 'uil-cloud-moon';

    weatherIcon.className = `uil ${iconClass} weather-icon`;

    // ===================================
    // THEME AND BACKGROUND LOGIC
    // ===================================

    // Reset body classes 
    document.body.className = '';
    let themeClass = weatherContext.class;

    // Add correct background image class
    if (isNight && themeClass === 'weather-clear') {
        document.body.classList.add('weather-night'); // Starry night background
    } else {
        document.body.classList.add(themeClass);      // Sunny, rain, clouds, snow background
    }

    // Since snow and clear-sky backgrounds are very bright white/blue, 
    // we use 'theme-light' to make the app's text darkly colored so you can read it easily!
    if (themeClass === 'weather-snow' || themeClass === 'weather-clear') {
        if (!isNight) {
            document.body.classList.add('theme-light');
        }
    }

    // Add colors to specific icons for a nice touch
    let mainIconColor = 'inherit';
    if (iconClass.includes('sun')) mainIconColor = '#f6ad55'; // Orange sun
    else if (iconClass.includes('moon')) mainIconColor = '#cbd5e0'; // Grayish moon
    else if (iconClass === 'uil-thunderstorm') mainIconColor = '#fbd38d'; // Yellow lightning
    weatherIcon.style.color = mainIconColor;


    // ===================================
    // 7-DAY FORECAST LOGIC
    // ===================================

    // Clear out any old forecast HTML elements
    forecastList.innerHTML = '';

    const daily = data.daily;
    if (daily) {
        // Standard loop: runs 7 times, from i=0 to i=6
        for (let i = 0; i < daily.time.length && i < 7; i++) {
            const max = Math.round(daily.temperature_2m_max[i]);
            const min = Math.round(daily.temperature_2m_min[i]);
            const dCode = daily.weather_code[i];
            const dCtx = weatherCodes[dCode] || weatherCodes[0];

            // Format the date into Short Weekday (e.g., 'Mon', 'Tue', 'Wed')
            const dateObj = new Date(daily.time[i]);
            const dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

            // Apply Icon colors to the forecast list too
            let fIcon = dCtx.icon;
            let fColor = 'inherit';
            if (fIcon.includes('sun')) fColor = '#f6ad55';
            else if (fIcon === 'uil-thunderstorm') fColor = '#fbd38d';

            // Add the new HTML dynamically to the forecast row!
            forecastList.innerHTML += `
                <div class="f-item glass-card-sm">
                    <span class="f-day">${dayName}</span>
                    <i class="uil ${fIcon} f-icon" style="color:${fColor}"></i>
                    <div class="f-temps">
                        <span>${max}°</span>
                        <span>${min}°</span>
                    </div>
                </div>
            `;
        }
    }
}

// 5. EVENT LISTENERS
// Code that 'listens' for user actions, like clicks or hitting the 'Enter' key.

// Listeners for the Initial Search Screen
initSearchBtn.addEventListener('click', () => {
    const val = initCityInput.value.trim();
    if (val) fetchWeather(val, true); // true = yes, this is the initial screen
});

initCityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const val = initCityInput.value.trim();
        if (val) fetchWeather(val, true);
    }
});

// Listeners for the Quick Link City buttons
quickLinkBtns.forEach(button => {
    button.addEventListener('click', (e) => {
        // e.target.dataset.city grabs the name stored in 'data-city' attribute in HTML!
        const cityName = e.target.dataset.city;
        fetchWeather(cityName, true);
    });
});

// Listeners for the Main Dashboard search bar
searchBtn.addEventListener('click', () => {
    const val = cityInput.value.trim();
    if (val) fetchWeather(val, false); // false = not initial screen, just a normal dashboard search
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const val = cityInput.value.trim();
        if (val) fetchWeather(val, false);
    }
});
