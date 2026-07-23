@echo off
echo ========================================================
echo Secret Key Scanner Startup
echo Developer: Saqib
echo ========================================================
echo.

echo [1/3] Installing Node.js dependencies...
call npm install

echo.
echo [2/3] Installing Python dependencies...
call pip install -r requirements.txt

echo.
echo [3/3] Launching web server and opening browser...
start http://localhost:3000

echo.
echo Server starting on http://localhost:3000...
call npm run dev

pause
