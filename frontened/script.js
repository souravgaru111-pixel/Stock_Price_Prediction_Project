const form = document.getElementById("predictionForm");
const stockInput = document.getElementById("stockInput");
const predictButton = document.getElementById("predictButton");
const clearButton = document.getElementById("clearButton");
const statusMessage = document.getElementById("statusMessage");
const resultPanel = document.getElementById("result");
const defaultStatus = "Enter a ticker symbol to generate a forecast.";

const numberFormat = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
});

const volumeFormat = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
});

form.addEventListener("submit", (event) => {
    event.preventDefault();
    getPrediction();
});

clearButton.addEventListener("click", clearPrediction);

stockInput.addEventListener("input", () => {
    if (statusMessage.classList.contains("error")) {
        setStatus(defaultStatus);
    }
});

async function getPrediction() {
    const stock = stockInput.value.trim().toUpperCase();

    if (!stock) {
        setStatus("Enter a stock symbol to continue.", true);
        stockInput.focus();
        return;
    }

    setLoading(true);
    setStatus(`Fetching recent market data for ${stock}...`);

    try {
        const res = await fetch(`/predict?stock=${encodeURIComponent(stock)}`);
        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error || "Prediction request failed.");
        }

        renderPrediction(stock, data);
        setStatus(`Updated ${stock} prediction successfully.`);
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        setLoading(false);
    }
}

function renderPrediction(stock, data) {
    resultPanel.classList.remove("hidden");

    const latestIndex = data.close.length - 1;
    const latestClose = Number(data.close[latestIndex]);
    const low = Math.min(...data.low.map(Number));
    const high = Math.max(...data.high.map(Number));

    document.getElementById("nextPrice").innerText = formatPrice(data.next_day_prediction);
    document.getElementById("symbolLabel").innerText = stock;
    document.getElementById("nextDateLabel").innerText = `Forecast date: ${data.next_prediction_date || "Next trading day"}`;
    document.getElementById("latestClose").innerText = formatPrice(latestClose);
    document.getElementById("latestDate").innerText = data.dates[latestIndex] || "--";
    document.getElementById("rangeValue").innerText = `${formatPrice(low)} - ${formatPrice(high)}`;

    renderTable(data);
    renderChart(data);
}

function clearPrediction() {
    stockInput.value = "";
    resultPanel.classList.add("hidden");
    document.getElementById("nextPrice").innerText = "--";
    document.getElementById("symbolLabel").innerText = "--";
    document.getElementById("nextDateLabel").innerText = "--";
    document.getElementById("latestClose").innerText = "--";
    document.getElementById("latestDate").innerText = "--";
    document.getElementById("rangeValue").innerText = "--";
    document.querySelector("#dataTable tbody").innerHTML = "";

    if (window.stockChart) {
        window.stockChart.destroy();
        window.stockChart = null;
    }

    setStatus(defaultStatus);
    stockInput.focus();
}

function renderTable(data) {
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    data.dates.forEach((date, index) => {
        const row = document.createElement("tr");
        const cells = [
            date,
            formatPrice(data.open[index]),
            formatPrice(data.high[index]),
            formatPrice(data.low[index]),
            formatPrice(data.close[index]),
            volumeFormat.format(data.volume[index])
        ];

        cells.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

function renderChart(data) {
    const ctx = document.getElementById("lineChart").getContext("2d");
    const nextDate = data.next_prediction_date || "Next day";
    const labels = [...data.dates, nextDate];
    const actualClose = [...data.close, null];
    const predictedClose = data.predicted_close || [];
    const projection = [...predictedClose, data.next_day_prediction];

    if (window.stockChart) {
        window.stockChart.destroy();
    }

    window.stockChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Actual close",
                    data: actualClose,
                    borderColor: "#246bfe",
                    backgroundColor: "rgba(36, 107, 254, 0.08)",
                    borderWidth: 3,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    tension: 0.35,
                    fill: true
                },
                {
                    label: "Predicted close",
                    data: projection,
                    borderColor: "#d97706",
                    backgroundColor: "#d97706",
                    borderWidth: 3,
                    borderDash: [7, 6],
                    pointRadius: (context) => context.dataIndex >= data.close.length - 1 ? 5 : 2,
                    pointHoverRadius: 7,
                    tension: 0.35,
                    fill: false,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: "index"
            },
            plugins: {
                legend: {
                    labels: {
                        color: "#344054",
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatPrice(context.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "#667085",
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: "#edf1f7"
                    },
                    ticks: {
                        color: "#667085",
                        callback: (value) => formatPrice(value)
                    }
                }
            }
        }
    });
}

function formatPrice(value) {
    return numberFormat.format(Number(value));
}

function setStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", isError);
}

function setLoading(isLoading) {
    predictButton.disabled = isLoading;
    clearButton.disabled = isLoading;
    predictButton.textContent = isLoading ? "Loading..." : "Predict";
}
