#!/usr/bin/env sh
# Contrôle les simulateurs (merchant-sim, fleet-sim) sans toucher à api/db/front.
# Usage:
#   ./sim.sh pause     # gèle les simulateurs (SIGSTOP)
#   ./sim.sh resume    # les relance
#   ./sim.sh status    # état des simulateurs
#   ./sim.sh stop      # arrêt complet (libère les ressources)
#   ./sim.sh start     # redémarre après un stop

set -e

SERVICES="merchant-sim fleet-sim"
CMD="${1:-status}"

case "$CMD" in
  pause)
    docker compose pause $SERVICES
    echo "simulations en pause ($SERVICES)"
    ;;
  resume|unpause)
    docker compose unpause $SERVICES
    echo "simulations reprises ($SERVICES)"
    ;;
  stop)
    docker compose stop $SERVICES
    ;;
  start)
    docker compose start $SERVICES
    ;;
  status)
    docker compose ps $SERVICES
    ;;
  *)
    echo "usage: $0 {pause|resume|stop|start|status}"
    exit 1
    ;;
esac
