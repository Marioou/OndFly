@echo off
REM Consolidated launcher script for Daily Organizer

REM Set the current directory to the script location
cd /d "%~dp0"

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH.
    echo Please install Node.js and ensure npm is accessible.
    pause
    exit /b
)

REM Detect Chrome executable in standard locations
set "CHROME_PATH="
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_PATH if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_PATH if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_PATH (
    echo ERROR: Chrome is not installed in standard locations.
    echo Please install Google Chrome.
    pause
    exit /b
)

REM Ensure dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --silent
)

REM Start React development server minimized without opening terminal
echo Starting React development server...
start "React Dev Server" /min cmd.exe /c "npm start > npm.log 2>&1"

REM Wait for the development server to start
timeout /t 10 >nul

REM Launch the app in Chrome standalone mode pointing to local server
start "Daily Organizer" "%CHROME_PATH%" --app="http://localhost:3000" --window-size=1200,900 --window-position=100,100

REM Exit script
exit /b
