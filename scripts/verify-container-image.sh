#!/usr/bin/env bash
# Builds the Docker image and checks that nginx runs as a non-root user and still serves the app.
# Set BUILD=0 to check an already built IMAGE.
set -euo pipefail
cd "$(dirname "$0")/.."
image="${IMAGE:-mifosx-web-app:verify}"
port="${PORT:-8080}"
if [[ "${BUILD:-1}" != "0" ]]; then
  docker build -q -t "$image" . >/dev/null
fi
uid="$(docker run --rm --entrypoint id "$image" -u)"
user="$(docker inspect -f '{{.Config.User}}' "$image")"
if [[ "$uid" == "0" || -z "$user" || "$user" == "root" || "$user" == "0" ]]; then
  echo "FAIL $image runs as root (id -u=$uid, Config.User='$user')"
  exit 1
fi
container="$(docker run -d -p "127.0.0.1::$port" -e FINERACT_API_URL=https://localhost:8443 "$image")"
trap 'docker rm -f "$container" >/dev/null' EXIT
host_port="$(docker port "$container" "$port/tcp" | head -1 | sed 's/.*://')"
for _ in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:$host_port/" >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS "http://127.0.0.1:$host_port/" | grep -i '<app-web-app\|<html' >/dev/null \
  || { echo "FAIL $image does not serve index.html on port $port"; docker logs "$container"; exit 1; }
curl -fsS "http://127.0.0.1:$host_port/assets/env.js" | grep 'https://localhost:8443' >/dev/null \
  || { echo "FAIL $image did not render assets/env.js from the environment"; docker logs "$container"; exit 1; }
echo "PASS $image runs as uid $uid (Config.User=$user) and serves the app on port $port"
