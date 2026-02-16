param(
  [Parameter(Mandatory = $true)]
  [string]$InputFile,
  [Parameter(Mandatory = $true)]
  [string]$OutputFile
)

if (-not (Test-Path $InputFile)) {
  Write-Error "Input file not found: $InputFile"
  exit 1
}

$content = Get-Content -Path $InputFile -Raw

# Best-effort redaction patterns
$content = $content -replace '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[REDACTED_EMAIL]'
$content = $content -replace '(?<!\d)(\+?\d[\d\s\-]{7,}\d)(?!\d)', '[REDACTED_PHONE]'
$content = $content -replace '(?im)\b(username|user|account|handle)\b\s*[:=]\s*\S+', '$1=[REDACTED_USER]'
$content = $content -replace '(?im)\b(api[_-]?key|token|secret|password|passwd)\b\s*[:=]\s*\S+', '$1=[REDACTED_SECRET]'
$content = $content -replace '(?i)([A-Z]:\\[^\r\n\t ]+|/[^\r\n\t ]+)', '[REDACTED_PATH]'

$outDir = Split-Path -Parent $OutputFile
if ($outDir -and -not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

Set-Content -Path $OutputFile -Value $content -Encoding UTF8
Write-Host "Redacted output written: $OutputFile"
