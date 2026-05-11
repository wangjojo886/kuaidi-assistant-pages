param(
  [Parameter(Mandatory = $true)]
  [string]$ExportJsonPath
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Test-Path -LiteralPath $ExportJsonPath)) {
  throw "导出文件不存在: $ExportJsonPath"
}

python .\update_latest_json.py --input $ExportJsonPath --output .\latest.json

git add .\latest.json
$diff = git diff --cached --name-only
if (-not $diff) {
  Write-Host "latest.json 无变化，不需要推送。"
  exit 0
}

$msg = "Update latest.json " + (Get-Date -Format "yyyy-MM-dd HH:mm")
git commit -m $msg
git push

Write-Host "已更新并推送 latest.json。Cloudflare Pages 会自动发布。"
