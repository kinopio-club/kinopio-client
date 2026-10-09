#!/bin/bash
# Used by `npm run desktop` in place of cargo, so that the dev app is named "[DEV] Kinopio" in the dock.
# The dock shows the name of the binary that's running, so this builds the app,
# copies the binary to the dev name, and runs the copy.

set -e

if [ "$1" != "run" ]; then
  exec cargo "$@"
fi
shift

# everything after -- is for the app, not for cargo
build_args=()
for arg in "$@"; do
  if [ "$arg" == "--" ]; then
    break
  fi
  build_args+=("$arg")
done

cargo build "${build_args[@]}"

directory="$(cd "$(dirname "$0")" && pwd)/target/debug"
cp "$directory/Kinopio" "$directory/[DEV] Kinopio"
exec "$directory/[DEV] Kinopio"
