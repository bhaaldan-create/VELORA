@echo off
chcp 65001 >nul
title VELORA Admin
cd /d "%~dp0"
call "%~dp0Start-VELORA-Admin.bat"
