@echo off
cd /d "%~dp0.."
node live-listen/relay/server.mjs
pause
