@echo off
setlocal
cd /d "%~dp0"
title Cancha - Instalacion
echo.
echo ===== Instalacion de Cancha =====
echo.

where node >nul 2>nul
if errorlevel 1 goto sinnode
node -e "process.exit(Number(process.versions.node.split('.')[0])>=22?0:1)"
if errorlevel 1 goto nodeviejo

call node scripts\setup-store.mjs

echo.
echo [1/2] Instalando componentes (necesita internet, puede tardar unos minutos)...
call npm install
if errorlevel 1 goto fallo

echo.
echo [2/2] Preparando la aplicacion...
call npm run build
if errorlevel 1 goto fallo

echo.
echo ===== Listo! =====
echo Ahora abre "iniciar.bat" para usar Cancha.
echo.
pause
exit /b 0

:sinnode
echo No se encontro Node.js en este computador.
echo 1. Descargalo de https://nodejs.org (boton "LTS") e instalalo.
echo 2. Reinicia el computador.
echo 3. Vuelve a abrir este archivo.
echo.
pause
exit /b 1

:nodeviejo
echo La version de Node.js instalada es muy antigua. Cancha necesita la 22 o una mas nueva.
for /f "delims=" %%v in ('node -v') do echo Version instalada: %%v
echo 1. Descarga la version "LTS" de https://nodejs.org e instalala (reemplaza la anterior).
echo 2. Reinicia el computador.
echo 3. Vuelve a abrir este archivo.
echo.
pause
exit /b 1

:fallo
echo.
echo Algo fallo. Revisa los mensajes de arriba y la seccion "Si algo falla" de la guia.
echo.
pause
exit /b 1
