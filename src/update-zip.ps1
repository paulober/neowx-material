$oldLocation = Get-Location

# after this, expect to be in parent of build dist folder
Set-Location ..
Compress-Archive -Path dist -CompressionLevel Optimal -Update -DestinationPath neowx-material-latest.zip
Set-Location $oldLocation
