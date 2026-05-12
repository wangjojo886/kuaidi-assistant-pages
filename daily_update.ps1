param(
  [Parameter(Mandatory = $true)]
  [string]$ExportJsonPath
)

$ErrorActionPreference = "Stop"

$repo = "wangjojo886/kuaidi-assistant-pages"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Test-Path -LiteralPath $ExportJsonPath)) {
  throw "Export file not found: $ExportJsonPath"
}

Write-Host "1/4 Generate latest.json ..."
python .\update_latest_json.py --input $ExportJsonPath --output .\latest.json

Write-Host "2/4 Check GitHub auth ..."
$null = gh auth status

Write-Host "3/4 Upload latest.json to GitHub ..."
$latestPath = Join-Path $scriptDir "latest.json"
$latestContent = Get-Content -LiteralPath $latestPath -Raw -Encoding UTF8
$latestB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($latestContent))

$remoteSha = ""
try {
  $remoteSha = gh api repos/$repo/contents/latest.json --jq .sha
} catch {
  $remoteSha = ""
}

$commitMessage = "Update latest.json " + (Get-Date -Format "yyyy-MM-dd HH:mm")

if ($remoteSha) {
  gh api repos/$repo/contents/latest.json `
    --method PUT `
    --field message="$commitMessage" `
    --field content="$latestB64" `
    --field sha="$remoteSha" | Out-Null
} else {
  gh api repos/$repo/contents/latest.json `
    --method PUT `
    --field message="$commitMessage" `
    --field content="$latestB64" | Out-Null
}

Write-Host "4/4 Done"
Write-Host "Published: https://wangjojo886.github.io/kuaidi-assistant-pages/"
Write-Host "Note: GitHub Pages usually updates within 1-2 minutes."
