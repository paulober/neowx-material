yarn run build-css
yarn run build-minify-css
yarn run build-minify-js
# Get-Location | Write-Output
Remove-Item -Recurse -Force ..\dist\skins\neowx-material\

# Copy directories
Copy-Item -Recurse archive\,css\,fonts\,img\,js\,weather-icons\ ..\dist\skins\neowx-material\

# Copy files
Copy-Item *.tmpl,*.inc,manifest.json,skin.conf ..\dist\skins\neowx-material

# Cleanup build
# Not removing sourcemaps anymore: ..\dist\skins\neowx-material\js\*.map
Remove-Item -Recurse -Force ..\dist\skins\neowx-material\img\*.psd, ..\dist\skins\neowx-material\css\style.css, ..\dist\skins\neowx-material\js\app.js, ..\dist\skins\neowx-material\js\bootstrap.js
