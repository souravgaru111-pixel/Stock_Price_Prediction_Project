# Stock Price Prediction

A beginner-friendly stock price prediction web app built with FastAPI, yfinance, TensorFlow/Keras, and Chart.js.

## Features

- Search stock symbols such as `AAPL`, `MSFT`, `TCS.NS`, and `RELIANCE.NS`
- Fetch recent market data with yfinance
- Predict the next closing price with a saved LSTM model
- Compare actual and predicted close prices on a Chart.js line graph
- View the last 30 trading days in a responsive table

## Run Locally

```bash
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000
```

## Deploy On Render

1. Push this project to a GitHub repository.
2. Go to Render and create a new Web Service from the repository.
3. Render can read `render.yaml` automatically.
4. Use these settings if entering them manually:

```text
Build Command: python -m pip install --upgrade pip && pip install -r requirements.txt
Start Command: python -m uvicorn main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

The app uses `.python-version` to request Python `3.11.9`.
