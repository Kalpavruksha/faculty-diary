# PowerShell script to check MongoDB status
Write-Host "Checking if MongoDB is running on port 27017..."
$mongoRunning = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue

if ($mongoRunning) {
    Write-Host "MongoDB is running on port 27017" -ForegroundColor Green
} else {
    Write-Host "MongoDB is NOT running on port 27017" -ForegroundColor Red
    Write-Host "Please start MongoDB service before running the init-db script" -ForegroundColor Yellow
}

Write-Host "`nChecking MongoDB service status..."
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue

if ($mongoService) {
    Write-Host "MongoDB service status: $($mongoService.Status)" -ForegroundColor Cyan
    if ($mongoService.Status -ne "Running") {
        Write-Host "MongoDB service is not running. Start it with: Start-Service MongoDB" -ForegroundColor Yellow
    }
} else {
    Write-Host "MongoDB service not found. You may need to install MongoDB or it's using a different service name." -ForegroundColor Red
}

Write-Host "`nChecking MongoDB processes..."
$mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue

if ($mongoProcess) {
    Write-Host "MongoDB process is running with PID: $($mongoProcess.Id)" -ForegroundColor Green
} else {
    Write-Host "No MongoDB process (mongod) found running" -ForegroundColor Red
}

# Save the output to a file
$output = "MongoDB Check Results:`n"
$output += "Date: $(Get-Date)`n"
$output += "MongoDB running on port 27017: $($mongoRunning -ne $null)`n"
$output += "MongoDB service found: $($mongoService -ne $null)`n"
if ($mongoService) {
    $output += "MongoDB service status: $($mongoService.Status)`n"
}
$output += "MongoDB process found: $($mongoProcess -ne $null)`n"
if ($mongoProcess) {
    $output += "MongoDB process ID: $($mongoProcess.Id)`n"
}

$output | Out-File -FilePath "../mongodb-status.txt"
Write-Host "`nResults saved to mongodb-status.txt" -ForegroundColor Cyan 