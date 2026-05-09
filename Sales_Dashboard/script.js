const state = {
    data: null,
    charts: {},
    page: 1,
    pageSize: 5,
    search: "",
    region: "all",
    category: "all",
    sortKey: "revenue",
    sortDirection: "desc",
    notificationCursor: 0,
};

const elements = {
    loader: document.getElementById("loader"),
    summaryGrid: document.getElementById("overview"),
    globalSearch: document.getElementById("globalSearch"),
    regionFilter: document.getElementById("regionFilter"),
    categoryFilter: document.getElementById("categoryFilter"),
    pageSize: document.getElementById("pageSize"),
    productsBody: document.getElementById("productsBody"),
    tableSummary: document.getElementById("tableSummary"),
    pageInfo: document.getElementById("pageInfo"),
    prevPage: document.getElementById("prevPage"),
    nextPage: document.getElementById("nextPage"),
    themeToggle: document.getElementById("themeToggle"),
    downloadCsv: document.getElementById("downloadCsv"),
    menuButton: document.getElementById("menuButton"),
    notificationsList: document.getElementById("notificationsList"),
    notificationCount: document.getElementById("notificationCount"),
};

const palette = ["#2563eb", "#0891b2", "#059669", "#d97706", "#e11d48", "#7c3aed"];
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compactMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 });

// Loads local JSON data and prepares every interactive dashboard feature.
async function initDashboard() {
    try {
        const response = await fetch("data.json");
        if (!response.ok) {
            throw new Error("Could not load data.json");
        }

        state.data = await response.json();
        setupFilters();
        bindEvents();
        renderDashboard();
        startNotificationStream();
    } catch (error) {
        elements.loader.innerHTML = `<strong>${error.message}</strong>`;
        console.error(error);
    } finally {
        setTimeout(() => elements.loader.classList.add("hidden"), 450);
    }
}

function setupFilters() {
    const regions = [...new Set(state.data.products.map((product) => product.region))].sort();
    const categories = [...new Set(state.data.products.map((product) => product.category))].sort();

    appendOptions(elements.regionFilter, regions);
    appendOptions(elements.categoryFilter, categories);
}

function appendOptions(select, values) {
    values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

// Registers search, filter, table sorting, pagination, theme, export, and navigation events.
function bindEvents() {
    elements.globalSearch.addEventListener("input", () => {
        state.search = elements.globalSearch.value.trim().toLowerCase();
        state.page = 1;
        renderProductsTable();
    });

    elements.regionFilter.addEventListener("change", () => {
        state.region = elements.regionFilter.value;
        state.page = 1;
        renderDashboard();
    });

    elements.categoryFilter.addEventListener("change", () => {
        state.category = elements.categoryFilter.value;
        state.page = 1;
        renderProductsTable();
    });

    elements.pageSize.addEventListener("change", () => {
        state.pageSize = Number(elements.pageSize.value);
        state.page = 1;
        renderProductsTable();
    });

    document.querySelectorAll(".sort-button").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.sort;
            state.sortDirection = state.sortKey === key && state.sortDirection === "desc" ? "asc" : "desc";
            state.sortKey = key;
            state.page = 1;
            renderProductsTable();
        });
    });

    elements.prevPage.addEventListener("click", () => {
        state.page = Math.max(1, state.page - 1);
        renderProductsTable();
    });

    elements.nextPage.addEventListener("click", () => {
        state.page += 1;
        renderProductsTable();
    });

    elements.themeToggle.addEventListener("click", toggleTheme);
    elements.downloadCsv.addEventListener("click", downloadCsvReport);
    elements.menuButton.addEventListener("click", () => document.body.classList.toggle("nav-open"));

    document.querySelectorAll(".nav-menu a").forEach((link) => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".nav-menu a").forEach((item) => item.classList.remove("active"));
            link.classList.add("active");
            document.body.classList.remove("nav-open");
        });
    });
}

function renderDashboard() {
    renderSummaryCards();
    renderCharts();
    renderProductsTable();
    renderIcons();
}

function getRegionProducts() {
    return state.data.products.filter((product) => state.region === "all" || product.region === state.region);
}

function getSummary() {
    const products = getRegionProducts();
    const revenue = products.reduce((total, product) => total + product.revenue, 0);
    const orders = products.reduce((total, product) => total + product.orders, 0);
    const avgConversion = products.reduce((total, product) => total + product.conversion, 0) / products.length;
    const avgGrowth = products.reduce((total, product) => total + product.growth, 0) / products.length;

    return { revenue, orders, avgConversion, avgGrowth };
}

function renderSummaryCards() {
    const summary = getSummary();
    const cards = [
        { label: "Total Revenue", value: summary.revenue, formatter: compactMoney.format, color: "blue", note: "+18.4% blended sales lift" },
        { label: "Orders", value: summary.orders, formatter: (value) => Math.round(value).toLocaleString("en-US"), color: "green", note: "Cross-channel order volume" },
        { label: "Avg. Conversion", value: summary.avgConversion, formatter: (value) => `${value.toFixed(1)}%`, color: "amber", note: "Weighted product performance" },
        { label: "Avg. Growth", value: summary.avgGrowth, formatter: (value) => `${value.toFixed(1)}%`, color: "violet", note: "Month-over-month trend" },
    ];

    elements.summaryGrid.innerHTML = cards.map((card, index) => `
        <article class="summary-card ${card.color}" style="animation-delay: ${index * 70}ms">
            <span>${card.label}</span>
            <strong data-counter="${card.value}" data-format="${index}">0</strong>
            <p>${card.note}</p>
        </article>
    `).join("");

    elements.summaryGrid.querySelectorAll("[data-counter]").forEach((counter, index) => {
        animateCounter(counter, cards[index].value, cards[index].formatter);
    });
}

function animateCounter(element, endValue, formatter) {
    const start = performance.now();
    const duration = 850;

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = formatter(endValue * eased);

        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    }

    requestAnimationFrame(tick);
}

function chartBaseOptions(extra = {}) {
    const textColor = getCss("--muted");
    const gridColor = getCss("--line");

    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: "easeOutQuart" },
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    boxWidth: 12,
                    font: { weight: "700" },
                },
            },
            tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                padding: 12,
                titleFont: { weight: "800" },
            },
        },
        scales: {
            x: { ticks: { color: textColor }, grid: { display: false } },
            y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
        },
        ...extra,
    };
}

function destroyCharts() {
    Object.values(state.charts).forEach((chart) => chart.destroy());
    state.charts = {};
}

// Builds Bar, Pie, Line, Doughnut, and Area charts with Chart.js from local JSON data.
function renderCharts() {
    destroyCharts();

    const charts = state.data.charts;
    const salesByCategory = aggregateBy(getRegionProducts(), "category", "revenue");

    state.charts.salesBar = new Chart(document.getElementById("salesBarChart"), {
        type: "bar",
        data: {
            labels: salesByCategory.labels,
            datasets: [{
                label: "Sales Revenue",
                data: salesByCategory.values,
                backgroundColor: palette,
                borderRadius: 8,
            }],
        },
        options: chartBaseOptions({
            plugins: { legend: { display: false } },
            scales: currencyScale(),
            onClick: (_, points) => {
                if (!points.length) return;
                const label = salesByCategory.labels[points[0].index];
                addNotification({
                    title: `${label} bar selected`,
                    message: `${label} generated ${money.format(salesByCategory.values[points[0].index])}.`,
                    time: "Just now",
                    icon: "bar-chart-3",
                });
            },
        }),
    });

    state.charts.revenueLine = new Chart(document.getElementById("revenueLineChart"), {
        type: "line",
        data: {
            labels: charts.monthlyRevenue.map((item) => item.month),
            datasets: [{
                label: "Revenue",
                data: charts.monthlyRevenue.map((item) => item.revenue),
                borderColor: palette[0],
                backgroundColor: "rgba(37, 99, 235, 0.12)",
                tension: 0.38,
                pointRadius: 4,
                borderWidth: 3,
            }],
        },
        options: chartBaseOptions({ plugins: { legend: { display: false } }, scales: currencyScale() }),
    });

    state.charts.userArea = new Chart(document.getElementById("userAreaChart"), {
        type: "line",
        data: {
            labels: charts.userGrowth.map((item) => item.month),
            datasets: [{
                label: "Active Users",
                data: charts.userGrowth.map((item) => item.users),
                borderColor: palette[2],
                backgroundColor: "rgba(5, 150, 105, 0.18)",
                fill: true,
                tension: 0.42,
                pointRadius: 3,
                borderWidth: 3,
            }],
        },
        options: chartBaseOptions({ plugins: { legend: { display: false } } }),
    });

    state.charts.segmentPie = new Chart(document.getElementById("segmentPieChart"), {
        type: "pie",
        data: {
            labels: charts.segments.map((item) => item.name),
            datasets: [{
                data: charts.segments.map((item) => item.value),
                backgroundColor: palette,
                borderColor: getCss("--panel-strong"),
                borderWidth: 3,
                hoverOffset: 16,
            }],
        },
        options: chartBaseOptions({
            scales: {},
            onClick: (_, points) => {
                if (!points.length) return;
                const item = charts.segments[points[0].index];
                addNotification({
                    title: `${item.name} segment opened`,
                    message: `${item.name} represents ${item.value}% of the customer mix.`,
                    time: "Just now",
                    icon: "pie-chart",
                });
            },
        }),
    });

    state.charts.channelDoughnut = new Chart(document.getElementById("channelDoughnutChart"), {
        type: "doughnut",
        data: {
            labels: charts.channels.map((item) => item.name),
            datasets: [{
                data: charts.channels.map((item) => item.value),
                backgroundColor: palette,
                borderColor: getCss("--panel-strong"),
                borderWidth: 3,
                hoverOffset: 12,
            }],
        },
        options: chartBaseOptions({ scales: {}, cutout: "62%" }),
    });
}

function currencyScale() {
    return {
        x: { ticks: { color: getCss("--muted") }, grid: { display: false } },
        y: {
            beginAtZero: true,
            ticks: {
                color: getCss("--muted"),
                callback: (value) => `$${Number(value / 1000).toLocaleString("en-US")}K`,
            },
            grid: { color: getCss("--line") },
        },
    };
}

function aggregateBy(items, labelKey, valueKey) {
    const map = new Map();

    items.forEach((item) => {
        map.set(item[labelKey], (map.get(item[labelKey]) || 0) + item[valueKey]);
    });

    return {
        labels: [...map.keys()],
        values: [...map.values()],
    };
}

function getFilteredProducts() {
    return state.data.products
        .filter((product) => state.region === "all" || product.region === state.region)
        .filter((product) => state.category === "all" || product.category === state.category)
        .filter((product) => {
            const haystack = `${product.name} ${product.category} ${product.region}`.toLowerCase();
            return haystack.includes(state.search);
        })
        .sort((a, b) => {
            const first = a[state.sortKey];
            const second = b[state.sortKey];
            const direction = state.sortDirection === "asc" ? 1 : -1;

            if (typeof first === "number") {
                return (first - second) * direction;
            }

            return String(first).localeCompare(String(second)) * direction;
        });
}

function renderProductsTable() {
    const products = getFilteredProducts();
    const totalPages = Math.max(1, Math.ceil(products.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);

    const start = (state.page - 1) * state.pageSize;
    const pageItems = products.slice(start, start + state.pageSize);

    elements.productsBody.innerHTML = pageItems.map((product) => `
        <tr>
            <td>
                <span class="product-cell">
                    <span class="product-icon"><i data-lucide="${product.icon}"></i></span>
                    ${product.name}
                </span>
            </td>
            <td>${product.category}</td>
            <td>${product.region}</td>
            <td>${money.format(product.revenue)}</td>
            <td><span class="${product.growth >= 0 ? "trend-up" : "trend-down"}">${product.growth}%</span></td>
            <td>${product.conversion}%</td>
        </tr>
    `).join("");

    elements.tableSummary.textContent = `${products.length} products matched`;
    elements.pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
    elements.prevPage.disabled = state.page === 1;
    elements.nextPage.disabled = state.page === totalPages;
    renderIcons();
}

// Downloads the currently searched and filtered product table as a CSV report.
function downloadCsvReport() {
    const rows = getFilteredProducts();
    const headers = ["Product", "Category", "Region", "Revenue", "Orders", "Growth", "Conversion"];
    const csv = [
        headers.join(","),
        ...rows.map((product) => [
            product.name,
            product.category,
            product.region,
            product.revenue,
            product.orders,
            `${product.growth}%`,
            `${product.conversion}%`,
        ].map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "apex-analytics-report.csv";
    link.click();
    URL.revokeObjectURL(url);
}

function escapeCsv(value) {
    const text = String(value);
    return text.includes(",") || text.includes('"') ? `"${text.replaceAll('"', '""')}"` : text;
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    elements.themeToggle.innerHTML = document.body.classList.contains("dark")
        ? '<i data-lucide="sun"></i>'
        : '<i data-lucide="moon"></i>';
    renderCharts();
    renderIcons();
}

// Simulates real-time events by cycling through local notification data.
function startNotificationStream() {
    state.data.notifications.slice(0, 4).forEach(addNotification);
    state.notificationCursor = 4;

    setInterval(() => {
        const notification = state.data.notifications[state.notificationCursor % state.data.notifications.length];
        addNotification({ ...notification, time: "Just now" });
        state.notificationCursor += 1;
    }, 7000);
}

function addNotification(notification) {
    const item = document.createElement("article");
    item.className = "notification";
    item.innerHTML = `
        <span class="notification-icon"><i data-lucide="${notification.icon}"></i></span>
        <div>
            <strong>${notification.title}</strong>
            <p>${notification.message}</p>
            <small>${notification.time}</small>
        </div>
    `;

    elements.notificationsList.prepend(item);

    while (elements.notificationsList.children.length > 7) {
        elements.notificationsList.lastElementChild.remove();
    }

    elements.notificationCount.textContent = elements.notificationsList.children.length;
    renderIcons();
}

function getCss(variableName) {
    return getComputedStyle(document.body).getPropertyValue(variableName).trim();
}

function renderIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

initDashboard();
