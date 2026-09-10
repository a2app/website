#!/usr/bin/env bash
# Builds the live demos from the Makepad repository and stages them under
# public/demos. Single-threaded wasm (no COOP/COEP headers needed, so it runs
# on GitHub Pages); the wasm is gzipped here and inflated in the browser by
# public/demos/run.html, so the host never has to negotiate compression.
#
#   MAKEPAD_DIR=/path/to/makepad scripts/build-demos.sh
#
# The checkout has to be the webdemos snapshot (commit 5a9eed960), which is what
# the default below points at. Makepad's dev branch builds wasm that panics at
# init on an empty window pool, and the work branch does not compile, so neither
# can produce a working demo. The tool is built from that same checkout too: the
# cargo-makepad on PATH may disagree with the tree about the font-asset manifest.
#
# Requires the wasm toolchain (`cargo makepad wasm install-toolchain`).
set -euo pipefail

MAKEPAD_DIR="${MAKEPAD_DIR:-$HOME/git/mp/makepad-webdemos}"
# demo id = crate directory inside the Makepad checkout
DEMOS=(
  glass=examples/glass
  finance=apps/finance
  datagrid=examples/datagrid
)

SITE="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$SITE/public/demos"
mkdir -p "$OUT/wasm" "$OUT/posters"

# Build the tool from the same tree, so the packaging step agrees with it.
CARGO_MAKEPAD="$MAKEPAD_DIR/target/release/cargo-makepad"
if [ ! -x "$CARGO_MAKEPAD" ]; then
  echo "== building cargo-makepad from $MAKEPAD_DIR"
  (cd "$MAKEPAD_DIR" && cargo build -p cargo-makepad --release)
fi

# A demo may need one small, documented change to the upstream source, such as
# which tab it opens on. Those live in scripts/patches/<id>.patch and are undone
# again on the way out, so the checkout is left as it was found.
PATCHED=()
undo_patches() {
  for patch in ${PATCHED+"${PATCHED[@]}"}; do
    git -C "$MAKEPAD_DIR" apply -R "$patch" || echo "could not revert $patch" >&2
  done
}
trap undo_patches EXIT

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

  patch_file="$SITE/scripts/patches/$app.patch"
  if [ -f "$patch_file" ]; then
    echo "-- applying $app.patch"
    git -C "$MAKEPAD_DIR" apply "$patch_file"
    PATCHED+=("$patch_file")
  fi

  build() { (cd "$MAKEPAD_DIR" && "$CARGO_MAKEPAD" wasm build -p "$pkg" --release --no-threads --strip); }
  wasm32="$MAKEPAD_DIR/target/wasm32-unknown-unknown/release"
  if [ "$bin" != "$pkg" ]; then
    # cargo-makepad packages <package>.wasm but cargo emits <bin>.wasm. Drop any
    # stale copy so the first pass always compiles, then supply the fresh one.
    rm -f "$wasm32/$pkg.wasm"
    build || true
    [ -f "$wasm32/$bin.wasm" ] || { echo "build failed: no $wasm32/$bin.wasm" >&2; exit 1; }
    cp "$wasm32/$bin.wasm" "$wasm32/$pkg.wasm"
  fi
  pkg_dir="$MAKEPAD_DIR/target/makepad-wasm-app/release/$pkg"
  # The packaged wasm carries a content hash in its name, so drop any earlier
  # build's copy and then match on the extension rather than a fixed filename.
  rm -f "$pkg_dir"/*.wasm
  build

  shopt -s nullglob
  packaged=("$pkg_dir"/*.wasm)
  shopt -u nullglob
  [ ${#packaged[@]} -eq 1 ] || {
    echo "expected one wasm in $pkg_dir, found ${#packaged[@]}" >&2; exit 1; }

  gzip -9 -n -c "${packaged[0]}" > "$OUT/wasm/$app.wasm.gz"

  # The runtime JS and the widget fonts are identical for every app built from
  # the same checkout, so they are shared; the last build wins.
  rsync -a --delete "$pkg_dir/makepad_platform/" "$OUT/makepad_platform/"
  rsync -a --delete "$pkg_dir/makepad_wasm_bridge/" "$OUT/makepad_wasm_bridge/"
  # The CJK and emoji faces are 46 MB between them and nothing on the site shows
  # anything but Latin text. The apps request them, 404, and fall back, which is
  # what shipped before; keeping them out holds public/demos to about 9 MB.
  rsync -a --exclude 'LXGWWenKai*.ttf' --exclude 'NotoColorEmoji.ttf' \
    "$pkg_dir/makepad_widgets/" "$OUT/makepad_widgets/"

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
