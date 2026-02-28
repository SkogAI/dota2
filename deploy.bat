@echo off
echo === Dota 2 Squad Hub - Deploy to Cloudflare ===
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed!
    echo.
    echo Install it from: https://nodejs.org/
    echo Download the LTS version, run the installer, then re-run this script.
    pause
    exit /b 1
)

echo Node.js found:
node --version
echo.

:: Install dependencies
echo Installing wrangler...
call npm install
echo.

:: Login to Cloudflare
echo Logging in to Cloudflare (this will open your browser)...
call npx wrangler login
echo.

:: Deploy
echo Deploying to Cloudflare Workers...
call npx wrangler deploy
echo.
echo === Done! Your Dota 2 Hub should now be live at: ===
echo https://dota2-helper.YOUR-SUBDOMAIN.workers.dev
echo.
echo Pages:
echo   /nav   - Navigation hub
echo   /      - Squad Stats
echo   /solo  - Skogix Solo Stats
echo   /draft - Draft Helper
echo.
pause
