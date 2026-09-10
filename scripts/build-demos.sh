#!/usr/bin/env bash
# Builds the live demos from the Makepad repository and stages them under
# public/demos. Single-threaded wasm (no COOP/COEP headers needed, so it runs
# on GitHub Pages); the wasm is gzipped here and inflated in the browser by
# public/demos/run.html, so the host never has to negotiate compression.
#
#   MAKEPAD_DIR=/path/to/makepad scripts/build-demos.sh
#
# Requires cargo-makepad and its wasm toolchain (`cargo makepad wasm install-toolchain`).
set -euo pipefail

MAKEPAD_DIR="${MAKEPAD_DIR:-$HOME/git/mp/makepad}"
# demo id = crate directory inside the Makepad checkout
DEMOS=(
  charts=examples/charts
  glass=examples/glass
  finance=apps/finance
)

SITE="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$SITE/public/demos"
mkdir -p "$OUT/wasm" "$OUT/posters"

toml_name() { # first `name = "…"` after a [$1] table header in $2
  awk -v tbl="[$1]" '$0 == tbl { f = 1; next } /^\[/ { f = 0 } f && /^name *=/ { gsub(/.*= *"|".*/, ""); print; exit }' "$2"
}

for entry in "${DEMOS[@]}"; do
  app="${entry%%=*}"
  crate_dir="$MAKEPAD_DIR/${entry#*=}"
  pkg="$(toml_name package "$crate_dir/Cargo.toml")"
  bin="$(toml_name '[bin]' "$crate_dir/Cargo.toml")"
  bin="${bin:-$pkg}"
  echo "== $app ($pkg)"

  build() { (cd "$MAKEPAD_DIR" && cargo makepad wasm build -p "$pkg" --release --no-threads --strip); }
  wasm32="$MAKEPAD_DIR/target/wasm32-unknown-unknown/release"
  if [ "$bin" != "$pkg" ]; then
    # cargo-makepad packages <package>.wasm but cargo emits <bin>.wasm. Drop any
    # stale copy so the first pass always compiles, then supply the fresh one.
    rm -f "$wasm32/$pkg.wasm"
    build || true
    [ -f "$wasm32/$bin.wasm" ] || { echo "build failed: no $wasm32/$bin.wasm" >&2; exit 1; }
    cp "$wasm32/$bin.wasm" "$wasm32/$pkg.wasm"
  fi
  build
  pkg_dir="$MAKEPAD_DIR/target/makepad-wasm-app/release/$pkg"

  gzip -9 -n -c "$pkg_dir/$pkg.wasm" > "$OUT/wasm/$app.wasm.gz"

  # The runtime JS and the widget fonts are identical for every app built from
  # the same checkout, so they are shared; the last build wins.
  rsync -a --delete "$pkg_dir/makepad_platform/" "$OUT/makepad_platform/"
  rsync -a --delete "$pkg_dir/makepad_wasm_bridge/" "$OUT/makepad_wasm_bridge/"
  rsync -a "$pkg_dir/makepad_widgets/" "$OUT/makepad_widgets/"

  # Any other crate resources the app ships (its own, or a theme crate's) keep
  # the crate-named directory the app requests.
  for res in "$pkg_dir"/*/resources; do
    [ -d "$res" ] || continue
    crate="$(basename "$(dirname "$res")")"
    [ "$crate" = makepad_widgets ] && continue
    rsync -a --delete "$res/" "$OUT/$crate/resources/"
  done
  ls -la "$OUT/wasm/$app.wasm.gz"
done

# not needed by the host page: the dev-server reload hook and threaded-only files
rm -f "$OUT/makepad_platform/auto_reload.js" "$OUT/makepad_platform/full_canvas.css"
echo "staged into $OUT"
