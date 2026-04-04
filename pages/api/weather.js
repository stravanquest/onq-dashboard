export default function handler(req, res) {
  // Free weather API (Open-Meteo - no API key required)
  // Default: New York (Chris's timezone)
  
  const lat = 40.7128;
  const lon = -74.0060;
  
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
    .then(r => r.json())
    .then(data => {
      const weather = {
        temp: data.current_weather.temperature,
        windspeed: data.current_weather.windspeed,
        condition: getWeatherCondition(data.current_weather.weathercode),
        location: 'New York, NY'
      };
      res.status(200).json(weather);
    })
    .catch(error => {
      res.status(500).json({ error: 'Weather fetch failed' });
    });
}

function getWeatherCondition(code) {
  const conditions = {
    0: 'Clear sky ☀️',
    1: 'Mainly clear 🌤️',
    2: 'Partly cloudy ⛅',
    3: 'Overcast ☁️',
    45: 'Fog 🌫️',
    48: 'Depositing rime fog 🌫️',
    51: 'Light drizzle 🌦️',
    53: 'Moderate drizzle 🌦️',
    55: 'Dense drizzle 🌦️',
    61: 'Slight rain 🌧️',
    63: 'Moderate rain 🌧️',
    65: 'Heavy rain 🌧️',
    71: 'Slight snow ❄️',
    73: 'Moderate snow ❄️',
    75: 'Heavy snow ❄️',
    95: 'Thunderstorm ⛈️',
  };
  return conditions[code] || 'Unknown';
}
