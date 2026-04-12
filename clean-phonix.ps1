$target = 'C:\Users\deyzh\Projects\Phonix\node_modules\@phonix'
if (Test-Path $target) {
    Get-ChildItem -Path $target -Recurse -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $target -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Removed $target"
} else {
    Write-Host "Already gone"
}
