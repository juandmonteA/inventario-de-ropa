@echo off
setlocal
cd /d "%~dp0"
title Cancha - Inventario

where node >nul 2>nul
if errorlevel 1 goto sinnode

if exist ".next" if exist "node_modules" goto listo
call instalar.bat
if not exist ".next" exit /b 1
if not exist "node_modules" exit /b 1

:listo
rem Copia de seguridad automatica cada vez que se inicia
call node scripts\backup.mjs

set "IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do if not defined IP set "IP=%%a"
if defined IP set "IP=%IP: =%"

echo.
echo ===== Cancha esta iniciando =====
echo NO cierres esta ventana mientras trabajas.
echo.
echo En este computador:  http://localhost:3000
if defined IP echo Desde otros equipos de la tienda:  http://%IP%:3000
echo.

start "" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:3000"
call npm start
echo.
echo Cancha se detuvo. Si fue un error, copia el mensaje de arriba.
pause
exit /b 0

:sinnode
echo No se encontro Node.js. Ejecuta primero "instalar.bat" y sigue sus instrucciones.
pause
exit /b 1
