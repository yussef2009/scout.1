Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting ScoutAI 2.0 Monorepo in Development Mode (Windows)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Create local uploads folder
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
}

$venvPython = ".\.venv\Scripts\python.exe"

# Start FastAPI backend process
Write-Host "Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
$apiProcess = Start-Process -FilePath $venvPython -ArgumentList "-m uvicorn app.main:app --reload --port 8000" -WorkingDirectory "services/api" -PassThru

# Start Next.js frontend process
Write-Host "Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Green
$webProcess = Start-Process -FilePath "npm" -ArgumentList "--workspace=apps/web run dev" -PassThru

Write-Host "Both services are running! Press Ctrl+C to terminate." -ForegroundColor Yellow

try {
    Wait-Process -Id $apiProcess.Id, $webProcess.Id
} finally {
    Stop-Process -Id $apiProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $webProcess.Id -ErrorAction SilentlyContinue
}
