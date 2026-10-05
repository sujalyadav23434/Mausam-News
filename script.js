const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

const cityName = document.getElementById("cityName");
const countryName = document.getElementById("countryName");
const temperature = document.getElementById("temperature");
const weatherText = document.getElementById("weatherText");
const weatherIcon = document.getElementById("weatherIcon");

const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const rainChance = document.getElementById("rainChance");

const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");

const forecastContainer =
    document.getElementById("forecastContainer");

const newsContainer =
    document.getElementById("newsContainer");

const errorMessage =
    document.getElementById("errorMessage");


const weatherCodes = {
    0: ["Clear Sky", "☀️"],
    1: ["Mainly Clear", "🌤️"],
    2: ["Partly Cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Fog", "🌫️"],
    51: ["Light Drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy Drizzle", "🌧️"],
    61: ["Light Rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy Rain", "🌧️"],
    71: ["Light Snow", "🌨️"],
    73: ["Snow", "❄️"],
    75: ["Heavy Snow", "❄️"],
    80: ["Rain Showers", "🌦️"],
    81: ["Rain Showers", "🌧️"],
    82: ["Heavy Rain Showers", "🌧️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm", "⛈️"],
    99: ["Heavy Thunderstorm", "⛈️"]
};


searchBtn.addEventListener("click", function() {

    const city = searchInput.value.trim();

    if (city !== "") {
        searchCity(city);
    }

});


searchInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        const city = searchInput.value.trim();

        if (city !== "") {
            searchCity(city);
        }

    }

});


locationBtn.addEventListener("click", function() {

    if (!navigator.geolocation) {

        showError(
            "Your browser does not support location."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        async function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            try {

                const response = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`
                );


                const data =
                    await response.json();


                let placeName = "Your Location";
                let country = "";


                if (
                    data.results &&
                    data.results.length > 0
                ) {

                    placeName =
                        data.results[0].name;

                    country =
                        data.results[0].country || "";

                }


                await getWeather(
                    latitude,
                    longitude,
                    placeName,
                    country
                );


                await getNews(placeName);


            } catch (error) {

                console.error(error);

                await getWeather(
                    latitude,
                    longitude,
                    "Your Location",
                    ""
                );

            }

        },

        function() {

            showError(
                "Please allow location access."
            );

        }

    );

});


async function searchCity(city) {

    hideError();


    try {

        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );


        if (!response.ok) {

            throw new Error(
                "Location search failed"
            );

        }


        const data =
            await response.json();


        if (!data.results ||
            data.results.length === 0
        ) {

            showError(
                "We couldn't find that location. Try another city."
            );

            return;

        }


        const place =
            data.results[0];


        await getWeather(
            place.latitude,
            place.longitude,
            place.name,
            place.country || ""
        );


        await getNews(place.name);


    } catch (error) {

        console.error(error);

        showError(
            "Unable to find this location."
        );

    }

}


async function getWeather(
    latitude,
    longitude,
    placeName,
    country
) {

    try {

        const url =
            `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
            `&timezone=auto` +
            `&forecast_days=7`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Weather API failed"
            );

        }


        const data =
            await response.json();


        console.log(
            "Weather API Data:",
            data
        );


        displayWeather(
            data,
            placeName,
            country
        );


    } catch (error) {

        console.error(
            "Weather Error:",
            error
        );


        showError(
            "Unable to load weather data."
        );

    }

}


function displayWeather(
    data,
    placeName,
    country
) {

    const current =
        data.current;

    const daily =
        data.daily;


    cityName.textContent =
        placeName;


    countryName.textContent =
        country;


    const currentWeather =
        weatherCodes[current.weather_code] || ["Unknown", "🌤️"];


    temperature.textContent =
        `${Math.round(current.temperature_2m)}°C`;


    weatherText.textContent =
        currentWeather[0];


    weatherIcon.textContent =
        currentWeather[1];


    feelsLike.textContent =
        `${Math.round(current.apparent_temperature)}°C`;


    humidity.textContent =
        `${current.relative_humidity_2m}%`;


    wind.textContent =
        `${Math.round(current.wind_speed_10m)} km/h`;


    if (
        daily.precipitation_probability_max &&
        daily.precipitation_probability_max.length > 0
    ) {

        rainChance.textContent =
            `${daily.precipitation_probability_max[0]}%`;

    } else {

        rainChance.textContent =
            "0%";

    }


    if (
        daily.sunrise &&
        daily.sunrise.length > 0
    ) {

        sunrise.textContent =
            formatTime(
                daily.sunrise[0]
            );

    } else {

        sunrise.textContent =
            "--";

    }


    if (
        daily.sunset &&
        daily.sunset.length > 0
    ) {

        sunset.textContent =
            formatTime(
                daily.sunset[0]
            );

    } else {

        sunset.textContent =
            "--";

    }


    displayForecast(daily);

}


function displayForecast(daily) {

    forecastContainer.innerHTML = "";


    if (!daily ||
        !daily.time
    ) {

        forecastContainer.innerHTML = `
            <div class="loading">
                Forecast data not available.
            </div>
        `;

        return;

    }


    for (
        let i = 0; i < daily.time.length; i++
    ) {

        const weather =
            weatherCodes[daily.weather_code[i]] || ["Unknown", "🌤️"];


        const date =
            new Date(
                daily.time[i] +
                "T12:00:00"
            );


        const dayName =
            date.toLocaleDateString(
                "en-US", {
                    weekday: "short"
                }
            );


        const maxTemp =
            Math.round(
                daily.temperature_2m_max[i]
            );


        const minTemp =
            Math.round(
                daily.temperature_2m_min[i]
            );


        const rain =
            daily.precipitation_probability_max[i] || 0;


        const card =
            document.createElement("div");


        card.className =
            "forecast-card";


        card.innerHTML = `
            <h4>
                ${i === 0 ? "Today" : dayName}
            </h4>

            <div class="forecast-icon">
                ${weather[1]}
            </div>

            <p>
                ${weather[0]}
            </p>

            <strong>
                ${maxTemp}°
            </strong>

            <span>
                ${minTemp}°
            </span>

            <small>
                💧 ${rain}%
            </small>
        `;


        forecastContainer.appendChild(
            card
        );

    }

}


async function getNews(city) {

    newsContainer.innerHTML = `
        <div class="loading">
            Loading latest news...
        </div>
    `;


    try {

        const url =
            `https://freenewsapi.ai/v1/search?q=${encodeURIComponent(city)}&size=6&lang=en`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "News API request failed"
            );

        }


        const data =
            await response.json();


        console.log(
            "News API Response:",
            data
        );


        if (!data.results ||
            data.results.length === 0
        ) {

            newsContainer.innerHTML = `
                <div class="news-empty">
                    No recent news found for ${city}.
                </div>
            `;

            return;

        }


        newsContainer.innerHTML = "";


        data.results.forEach(
            function(article) {

                const card =
                    document.createElement("div");


                card.className =
                    "news-card";


                const publisher =
                    article.sitename ||
                    article.host ||
                    "News";


                const description =
                    article.description ||
                    `Latest news about ${city}`;


                const title =
                    article.title ||
                    "Latest News";


                const url =
                    article.url ||
                    "#";


                card.innerHTML = `
                    <div class="news-content">

                        <span>
                            ${publisher}
                        </span>

                        <h3>
                            ${title}
                        </h3>

                        <p>
                            ${description}
                        </p>

                        <a
                            href="${url}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Read More →
                        </a>

                    </div>
                `;


                newsContainer.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "News Error:",
            error
        );


        newsContainer.innerHTML = `
            <div class="news-empty">
                Unable to load latest news.
            </div>
        `;

    }

}


function formatTime(time) {

    if (!time) {
        return "--";
    }


    const date =
        new Date(time);


    return date.toLocaleTimeString(
        "en-US", {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function showError(message) {

    errorMessage.textContent =
        message;


    errorMessage.style.display =
        "block";

}


function hideError() {

    errorMessage.style.display =
        "none";

}


searchCity("Pune");