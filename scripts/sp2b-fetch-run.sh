#!/usr/bin/env bash

# Fetch, extract, and run the SP2B binary from the given tar.gz
# Always runs via Docker, saving the result to ./tmp on the host.

set -euo pipefail

URL="https://dbis.informatik.uni-freiburg.de/content/projects/SP2B/docs/sp2b-v1_00-linux.tar.gz"

info() { echo "[sp2b] $*"; }
err()  { echo "[sp2b][error] $*" >&2; }

# Allow overriding workdir via env; default to a temp directory
WORKDIR=${WORKDIR:-"${TMPDIR:-/tmp}/sp2b-run-$(date +%Y%m%d-%H%M%S)"}
ARCHIVE="$WORKDIR/sp2b.tar.gz"

mkdir -p "$WORKDIR"

info "Using work directory: $WORKDIR"
info "Downloading: $URL"

curl -L "$URL" -o "$ARCHIVE"

info "Download complete: $ARCHIVE"
info "Extracting archive..."

tar -xzf "$ARCHIVE" -C "$WORKDIR"

info "Search for executable(s)..."

# Portable find: match files executable by user/group/other
BIN_PATH=$(find "$WORKDIR" -maxdepth 3 -type f \( -perm -u+x -o -perm -g+x -o -perm -o+x \) | sort | head -n 1)

if [[ -z "${BIN_PATH}" ]]; then
  err "No executable files found in archive contents. Inspect directory: $WORKDIR"
  exit 1
fi

info "Found candidate binary: $BIN_PATH"

# Try to find distribution root (contains givennames.txt). Fallback to binary dir.
RUN_DIR=$(dirname "$BIN_PATH")
NAMES_FILE=$(find "$WORKDIR" -maxdepth 3 -type f -name 'givennames.txt' | head -n 1 || true)
if [[ -n "${NAMES_FILE:-}" ]]; then
  RUN_DIR=$(dirname "$NAMES_FILE")
fi
info "Using working directory for execution: $RUN_DIR"

# Relative paths for Docker working directory and binary
REL_PATH_BIN=${BIN_PATH#"$WORKDIR/"}
if [[ "$REL_PATH_BIN" == "$BIN_PATH" ]]; then REL_PATH_BIN=$(basename "$BIN_PATH"); fi
REL_PATH_RUN=${RUN_DIR#"$WORKDIR/"}
if [[ "$REL_PATH_RUN" == "$RUN_DIR" ]]; then REL_PATH_RUN="."; fi

# Small generation size for smoke test (override via TRIPLES env)
TRIPLES=${TRIPLES:-1000}

info "Using Docker to run the binary..."
if ! command -v docker >/dev/null 2>&1; then
  err "Docker not available. Please install Docker and re-run. Files extracted at: $WORKDIR"
  exit 2
fi

# Host output directory outside of the container
OUTDIR=${OUTDIR:-"$PWD/tmp"}
mkdir -p "$OUTDIR"
OUTFILE=${OUTFILE:-"$OUTDIR/sp2b.n3"}

set +e
docker run --rm --platform linux/amd64 \
  -v "$WORKDIR":/work \
  -v "$OUTDIR":/out \
  -w "/work/$REL_PATH_RUN" \
  ubuntu:22.04 \
  bash -lc "set -e; export DEBIAN_FRONTEND=noninteractive; apt-get update -y >/dev/null; dpkg --add-architecture i386; apt-get update -y >/dev/null; apt-get install -y --no-install-recommends libc6:i386 libstdc++6:i386 lib32gcc-s1 >/dev/null; chmod +x '/work/$REL_PATH_BIN'; '/work/$REL_PATH_BIN' -t '$TRIPLES' /out/sp2b.n3"
EXIT_CODE=$?
set -e
if [[ $EXIT_CODE -ne 0 ]]; then
  err "Binary failed to run inside Docker (exit $EXIT_CODE). Contents available at: $WORKDIR"
  exit $EXIT_CODE
fi

info "Done. Output written to: $OUTFILE"
info "Work directory retained at: $WORKDIR"
