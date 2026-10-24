#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Starting ScoutAI 2.0 Monorepo in Development Mode"
echo "=========================================================="

# Create local uploads directory if not present
mkdir -p uploads

# Start FastAPI backend in background
echo "Starting FastAPI Backend on port 8000..."
cd services/api
if [ -d "../../.venv" ]; then
    ../../.venv/bin/uvicorn app.main:app --reload --port 8000 &
else
    uvicorn app.main:app --reload --port 8000 &
fi
API_PID=$!
cd ../..

# Start Next.js frontend
echo "Starting Next.js 15 Frontend on port 3000..."
npm --workspace=apps/web run dev &
WEB_PID=$!

trap "kill $API_PID $WEB_PID" EXIT
wait
