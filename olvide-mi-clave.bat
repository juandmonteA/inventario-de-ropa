@echo off
cd /d "%~dp0"
title Cancha - Recuperar contrasena
echo ===== Recuperar acceso =====
echo Este archivo cambia la contrasena de un usuario. Usalo si el administrador la olvido.
echo.
echo.
call node scripts\reset-password.mjs
echo.
pause
