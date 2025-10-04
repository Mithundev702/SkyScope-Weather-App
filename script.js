/* =============================================================== */
/* --- SkyScope Weather App — Main JavaScript (Enhanced & Themed) --- */
/* =============================================================== */

const API_KEY = "5fbb35c3f8a95af7896df2f959e7d6ea";

// --- DOM Element References ---
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn"); 
const placeName = document.getElementById("placeName");
const dateTime = document.getElementById("dateTime");
const tempEl = document.getElementById("temp");
const weatherAnimationEl = document.getElementById("weatherAnimation");
const feelsEl = document.getElementById("feels");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const chanceEl = document.getElementById("chance");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const forecastList = document.getElementById("forecastList");
const forecastSummary = document.getElementById("forecastSummary");
const adviceEl = document.getElementById("advice");
const chatWindow = document.getElementById("chatWindow");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const aqiValueEl = document.getElementById("aqiValue");
const aqiRatingEl = document.getElementById("aqiRating");
const tempAdviceBox = document.getElementById("tempAdviceBox");
const rainAdviceBox = document.getElementById("rainAdviceBox");
const seaAdviceBox = document.getElementById("seaAdviceBox");


// ===============================================================
// --- 1. CORE API & DATA HANDLING ---
// ===============================================================

async function fetchByCoords(lat, lon) {
    // This message is already set by handleLocationDetection, but we reset it on successful API call
    // adviceEl.textContent = "Fetching weather data...";
    
    const weatherPromise = fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`).then(res => { if (!res.ok) throw new Error("Weather fetch failed"); return res.json(); });
    const forecastPromise = fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`).then(res => { if (!res.ok) throw new Error("Forecast fetch failed"); return res.json(); });
    const aqiPromise = fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`).then(res => { if (!res.ok) throw new Error("AQI fetch failed"); return res.json(); });

    try {
        const [current, forecast, aqiData] = await Promise.all([weatherPromise, forecastPromise, aqiPromise]);

        updateUI(current, forecast);
        updateAQI(aqiData);
    } catch (error) {
        console.error(error);
        adviceEl.textContent = `Error fetching weather data: ${error.message}.`;
    }
}

async function fetchByCity(city) {
    if (!city) return;
    adviceEl.textContent = `Searching for ${city}...`;

    try {
        const searchUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
        const sresp = await fetch(searchUrl);
        if (!sresp.ok) throw new Error(`Could not find the city "${city}".`);
        const current = await sresp.json();
        await fetchByCoords(current.coord.lat, current.coord.lon);
    } catch (error) {
        console.error(error);
        adviceEl.textContent = `Error: ${error.message}`;
    }
}

// ===============================================================
// --- 2. UI UPDATE & DYNAMIC THEMES/ANIMATIONS ---
// ===============================================================

function updateUI(current, forecast) {
    const tzOffset = current.timezone ?? 0;
    const isDay = current.dt > current.sys.sunrise && current.dt < current.sys.sunset;
    
    placeName.textContent = `${current.name}, ${current.sys?.country ?? ""}`;
    dateTime.textContent = formatDateTime(tzOffset);
    tempEl.textContent = `${Math.round(current.main.temp)}°C`;
    feelsEl.textContent = `${Math.round(current.main.feels_like)}°C`;
    humidityEl.textContent = `${current.main.humidity}%`;
    windEl.textContent = `${current.wind?.speed ?? 0} m/s`;
    sunriseEl.textContent = formatTime(current.sys.sunrise, tzOffset);
    sunsetEl.textContent = formatTime(current.sys.sunset, tzOffset);
    forecastSummary.textContent = forecast.list[0]?.weather[0]?.description ?? current.weather[0].description;
    
    updateForecastList(forecast, tzOffset);
    const adviceData = computeAdvice(current, forecast);
    chanceEl.textContent = `${adviceData.nowChance}%`;
    adviceEl.textContent = adviceData.adviceText;

    updateAdviceBoxes(adviceData); 

    updateDynamicTheme(current.weather[0].id, isDay);
    updateWeatherAnimation(current.weather[0].id, isDay);

    window.__NIMBUS_DATA = { current, forecast, adviceData };
}

function updateAdviceBoxes(adviceData) {
    tempAdviceBox.textContent = `Temperature Advice: ${adviceData.tempAdvice}`;
    rainAdviceBox.textContent = `Rainfall Advice: ${adviceData.rainAdvice}`;
    seaAdviceBox.textContent = `Sea/Fishing Safety: ${adviceData.seaAdvice}`;
}

function updateAQI(aqiData) {
    if (!aqiData || !aqiData.list || !aqiData.list[0]) {
        aqiValueEl.textContent = 'N/A';
        aqiRatingEl.textContent = 'Unavailable';
        aqiValueEl.className = 'aqi-value';
        return;
    }
    const aqi = aqiData.list[0].main.aqi;
    const { rating, className } = getAQIRating(aqi);

    aqiValueEl.textContent = aqi;
    aqiRatingEl.textContent = rating;
    aqiValueEl.className = `aqi-value ${className}`;
}

function getAQIRating(aqi) {
    switch (aqi) {
        case 1: return { rating: 'Good', className: 'aqi-1' };
        case 2: return { rating: 'Fair', className: 'aqi-2' };
        case 3: return { rating: 'Moderate', className: 'aqi-3' };
        case 4: return { rating: 'Poor', className: 'aqi-4' };
        case 5: return { rating: 'Very Poor', className: 'aqi-5' };
        default: return { rating: 'Unknown', className: '' };
    }
}

function updateDynamicTheme(weatherId, isDay) {
    const userTheme = localStorage.getItem('userTheme') || 'dark';

    let dynamicTheme = userTheme; 

    if (userTheme === 'dark' || userTheme === 'light') {
        if (weatherId >= 500 && weatherId < 600) { 
            dynamicTheme = 'rain'; 
        } else if (isDay && userTheme === 'dark') { 
             dynamicTheme = 'day'; 
        }
    }
    
    if (userTheme === 'light') {
        document.body.className = 'light';
        return;
    }

    document.body.className = dynamicTheme;
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('userTheme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('userTheme', newTheme);
    
    if (window.__NIMBUS_DATA) {
        const { current } = window.__NIMBUS_DATA;
        const isDay = current.dt > current.sys.sunrise && current.dt < current.sys.sunset;
        updateDynamicTheme(current.weather[0].id, isDay);
    } else {
        document.body.className = newTheme; 
    }
}

function updateWeatherAnimation(weatherId, isDay) {
    let html = '';
    if (weatherId >= 800) {
        if (weatherId === 800) { html = isDay ? '<div class="sun"></div>' : '<div class="moon"></div>'; }
        else { const bgElement = isDay ? '<div class="sun"></div>' : '<div class="moon"></div>'; html = `${bgElement}<div class="cloud"></div><div class="cloud"></div>`; }
    } 
    else if (weatherId >= 700 && weatherId < 800) {
        for (let i = 0; i < 5; i++) { const style = `top: ${Math.random() * 80}%; animation-delay: ${Math.random() * 3}s;`; html += `<div class="wind-line" style="${style}"></div>`; }
    }
    else if (weatherId >= 600 && weatherId < 700) {
        html = '<div class="cloud"></div>';
        for (let i = 0; i < 15; i++) { const style = `left: ${Math.random() * 100}%; animation-delay: ${Math.random() * 10}s; animation-duration: ${5 + Math.random() * 5}s;`; html += `<div class="snow-flake" style="${style}"></div>`; }
    }
    else if (weatherId >= 200 && weatherId < 600) {
        html = '<div class="cloud"></div>';
        for (let i = 0; i < 10; i++) { const style = `left: ${Math.random() * 100}%; animation-delay: ${Math.random() * 0.5}s;`; html += `<div class="rain-drop" style="${style}"></div>`; }
    } 
    else { html = '<div class="cloud"></div>'; }
    weatherAnimationEl.innerHTML = html;
}

function updateForecastList(forecast, tzOffset) {
    forecastList.innerHTML = "";
    const next12Hours = forecast.list.slice(0, 4);
    next12Hours.forEach(item => {
        const el = document.createElement("div");
        el.className = "fc-item";
        el.innerHTML = `
            <div class="time">${formatForecastTime(item.dt, tzOffset)}</div>
            <div class="icon">${getWeatherEmoji(item.weather[0].id)}</div>
            <div class="t">${Math.round(item.main.temp)}°C</div>
            <div class="p">${Math.round((item.pop ?? 0) * 100)}%</div>`;
        forecastList.appendChild(el);
    });
}

function computeAdvice(current, forecast) {
    const temp = current.main.temp, wind = current.wind?.speed ?? 0, weatherId = current.weather[0].id;
    const nextSlots = forecast.list.slice(0, 4);
    const nowChance = Math.round((forecast.list[0].pop ?? 0) * 100);
    const maxPop = Math.round(Math.max(...nextSlots.map(s => s.pop ?? 0)) * 100);
    const totalRain = nextSlots.map(s => s.rain?.["3h"] ?? 0).reduce((a, b) => a + b, 0);
    let tempAdvice = "";
    if (temp >= 35) tempAdvice = "Extreme heat warning. Stay hydrated and avoid direct sun."; else if (temp >= 30) tempAdvice = "It's hot outside. Use sunscreen and carry water."; else if (temp <= 10) tempAdvice = "It's chilly. A jacket is recommended.";
    let rainAdvice = "";
    if (nowChance >= 70) rainAdvice = "It might be raining heavily. An umbrella is a must!"; else if (nowChance >= 40) rainAdvice = "Good chance of rain. Carry an umbrella just in case."; else if (maxPop >= 50) rainAdvice = `Low chance of rain now, but it might rain later today (${maxPop}% chance).`; else rainAdvice = "Rain is unlikely in the next few hours.";
    const cycloneRisk = wind >= 20, floodRisk = totalRain >= 30;
    let adviceText = `${rainAdvice} ${tempAdvice}`;
    if (cycloneRisk) adviceText += " DANGER: High winds detected! Possible cyclone conditions. Seek shelter and follow official alerts."; else if (floodRisk) adviceText += " WARNING: Heavy rain forecast may cause flooding in low-lying areas.";
    let seaAdvice = "";
    if (wind >= 15) { seaAdvice = `DANGER: Conditions are unsafe for fishermen. Wind speeds are very high (${wind} m/s), indicating dangerous sea conditions. It is strongly advised NOT to go to sea.`; } else if (wind >= 10) { seaAdvice = `CAUTION: Conditions require caution for fishermen. Wind speeds are high (${wind} m/s), which will create rough seas. Small boats should not venture out.`; } else { seaAdvice = `SAFE: Conditions appear relatively safe for fishermen. Wind speeds are moderate (${wind} m/s).`; }
    if (weatherId >= 200 && weatherId < 300) { seaAdvice += " Additionally, there is a risk of THUNDERSTORMS, which is extremely hazardous at sea due to lightning."; }
    return { nowChance, maxPop, totalRain, cycloneRisk, floodRisk, temp, wind, adviceText, rainAdvice, tempAdvice, seaAdvice };
}

function getWeatherEmoji(id) {
    if (id < 300) return "⛈️"; if (id < 600) return "🌧️"; if (id < 700) return "❄️"; if (id < 800) return "🌫️"; if (id === 800) return "☀️"; return "☁️";
}

function formatTime(ts, tz) { return new Date((ts + tz) * 1000).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" }); }
function formatDateTime(tz) { return new Date(Date.now() + tz * 1000).toLocaleString("en-US", { timeZone: "UTC", weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function formatForecastTime(ts, tz) { return new Date((ts + tz) * 1000).toLocaleTimeString("en-US", { timeZone: "UTC", hour: 'numeric' }); }


// ===============================================================
// --- 3. CHATBOT LOGIC (Enhanced Output) ---
// ===============================================================

function botReply(message) {
    const txt = message.toLowerCase().trim();
    const data = window.__NIMBUS_DATA;
    
    if (txt.includes("hello") || txt.includes("hi")) { 
        if(data) return `Hello! I'm SkyScope. Currently showing weather for ${data.current.name}. How can I help you today?`;
        return `Hello! I'm SkyScope's Weather Assistant. I can tell you about the weather, just search a city or detect your location!`;
    }
    
    // --- Location-based commands (Use Detect) ---
    if (txt.includes("my location") || txt.includes("here")) {
        if (txt.includes("rain") || txt.includes("chance of rain")) { return { command: 'detect_and_answer', question: 'rain' }; }
        if (txt.includes("temperature") || txt.includes("hot") || txt.includes("cold")) { return { command: 'detect_and_answer', question: 'temperature' }; }
        if (txt.includes("humidity") || txt.includes("humdity")) { return { command: 'detect_and_answer', question: 'humidity' }; }
        if (txt.includes("wind")) { return { command: 'detect_and_answer', question: 'wind' }; }
        if (txt.includes("fisherman") || txt.includes("fishing") || txt.includes("sea") || txt.includes("ocean") || txt.includes("boat")) { return { command: 'detect_and_answer', question: 'sea_safety' }; }
        return { command: 'detect_location' };
    }
    
    // --- City-based specific queries (Use Search and Answer) ---
    const specificRainQuery = txt.match(/(?:rain|chance of rain) in (.*?)(?:\sfor|\sin|\sat|$)/i);
    if (specificRainQuery && specificRainQuery[1]) { return { command: 'search_and_answer', city: specificRainQuery[1].trim(), question: 'rain' }; }
    const specificTempQuery = txt.match(/(?:temperature|temp|hot|cold) in (.*?)(?:\sfor|\sin|\sat|$)/i);
    if (specificTempQuery && specificTempQuery[1]) { return { command: 'search_and_answer', city: specificTempQuery[1].trim(), question: 'temperature' }; }
    const specificHumidityQuery = txt.match(/(?:humidity|humdity) in (.*?)(?:\sfor|\sin|\sat|$)/i);
    if (specificHumidityQuery && specificHumidityQuery[1]) { return { command: 'search_and_answer', city: specificHumidityQuery[1].trim(), question: 'humidity' }; }
    const specificWindQuery = txt.match(/(?:wind|wind speed) in (.*?)(?:\sfor|\sin|\sat|$)/i);
    if (specificWindQuery && specificWindQuery[1]) { return { command: 'search_and_answer', city: specificWindQuery[1].trim(), question: 'wind' }; }
    const specificSeaQuery = txt.match(/(?:fisherman|fishing|sea|ocean|boat) in (.*?)(?:\sfor|\sin|\sat|$)/i);
    if (specificSeaQuery && specificSeaQuery[1]) { return { command: 'search_and_answer', city: specificSeaQuery[1].trim(), question: 'sea_safety' }; }
    
    // --- Query about current loaded location ---
    if (data) {
        const { current, adviceData } = data;
        
        if (txt.includes("fisherman") || txt.includes("fishing") || txt.includes("sea") || txt.includes("ocean") || txt.includes("boat")) { 
            return `For ${current.name}, the sea safety advice is: ${adviceData.seaAdvice}`; 
        }
        if (txt.includes("rain") || txt.includes("umbrella") || txt.includes("wet")) { 
            let futureRain = adviceData.maxPop > adviceData.nowChance ? `However, the chance increases to ${adviceData.maxPop}% later today.` : ""; 
            return `Currently in ${current.name}, the chance of rain is **${adviceData.nowChance}%**. ${adviceData.rainAdvice} ${futureRain}`; 
        }
        if (txt.includes("hot") || txt.includes("heat") || txt.includes("cold") || txt.includes("temperature")) { 
            return `The temperature in ${current.name} is **${Math.round(current.main.temp)}°C**, feeling like ${Math.round(current.main.feels_like)}°C. ${adviceData.tempAdvice}`; 
        }
        if (txt.includes("humidity") || txt.includes("humdity")) { 
            return `The current humidity in ${current.name} is **${current.main.humidity}%**.`; 
        }
        if (txt.includes("wind") || txt.includes("storm") || txt.includes("cyclone")) { 
            if (adviceData.cycloneRisk) return `**WARNING!** Winds are very high at **${adviceData.wind} m/s** in ${current.name}. Please follow local safety warnings.`; 
            return `The wind speed is currently **${adviceData.wind} m/s** in ${current.name}.`; 
        }
    }
    
    // --- General search or default response ---
    const cityMatch = txt.match(/(?:weather in|how is it in|tell me about)\s(.+)/i);
    if (cityMatch && cityMatch[1]) { return { command: 'search', city: cityMatch[1].trim() }; }
    
    if (txt.length > 2 && txt !== 'hello' && txt !== 'hi') { return { command: 'search', city: message.trim() }; }

    return "I couldn't quite understand that. Try asking for a city name (e.g., 'weather in London') or a specific question (e.g., 'Will it rain today?').";
}

async function handleChatSend() {
    const msg = chatInput.value.trim(); if (!msg) return; appendChat(msg, "user"); chatInput.value = "";
    const reply = botReply(msg);
    
    if (typeof reply === 'object') {
        if (reply.command === 'detect_and_answer') {
            appendChat(`One moment, getting your location to check the ${reply.question}...`, 'bot');
            try {
                const coords = await detectLocation(); await fetchByCoords(coords.latitude, coords.longitude);
                const data = window.__NIMBUS_DATA; let summary = '';
                summary = `OK, I found you in **${data.current.name}**. `;
                switch (reply.question) {
                    case 'rain': summary += `The chance of rain is **${data.adviceData.nowChance}%**. ${data.adviceData.rainAdvice}`; break;
                    case 'temperature': summary += `The temperature is **${Math.round(data.current.main.temp)}°C**. ${data.adviceData.tempAdvice}`; break;
                    case 'humidity': summary += `The humidity is **${data.current.main.humidity}%**.`; break;
                    case 'wind': summary += `The wind speed is **${data.current.wind.speed} m/s**.`; break;
                    case 'sea_safety': summary += `Regarding sea safety, the advice is: ${data.adviceData.seaAdvice}`; break;
                }
                appendChat(summary, 'bot');
            } catch (error) { console.error(error); appendChat(`I need location permission for that. (${error.message})`, 'bot'); }
        } else if (reply.command === 'search_and_answer') {
            appendChat(`Searching for ${reply.city} to check the ${reply.question}...`, 'bot');
            try {
                await fetchByCity(reply.city); const data = window.__NIMBUS_DATA; let summary = '';
                summary = `Here is the information for **${data.current.name}**: `;
                switch (reply.question) {
                    case 'rain': summary += `The chance of rain is now **${data.adviceData.nowChance}%**. ${data.adviceData.rainAdvice}`; break;
                    case 'temperature': summary += `The temperature is **${Math.round(data.current.main.temp)}°C**. ${data.adviceData.tempAdvice}`; break;
                    case 'humidity': summary += `The humidity is currently **${data.current.main.humidity}%**.`; break;
                    case 'wind': summary += `The wind speed is **${data.current.wind.speed} m/s**.`; break;
                    case 'sea_safety': summary += `The sea safety advice is: ${data.adviceData.seaAdvice}`; break;
                    default: summary = `I have the weather for ${data.current.name}, but I'm not sure how to answer your specific question.`
                }
                appendChat(summary, 'bot');
            } catch (error) { console.error(error); appendChat(`Sorry, I couldn't get the data for "${reply.city}". Please check the spelling.`, 'bot'); }
        } else if (reply.command === 'search') {
            appendChat(`Checking the weather for ${reply.city}...`, "bot");
            try {
                await fetchByCity(reply.city); const data = window.__NIMBUS_DATA;
                const summary = `Found it! The weather in **${data.current.name}** is **${data.current.weather[0].description}** with a temperature of **${Math.round(data.current.main.temp)}°C**.`;
                appendChat(summary, 'bot');
            } catch (error) { console.error(error); appendChat(`Sorry, I couldn't find the weather for "${reply.city}". Please check the spelling.`, 'bot'); }
        } else if (reply.command === 'detect_location') {
            appendChat("Trying to find your current location...", "bot");
            try {
                const coords = await detectLocation(); await fetchByCoords(coords.latitude, coords.longitude);
                const data = window.__NIMBUS_DATA;
                const summary = `I found you! In **${data.current.name}**, it's currently **${data.current.weather[0].description}** and **${Math.round(data.current.main.temp)}°C**.`;
                appendChat(summary, "bot");
            } catch (error) { console.error(error); appendChat(`I need location permission for that. (${error.message})`, 'bot'); }
        }
    } else {
        setTimeout(() => appendChat(reply, "bot"), 300);
    }
}

function appendChat(text, who = "bot") {
    const el = document.createElement("div");
    el.className = who === "bot" ? "bot-msg" : "user-msg";
    el.innerHTML = text; 
    chatWindow.appendChild(el);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ===============================================================
// --- 4. INITIALIZATION & EVENT LISTENERS (Improved Location Logic) ---
// ===============================================================

function detectLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { 
            return reject(new Error("Geolocation is not supported by this browser")); 
        }
        
        // Improved accuracy options
        const options = {
            enableHighAccuracy: true, 
            timeout: 7000,           // Increased timeout slightly for better results
            maximumAge: 0            
        };

        navigator.geolocation.getCurrentPosition(
            pos => resolve(pos.coords), 
            (error) => {
                let errorMessage = "Location permission denied. Please allow access to detect your location.";
                if (error.code === error.TIMEOUT) {
                    errorMessage = "Location detection timed out (7s). Try checking permissions or searching manually.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = "Location signal unavailable. Try moving to an open area.";
                }
                reject(new Error(errorMessage));
            },
            options 
        );
    });
}

async function handleLocationDetection() {
    try {
        const coords = await detectLocation();
        
        const accuracy = coords.accuracy; 
        
        let adviceMessage = "";
        if (accuracy > 5000) { 
            adviceMessage = `Location detected (Accuracy: ${Math.round(accuracy)}m). Accuracy is low, results may be approximate. Fetching data...`;
        } else {
            adviceMessage = `Location detected (Accuracy: ${Math.round(accuracy)}m). Fetching weather...`;
        }

        adviceEl.textContent = adviceMessage; 

        await fetchByCoords(coords.latitude, coords.longitude);
        
    } catch (error) {
        console.error(error);
        adviceEl.textContent = error.message;
        const userTheme = localStorage.getItem('userTheme') || 'dark';
        document.body.className = userTheme; 
    }
}

// Event Listeners
searchBtn.addEventListener("click", () => fetchByCity(cityInput.value.trim()));
cityInput.addEventListener("keydown", e => { if (e.key === "Enter") fetchByCity(cityInput.value.trim()); });
chatSend.addEventListener("click", handleChatSend);
chatInput.addEventListener("keydown", e => { if (e.key === "Enter") handleChatSend(); });
locBtn.addEventListener("click", handleLocationDetection);
themeToggleBtn.addEventListener("click", toggleTheme); 

// Initial Load: Set theme and fetch location
window.addEventListener("load", () => {
    const initialTheme = localStorage.getItem('userTheme') || 'dark';
    document.body.className = initialTheme;
    handleLocationDetection();
});