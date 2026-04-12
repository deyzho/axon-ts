$files = Get-ChildItem -Path 'C:\Users\deyzh\Projects\Phonix\packages\sdk\src' -Recurse -Include '*.ts' | Where-Object { $_.Name -notlike '*.d.ts' }
$count = 0
foreach ($f in $files) {
    $c = Get-Content $f.FullName -Raw
    $n = $c `
        -replace 'PhonixError', 'AxonError' `
        -replace 'PhonixClient', 'AxonClient' `
        -replace 'IPhonixProvider', 'IAxonProvider' `
        -replace 'PhonixConfig', 'AxonConfig' `
        -replace 'IPhonixRuntime', 'IAxonRuntime' `
        -replace 'PhonixRuntimeHttp', 'AxonRuntimeHttp' `
        -replace 'PhonixRuntimeWs', 'AxonRuntimeWs' `
        -replace 'PhonixRouter', 'AxonRouter'
    if ($c -ne $n) {
        Set-Content $f.FullName $n -NoNewline
        $count++
    }
}
Write-Host "Updated $count source files"

# Delete stale .d.ts files from src/ (they are build artifacts, not source)
$dts = Get-ChildItem -Path 'C:\Users\deyzh\Projects\Phonix\packages\sdk\src' -Recurse -Include '*.d.ts'
foreach ($f in $dts) { Remove-Item $f.FullName }
Write-Host "Removed $($dts.Count) stale .d.ts files from src/"
