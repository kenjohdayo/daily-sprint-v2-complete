param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9-]+$')]
  [string]$Slug
)

$threadsDir = Join-Path $PSScriptRoot "..\memory\threads"
if (-not (Test-Path $threadsDir)) {
  New-Item -Path $threadsDir -ItemType Directory | Out-Null
}

$date = Get-Date -Format "yyyy-MM-dd"
$fileName = "$date-$Slug.md"
$filePath = Join-Path $threadsDir $fileName

if (Test-Path $filePath) {
  Write-Host "File already exists: $filePath"
  notepad $filePath
  exit 0
}

$template = @"
# Thread Record: $Slug

- Date: $date
- Sanitization: pending

## Summary

## Key points

## Actions

"@

Set-Content -Path $filePath -Value $template -Encoding UTF8
Write-Host "Created: $filePath"
notepad $filePath
