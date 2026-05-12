param(
  [string]$SupabaseUrl,
  [string]$SupabaseAnonKey
)

$ErrorActionPreference = "Stop"

$repo = "wangjojo886/kuaidi-assistant-pages"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not $SupabaseUrl) {
  $SupabaseUrl = Read-Host "Input Supabase Project URL (https://xxxx.supabase.co)"
}

if (-not $SupabaseAnonKey) {
  $SupabaseAnonKey = Read-Host "Input Supabase anon/public key"
}

$SupabaseUrl = $SupabaseUrl.Trim()
$SupabaseAnonKey = $SupabaseAnonKey.Trim()

if (-not $SupabaseUrl.StartsWith("https://")) {
  throw "Supabase URL must start with https://"
}

if ($SupabaseAnonKey.Length -lt 20) {
  throw "Supabase anon key looks too short"
}

$config = @"
window.SUPABASE_CONFIG = {
  url: "$SupabaseUrl",
  anonKey: "$SupabaseAnonKey",
};
"@

Set-Content -LiteralPath ".\supabase-config.js" -Value $config -Encoding UTF8

Write-Host "1/3 Wrote supabase-config.js"
Write-Host "2/3 Check GitHub auth ..."
$null = gh auth status

$content = Get-Content -LiteralPath ".\supabase-config.js" -Raw -Encoding UTF8
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($content))
$sha = ""
try {
  $sha = gh api repos/$repo/contents/supabase-config.js --jq .sha
} catch {
  $sha = ""
}

$msg = "Configure Supabase " + (Get-Date -Format "yyyy-MM-dd HH:mm")
if ($sha) {
  gh api repos/$repo/contents/supabase-config.js `
    --method PUT `
    --field message="$msg" `
    --field content="$b64" `
    --field sha="$sha" | Out-Null
} else {
  gh api repos/$repo/contents/supabase-config.js `
    --method PUT `
    --field message="$msg" `
    --field content="$b64" | Out-Null
}

Write-Host "3/3 Done"
Write-Host "Published: https://wangjojo886.github.io/kuaidi-assistant-pages/"
Write-Host "Note: GitHub Pages usually updates within 1-2 minutes."
