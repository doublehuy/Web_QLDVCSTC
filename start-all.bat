@echo off
echo Starting Pet Care Management Admin System...
echo.
echo Starting Admin Backend Server...
start "Admin Backend Server" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo Starting Admin Frontend React App...
start "Admin Frontend App" cmd /k "cd client && npm start"
echo.
echo Both admin servers are starting...
echo Admin Backend: http://localhost:5000
echo Admin Frontend: http://localhost:3000
echo.
pause

