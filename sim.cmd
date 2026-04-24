@echo off
rem Equivalent Windows de sim.sh : contrôle des simulateurs.
rem Usage: sim.cmd pause|resume|stop|start|status

set SERVICES=merchant-sim fleet-sim
set CMD=%1
if "%CMD%"=="" set CMD=status

if /I "%CMD%"=="pause" goto :pause
if /I "%CMD%"=="resume" goto :resume
if /I "%CMD%"=="unpause" goto :resume
if /I "%CMD%"=="stop" goto :stop
if /I "%CMD%"=="start" goto :start
if /I "%CMD%"=="status" goto :status
echo usage: sim.cmd {pause^|resume^|stop^|start^|status}
exit /b 1

:pause
docker compose pause %SERVICES%
echo simulations en pause
exit /b

:resume
docker compose unpause %SERVICES%
echo simulations reprises
exit /b

:stop
docker compose stop %SERVICES%
exit /b

:start
docker compose start %SERVICES%
exit /b

:status
docker compose ps %SERVICES%
exit /b
