# ==============================================================================
# SCOT AI — Microsoft Azure Container Apps Deployment Script (PowerShell)
# Provisions:
#   1. Azure CLI verification & auto-install guidance
#   2. Azure Resource Group (scot-ai-rg)
#   3. Azure Container Registry (ACR) & Cloud Container Build
#   4. Azure Container App Environment (scot-ai-env)
#   5. Azure Container App (scot-ai-api) with full secret injection
#   6. Custom Domain Binding (api.your-domain.tech) + Free Azure Managed SSL
# ==============================================================================

[CmdletBinding()]
param(
    [string]$ResourceGroup = "scot-ai-rg",
    [string]$Location = "eastus",
    [string]$EnvironmentName = "scot-ai-env",
    [string]$AppName = "scot-ai-api",
    [string]$CustomDomain = "api.your-domain.tech",
    [string]$AcrName = ""
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "    SCOT AI — AZURE CONTAINER APPS PRODUCTION DEPLOYMENT         " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Azure CLI Verification ─────────────────────────────────────────────────
$azCmd = Get-Command "az" -ErrorAction SilentlyContinue
if (-not $azCmd) {
    # Check default install path if not in current PATH yet
    $defaultAzPaths = @(
        "$env:ProgramFiles\Microsoft SDKs\Azure\CLI2\wbin\az.cmd",
        "${env:ProgramFiles(x86)}\Microsoft SDKs\Azure\CLI2\wbin\az.cmd",
        "$env:LOCALAPPDATA\Programs\Microsoft\Azure CLI\bin\az.cmd"
    )
    foreach ($p in $defaultAzPaths) {
        if (Test-Path $p) {
            $env:Path = [System.IO.Path]::GetDirectoryName($p) + ";" + $env:Path
            $azCmd = Get-Command "az" -ErrorAction SilentlyContinue
            break
        }
    }
}

if (-not $azCmd) {
    Write-Host "[WARNING] Azure CLI ('az') was not found in your system PATH." -ForegroundColor Yellow
    Write-Host "Installing Azure CLI via winget..." -ForegroundColor Yellow
    try {
        winget install -e --id Microsoft.AzureCLI --accept-source-agreements --accept-package-agreements
        Write-Host "[SUCCESS] Azure CLI installed. Refreshing PATH..." -ForegroundColor Green
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        $azCmd = Get-Command "az" -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "[ERROR] Could not install Azure CLI automatically." -ForegroundColor Red
        Write-Host "Please install it manually from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
        exit 1
    }
}

# ── 2. Authenticate to Azure ──────────────────────────────────────────────────
Write-Host "[INFO] Verifying active Azure session..." -ForegroundColor Cyan
$accountCheck = & az account show 2>$null
if (-not $accountCheck) {
    Write-Host "[INFO] Not logged in to Azure. Launching device-code login..." -ForegroundColor Yellow
    & az login --use-device-code
}

$currentSub = & az account show --query name -o tsv
Write-Host "[SUCCESS] Authenticated to Azure subscription: $currentSub" -ForegroundColor Green

# Ensure containerapp extension is installed
Write-Host "[INFO] Checking 'containerapp' Azure CLI extension..." -ForegroundColor Cyan
& az extension add --name containerapp --upgrade --yes 2>$null | Out-Null
& az provider register --namespace Microsoft.App --wait 2>$null | Out-Null
& az provider register --namespace Microsoft.OperationalInsights --wait 2>$null | Out-Null

# ── 3. Load Environment Configuration ─────────────────────────────────────────
$envFile = Join-Path $PSScriptRoot "ai_engine\.env"
if (Test-Path $envFile) {
    Write-Host "[INFO] Loading configuration from: $envFile" -ForegroundColor Cyan
    Get-Content $envFile | Where-Object { $_ -match '=' -and -not ($_ -match '^\s*#') } | ForEach-Object {
        $parts = $_ -split '=', 2
        $varName = $parts[0].Trim()
        $varValue = $parts[1].Trim().Trim('"').Trim("'")
        if (-not [string]::IsNullOrEmpty($varName) -and [string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($varName))) {
            [Environment]::SetEnvironmentVariable($varName, $varValue, "Process")
        }
    }
} else {
    Write-Host "[WARNING] No ai_engine\.env found. Using environment variable defaults." -ForegroundColor Yellow
}

$MongoUri = if ($env:MONGODB_URI) { $env:MONGODB_URI } else { "mongodb+srv://scot_user:scot_password@cluster0.mongodb.net/?retryWrites=true&w=majority" }
$MongoDbName = if ($env:MONGODB_DB_NAME) { $env:MONGODB_DB_NAME } else { "scot_ai_db" }
$AppwriteEndpoint = if ($env:APPWRITE_ENDPOINT) { $env:APPWRITE_ENDPOINT } else { "https://cloud.appwrite.io/v1" }
$AppwriteProjectId = if ($env:APPWRITE_PROJECT_ID) { $env:APPWRITE_PROJECT_ID } else { "scot-ai-production" }
$AppwriteApiKey = if ($env:APPWRITE_API_KEY) { $env:APPWRITE_API_KEY } else { "not-set" }
$AppwriteBucketId = if ($env:APPWRITE_BUCKET_ID) { $env:APPWRITE_BUCKET_ID } else { "scot-ai-matches" }
$ClerkSecretKey = if ($env:CLERK_SECRET_KEY) { $env:CLERK_SECRET_KEY } else { "not-set" }
$RoboflowKey = if ($env:ROBOFLOW_API_KEY) { $env:ROBOFLOW_API_KEY } else { "" }
$SentryDsn = if ($env:SENTRY_DSN) { $env:SENTRY_DSN } else { "not-set" }
$DdApiKey = if ($env:DD_API_KEY) { $env:DD_API_KEY } else { "not-set" }
$DdSite = if ($env:DD_SITE) { $env:DD_SITE } else { "datadoghq.com" }
$DdService = if ($env:DD_SERVICE) { $env:DD_SERVICE } else { "scot-ai-api" }
$DdEnv = if ($env:DD_ENV) { $env:DD_ENV } else { "production" }
$FrontendUrl = if ($env:FRONTEND_URL) { $env:FRONTEND_URL } else { "https://your-domain.tech" }

# ── 4. Resource Group Provisioning ────────────────────────────────────────────
Write-Host "[INFO] Checking Resource Group '$ResourceGroup' in '$Location'..." -ForegroundColor Cyan
$rgExists = & az group show --name $ResourceGroup 2>$null
if (-not $rgExists) {
    Write-Host "[INFO] Creating Resource Group '$ResourceGroup'..." -ForegroundColor Cyan
    & az group create --name $ResourceGroup --location $Location -o table
    Write-Host "[SUCCESS] Resource Group created." -ForegroundColor Green
} else {
    Write-Host "[INFO] Resource Group '$ResourceGroup' already exists." -ForegroundColor Cyan
}

# ── 5. Azure Container Registry (ACR) ─────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($AcrName)) {
    $randomSuffix = -join ((48..57) + (97..122) | Get-Random -Count 6 | ForEach-Object { [char]$_ })
    $AcrName = "scotaiacr$randomSuffix"
}

Write-Host "[INFO] Checking Azure Container Registry '$AcrName'..." -ForegroundColor Cyan
$acrExists = & az acr show --name $AcrName --resource-group $ResourceGroup 2>$null
if (-not $acrExists) {
    Write-Host "[INFO] Creating Azure Container Registry '$AcrName'..." -ForegroundColor Cyan
    & az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --admin-enabled true -o table
    Write-Host "[SUCCESS] Azure Container Registry created." -ForegroundColor Green
} else {
    Write-Host "[INFO] ACR '$AcrName' already exists." -ForegroundColor Cyan
}

$AcrLoginServer = & az acr show --name $AcrName --resource-group $ResourceGroup --query loginServer -o tsv
$AcrUsername = & az acr credential show --name $AcrName --query username -o tsv
$AcrPassword = & az acr credential show --name $AcrName --query "passwords[0].value" -o tsv

# ── 6. Cloud Container Image Build ────────────────────────────────────────────
$ImageTag = "$AcrLoginServer/${AppName}:latest"
$AiEngineDir = Join-Path $PSScriptRoot "ai_engine"
Write-Host "[INFO] Building container image via ACR Cloud Build: $ImageTag..." -ForegroundColor Cyan
& az acr build --registry $AcrName --image "${AppName}:latest" $AiEngineDir
Write-Host "[SUCCESS] Container image successfully built and stored in ACR!" -ForegroundColor Green

# ── 7. Azure Container App Environment ────────────────────────────────────────
Write-Host "[INFO] Checking Container App Environment '$EnvironmentName'..." -ForegroundColor Cyan
$envExists = & az containerapp env show --name $EnvironmentName --resource-group $ResourceGroup 2>$null
if (-not $envExists) {
    Write-Host "[INFO] Creating Container App Environment '$EnvironmentName'..." -ForegroundColor Cyan
    & az containerapp env create --name $EnvironmentName --resource-group $ResourceGroup --location $Location -o table
    Write-Host "[SUCCESS] Container App Environment created." -ForegroundColor Green
} else {
    Write-Host "[INFO] Container App Environment '$EnvironmentName' already exists." -ForegroundColor Cyan
}

# ── 8. Deploy Container App ───────────────────────────────────────────────────
Write-Host "[INFO] Deploying Container App '$AppName' with secrets & telemetry..." -ForegroundColor Cyan
& az containerapp create `
    --name $AppName `
    --resource-group $ResourceGroup `
    --environment $EnvironmentName `
    --image $ImageTag `
    --registry-server $AcrLoginServer `
    --registry-username $AcrUsername `
    --registry-password $AcrPassword `
    --target-port 8000 `
    --ingress external `
    --cpu 2.0 `
    --memory 4.0Gi `
    --min-replicas 1 `
    --max-replicas 5 `
    --secrets `
        mongodb-uri="$MongoUri" `
        appwrite-key="$AppwriteApiKey" `
        clerk-key="$ClerkSecretKey" `
        sentry-dsn="$SentryDsn" `
        dd-api-key="$DdApiKey" `
    --env-vars `
        ENV="production" `
        MONGODB_DB_NAME="$MongoDbName" `
        MONGODB_URI="secretref:mongodb-uri" `
        APPWRITE_ENDPOINT="$AppwriteEndpoint" `
        APPWRITE_PROJECT_ID="$AppwriteProjectId" `
        APPWRITE_BUCKET_ID="$AppwriteBucketId" `
        APPWRITE_API_KEY="secretref:appwrite-key" `
        CLERK_SECRET_KEY="secretref:clerk-key" `
        ROBOFLOW_API_KEY="$RoboflowKey" `
        SENTRY_DSN="secretref:sentry-dsn" `
        DD_API_KEY="secretref:dd-api-key" `
        DD_SITE="$DdSite" `
        DD_SERVICE="$DdService" `
        DD_ENV="$DdEnv" `
        CUSTOM_DOMAIN="https://$CustomDomain" `
        FRONTEND_URL="$FrontendUrl" `
        API_SUBDOMAIN="https://$CustomDomain" `
    -o table

$AppFqdn = & az containerapp show --name $AppName --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv
Write-Host "[SUCCESS] Container App deployed! FQDN: https://$AppFqdn" -ForegroundColor Green

# ── 9. Custom Domain & Managed SSL ────────────────────────────────────────────
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Yellow
Write-Host "               CUSTOM DOMAIN & MANAGED SSL BINDING               " -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Yellow
Write-Host "[INFO] Target Custom Domain: $CustomDomain" -ForegroundColor Cyan

$verificationId = & az containerapp show --name $AppName --resource-group $ResourceGroup --query properties.customDomainVerificationId -o tsv 2>$null

Write-Host ""
Write-Host "Please ensure the following DNS records exist on your DNS provider (e.g. Cloudflare):"
Write-Host "  CNAME Record: $CustomDomain  --->  $AppFqdn" -ForegroundColor Green
if ($verificationId) {
    Write-Host "  TXT Record:   asuid.$CustomDomain  --->  $verificationId" -ForegroundColor Green
}
Write-Host ""

$dnsChoice = Read-Host "Have you configured the DNS records above? (y/N)"
if ($dnsChoice -match "^[Yy]$") {
    Write-Host "[INFO] Registering custom hostname '$CustomDomain'..." -ForegroundColor Cyan
    & az containerapp hostname add --name $AppName --resource-group $ResourceGroup --hostname $CustomDomain 2>$null

    Write-Host "[INFO] Binding free Azure-managed SSL certificate..." -ForegroundColor Cyan
    & az containerapp hostname bind --name $AppName --resource-group $ResourceGroup --hostname $CustomDomain --environment $EnvironmentName --validation-method CNAME
    Write-Host "[SUCCESS] Custom domain configured: https://$CustomDomain" -ForegroundColor Green
} else {
    Write-Host "[INFO] Skipping domain binding. You can bind it anytime once DNS propagates." -ForegroundColor Cyan
}

# ── 10. Summary ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "               SCOT AI DEPLOYMENT SUMMARY                         " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  Resource Group : $ResourceGroup"
Write-Host "  ACR Registry   : $AcrLoginServer"
Write-Host "  Container App  : $AppName"
Write-Host "  Azure Endpoint : https://$AppFqdn"
Write-Host "  Custom Domain  : https://$CustomDomain"
Write-Host "  Health Probe   : https://$AppFqdn/health"
Write-Host "  Swagger Docs   : https://$AppFqdn/docs"
Write-Host "==================================================================" -ForegroundColor Green

