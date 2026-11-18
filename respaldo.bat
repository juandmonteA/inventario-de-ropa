@echo off
cd /d "%~dp0"
title Cancha - Respaldo
echo Creando copia de seguridad de la base de datos...
call node scripts\backup.mjs
echo.
echo Las copias quedan en la carpeta data\respaldos.
echo Copia esa carpeta a una USB o a la nube de vez en cuando.
echo.
pause
