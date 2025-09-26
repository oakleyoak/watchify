@echo off
echo ========================================
echo    Watchify Setup Script
echo ========================================
echo.

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Generating PWA icons...
npm run generate-icons
if %errorlevel% neq 0 (
    echo Warning: Failed to generate PWA icons (optional)
)

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create a Supabase project at https://supabase.com
echo 2. Copy your project URL and anon key
echo 3. Create .env.local with:
echo    VITE_SUPABASE_URL=your_supabase_url
echo    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
echo 4. Run the SQL commands in the README to create database tables
echo 5. Make sure VLC Media Player is installed
echo 6. Start development with: npm run dev
echo.
echo For desktop app distribution:
echo - Run: npm run build:electron (builds for current platform)
echo - Run: npm run electron:dist (creates installers for all platforms)
echo.
pause