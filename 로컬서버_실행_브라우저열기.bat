@echo off
chcp 65001 > nul
title [아델라인 글로벌] 해외영업 Order Process SOP 로컬 웹서버
echo ========================================================
echo   [아델라인 글로벌] 해외영업 Order Process SOP & 브랜드사 관리
echo   로컬 웹서버(http://localhost:...)를 가동하고 브라우저를 엽니다...
echo ========================================================

cd /d "%~dp0"

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Python 로컬 웹서버를 구동합니다...
    python "result\[004]_로컬웹서버_구동기.py"
    goto end
)

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Node.js 서버를 구동합니다...
    start "" http://localhost:8080
    npx serve -l 8080 .
    goto end
)

echo 로컬 파이썬 또는 노드가 감지되지 않아 기본 브라우저로 엽니다.
start "" "index.html"

:end
