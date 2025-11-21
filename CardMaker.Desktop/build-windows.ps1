param(
    [switch]$SelfContained = $false
)

$repoRoot = Resolve-Path "$PSScriptRoot/.."
$libDir = Join-Path $repoRoot "libs"
$assets = @(
    @{ Name = "html2canvas.min.js"; Url = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js" },
    @{ Name = "jspdf.umd.min.js"; Url = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js" }
)

$profile = "Properties/PublishProfiles/Win10-x64.pubxml"
if (!(Test-Path $profile)) {
    throw "Publish profile ontbreekt: $profile"
}

$ensureLibs = {
    if (!(Test-Path $libDir)) {
        New-Item -ItemType Directory -Path $libDir | Out-Null
    }

    foreach ($asset in $assets) {
        $target = Join-Path $libDir $asset.Name
        if (!(Test-Path $target) -or (Get-Item $target).Length -eq 0) {
            Write-Host "⬇️  Downloading $($asset.Name)" -ForegroundColor Yellow
            Invoke-WebRequest -Uri $asset.Url -UseBasicParsing -OutFile $target
        }
    }
}

$props = @()
if ($SelfContained) {
    $props += "/p:SelfContained=true"
}

& $ensureLibs

Write-Host "🔨 Restoring en publiceren..."
dotnet restore

Write-Host "🔨 Publishing CardMaker Studio..."
dotnet publish -p:PublishProfile=$profile $props

$publishDir = Join-Path $PSScriptRoot "bin/Release/net8.0-windows/win10-x64/publish"
$exe = Join-Path $publishDir "CardMaker.Desktop.exe"
if (Test-Path $exe) {
    Write-Host "✅ Klaar! Vind de .exe in $publishDir" -ForegroundColor Green
} else {
    throw "Geen .exe gevonden in $publishDir; controleer de build output."
}
