@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

if not "%~1"=="" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%daily_update.ps1" -ExportJsonPath "%~1"
  pause
  exit /b %errorlevel%
)

powershell -NoProfile -ExecutionPolicy Bypass ^
  -Command "Add-Type -AssemblyName System.Windows.Forms; $dlg = New-Object System.Windows.Forms.OpenFileDialog; $dlg.Filter = 'JSON files (*.json)|*.json|All files (*.*)|*.*'; $dlg.Title = '选择后台导出的 JSON 文件'; if ($dlg.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit 1 }; & '%SCRIPT_DIR%daily_update.ps1' -ExportJsonPath $dlg.FileName"

pause
