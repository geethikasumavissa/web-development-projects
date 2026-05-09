const countries = [
    { name: "India", region: "Asia", lat: 20.5937, lng: 78.9629, population: 1428627663, density: 481, growth: 0.81 },
    { name: "China", region: "Asia", lat: 35.8617, lng: 104.1954, population: 1425671352, density: 152, growth: -0.02 },
    { name: "United States", region: "North America", lat: 37.0902, lng: -95.7129, population: 339996563, density: 37, growth: 0.50 },
    { name: "Indonesia", region: "Asia", lat: -0.7893, lng: 113.9213, population: 277534122, density: 153, growth: 0.74 },
    { name: "Pakistan", region: "Asia", lat: 30.3753, lng: 69.3451, population: 240485658, density: 312, growth: 1.98 },
    { name: "Nigeria", region: "Africa", lat: 9.082, lng: 8.6753, population: 223804632, density: 246, growth: 2.41 },
    { name: "Brazil", region: "South America", lat: -14.235, lng: -51.9253, population: 216422446, density: 26, growth: 0.52 },
    { name: "Bangladesh", region: "Asia", lat: 23.685, lng: 90.3563, population: 172954319, density: 1329, growth: 1.03 },
    { name: "Russia", region: "Europe", lat: 61.524, lng: 105.3188, population: 144444359, density: 9, growth: -0.19 },
    { name: "Mexico", region: "North America", lat: 23.6345, lng: -102.5528, population: 128455567, density: 66, growth: 0.75 },
    { name: "Japan", region: "Asia", lat: 36.2048, lng: 138.2529, population: 123294513, density: 338, growth: -0.53 },
    { name: "Ethiopia", region: "Africa", lat: 9.145, lng: 40.4897, population: 126527060, density: 115, growth: 2.55 },
    { name: "Philippines", region: "Asia", lat: 12.8797, lng: 121.774, population: 117337368, density: 394, growth: 1.54 },
    { name: "Egypt", region: "Africa", lat: 26.8206, lng: 30.8025, population: 112716598, density: 113, growth: 1.56 },
    { name: "Germany", region: "Europe", lat: 51.1657, lng: 10.4515, population: 83294633, density: 238, growth: -0.09 },
    { name: "United Kingdom", region: "Europe", lat: 55.3781, lng: -3.436, population: 67736802, density: 280, growth: 0.34 },
    { name: "France", region: "Europe", lat: 46.2276, lng: 2.2137, population: 64756584, density: 118, growth: 0.20 },
    { name: "South Africa", region: "Africa", lat: -30.5595, lng: 22.9375, population: 60414495, density: 50, growth: 0.87 },
    { name: "Colombia", region: "South America", lat: 4.5709, lng: -74.2973, population: 52085168, density: 47, growth: 0.41 },
    { name: "Argentina", region: "South America", lat: -38.4161, lng: -63.6167, population: 45773884, density: 17, growth: 0.58 },
    { name: "Canada", region: "North America", lat: 56.1304, lng: -106.3468, population: 38781291, density: 4, growth: 0.85 },
    { name: "Australia", region: "Oceania", lat: -25.2744, lng: 133.7751, population: 26439111, density: 3, growth: 1.00 },
];

const regionFilter = document.getElementById("region-filter");
const countryList = document.getElementById("country-list");
const totalPopulation = document.getElementById("total-population");
const countryCount = document.getElementById("country-count");
const highestDensity = document.getElementById("highest-density");

const formatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
});

const map = L.map("map", {
    worldCopyJump: true,
    minZoom: 2,
}).setView([22, 12], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 7,
    attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let markerLayer = L.layerGroup().addTo(map);
let markersByCountry = new Map();

function getMarkerSize(population) {
    if (population > 500000000) {
        return 54;
    }

    if (population > 100000000) {
        return 40;
    }

    return 28;
}

function getPopulationLabel(population) {
    return compactFormatter.format(population).replace("B", "B").replace("M", "M");
}

function getFilteredCountries() {
    const selectedRegion = regionFilter.value;
    return selectedRegion === "all"
        ? [...countries]
        : countries.filter((country) => country.region === selectedRegion);
}

function createPopup(country) {
    return `
        <h3 class="popup-title">${country.name}</h3>
        <dl class="popup-data">
            <div><dt>Region</dt><dd>${country.region}</dd></div>
            <div><dt>Population</dt><dd>${formatter.format(country.population)}</dd></div>
            <div><dt>Density</dt><dd>${formatter.format(country.density)}/km2</dd></div>
            <div><dt>Growth</dt><dd>${country.growth}%</dd></div>
        </dl>
    `;
}

function renderMarkers(data) {
    markerLayer.clearLayers();
    markersByCountry = new Map();

    data.forEach((country) => {
        const size = getMarkerSize(country.population);
        const marker = L.marker([country.lat, country.lng], {
            icon: L.divIcon({
                className: "",
                html: `<div class="population-marker" style="width:${size}px;height:${size}px">${getPopulationLabel(country.population)}</div>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
                popupAnchor: [0, -size / 2],
            }),
        }).bindPopup(createPopup(country));

        marker.addTo(markerLayer);
        markersByCountry.set(country.name, marker);
    });
}

function updateStats(data) {
    const total = data.reduce((value, country) => value + country.population, 0);
    const densest = data.reduce((current, country) => {
        return country.density > current.density ? country : current;
    }, data[0]);

    totalPopulation.textContent = compactFormatter.format(total);
    countryCount.textContent = data.length;
    highestDensity.textContent = densest ? densest.name : "-";
}

function renderCountryList(data) {
    countryList.innerHTML = "";

    data
        .slice()
        .sort((a, b) => b.population - a.population)
        .forEach((country) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "country-item";
            item.innerHTML = `
                <strong>${country.name}</strong>
                <span>${compactFormatter.format(country.population)} people • ${country.region}</span>
            `;

            item.addEventListener("click", () => {
                document.querySelectorAll(".country-item").forEach((button) => {
                    button.classList.remove("active");
                });
                item.classList.add("active");
                focusCountry(country);
            });

            countryList.appendChild(item);
        });
}

function focusCountry(country) {
    const marker = markersByCountry.get(country.name);

    map.flyTo([country.lat, country.lng], 4, {
        duration: 0.8,
    });

    setTimeout(() => {
        marker?.openPopup();
    }, 500);
}

function fitToData(data) {
    if (!data.length) {
        map.setView([22, 12], 2);
        return;
    }

    const bounds = L.latLngBounds(data.map((country) => [country.lat, country.lng]));
    map.fitBounds(bounds.pad(0.18), {
        maxZoom: 4,
    });
}

function updateMap() {
    const data = getFilteredCountries();

    renderMarkers(data);
    updateStats(data);
    renderCountryList(data);
    fitToData(data);
}

regionFilter.addEventListener("change", updateMap);

updateMap();
