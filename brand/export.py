#!/usr/bin/env python3
"""
Regenerates every deployable brand asset from a single geometry definition.

    python3 brand/export.py          # writes into website/public/

Requires: rsvg-convert (brew install librsvg) and Pillow.
Nothing here is hand-edited — change the geometry or palette below and re-run.
"""
import subprocess, shutil, sys, json
from pathlib import Path

ROOT   = Path(__file__).resolve().parent.parent
SRC    = Path(__file__).resolve().parent / "src"
OUT    = ROOT / "public"

# ── palette ───────────────────────────────────────────────────────────────
MINT, SKY = "#6EE7B7", "#38BDF8"          # accent ramp
INK       = "#EAEEF6"                      # the letterform on dark
INK_DARK  = "#0B0D12"                      # letterform on light / icon plate
MINT_D, SKY_D = "#0D9668", "#0284C7"       # accent, darkened for light grounds

# ── geometry ──────────────────────────────────────────────────────────────
WVB, WSW = "0 12 228 140", 11
A_DIAG  = "M18 100 L52 30 L86 100"
A_BAR   = "M29 80 L75 80"
LINK    = "M75 80 C90 80 93 60 108 60"
LINK2   = "M148 80 C157 80 159 60 170 60"
P1_BOWL = "M108 60 H128 A20 20 0 0 1 128 100 H108"
P1_LEG  = "M108 100 L108 134"
P2_BOWL = "M170 60 H190 A20 20 0 0 1 190 100 H170"
P2_LEG  = "M170 100 L170 134"

MVB, MSW = "0 0 100 100", 11                # mark, display sizes
M_DIAG, M_BAR = "M22 82 L50 22 L78 82", "M33 65 L67 65"

# icon-weight A: heavier stroke and tighter margins so it survives 16px
IVB, ISW = "0 0 100 100", 13
I_DIAG, I_BAR = "M18 84 L50 18 L82 84", "M31 64 L69 64"


def ramp(gid, x1, y1, x2, y2, c0=MINT, c1=SKY):
    return (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" '
            f'x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">'
            f'<stop offset="0" stop-color="{c0}"/><stop offset="1" stop-color="{c1}"/></linearGradient>')


def wordmark(gid="w", ink=INK, c0=MINT, c1=SKY, box=None):
    vb = box or WVB
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="A2App">'
            f'<defs>{ramp(gid, 29, 66, 210, 128, c0, c1)}</defs>'
            f'<g fill="none" stroke-width="{WSW}" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="{A_DIAG}" stroke="{ink}"/><path d="{A_BAR}" stroke="url(#{gid})"/>'
            f'<path d="{LINK}" stroke="url(#{gid})"/><path d="{LINK2}" stroke="url(#{gid})"/>'
            f'<path d="{P1_BOWL}" stroke="url(#{gid})"/><path d="{P1_LEG}" stroke="url(#{gid})"/>'
            f'<path d="{P2_BOWL}" stroke="url(#{gid})"/><path d="{P2_LEG}" stroke="url(#{gid})"/>'
            f'</g></svg>')


def mark(gid="m", ink=INK, c0=MINT, c1=SKY):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{MVB}" role="img" aria-label="A2App">'
            f'<defs>{ramp(gid, 33, 58, 67, 72, c0, c1)}</defs>'
            f'<g fill="none" stroke-width="{MSW}" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="{M_DIAG}" stroke="{ink}"/><path d="{M_BAR}" stroke="url(#{gid})"/>'
            f'</g></svg>')


def icon(gid="i", plate=None, radius=0, scale=1.0, ink=INK):
    """Icon-weight mark. `plate` fills the square; `scale` shrinks for maskable safe-zone."""
    bg = f'<rect width="100" height="100" rx="{radius}" fill="{plate}"/>' if plate else ""
    tf = f' transform="translate(50 50) scale({scale}) translate(-50 -50)"' if scale != 1.0 else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{IVB}" role="img" aria-label="A2App">'
            f'<defs>{ramp(gid, 31, 56, 69, 72)}</defs>{bg}'
            f'<g fill="none" stroke-width="{ISW}" stroke-linecap="round" stroke-linejoin="round"{tf}>'
            f'<path d="{I_DIAG}" stroke="{ink}"/><path d="{I_BAR}" stroke="url(#{gid})"/>'
            f'</g></svg>')


def og():
    """1200x630 social card: wordmark centred on the brand ink."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">'
            f'<defs>{ramp("g", 380, 300, 820, 360)}'
            f'<radialGradient id="glow" cx=".5" cy=".42" r=".55">'
            f'<stop offset="0" stop-color="{MINT}" stop-opacity=".10"/>'
            f'<stop offset="1" stop-color="{MINT}" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="1200" height="630" fill="#06070A"/>'
            f'<rect width="1200" height="630" fill="url(#glow)"/>'
            f'<g transform="translate(302 210) scale(2.6)">'
            f'<g fill="none" stroke-width="{WSW}" stroke-linecap="round" stroke-linejoin="round" '
            f'transform="translate(0 -12)">'
            f'<path d="{A_DIAG}" stroke="{INK}"/><path d="{A_BAR}" stroke="url(#g)"/>'
            f'<path d="{LINK}" stroke="url(#g)"/><path d="{LINK2}" stroke="url(#g)"/>'
            f'<path d="{P1_BOWL}" stroke="url(#g)"/><path d="{P1_LEG}" stroke="url(#g)"/>'
            f'<path d="{P2_BOWL}" stroke="url(#g)"/><path d="{P2_LEG}" stroke="url(#g)"/></g></g>'
            f'<text x="600" y="556" text-anchor="middle" fill="#8F99AD" '
            f'font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="30" '
            f'letter-spacing="1.5">Agent to App</text></svg>')


def png(svg_path, out_path, w, h=None):
    subprocess.run(["rsvg-convert", "-w", str(w), "-h", str(h or w),
                    str(svg_path), "-o", str(out_path)], check=True)


def main():
    if not shutil.which("rsvg-convert"):
        sys.exit("rsvg-convert not found — brew install librsvg")
    SRC.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    # ── sources ───────────────────────────────────────────────────────────
    src = {
        "wordmark.svg":          wordmark(),
        "wordmark-on-light.svg": wordmark("wl", INK_DARK, MINT_D, SKY_D),
        "mark.svg":              mark(),
        "mark-on-light.svg":     mark("ml", INK_DARK, MINT_D, SKY_D),
        "favicon.svg":           icon("f", plate=INK_DARK, radius=22),
        "icon-plain.svg":        icon("p"),                       # transparent, for PWA/maskable base
        "icon-maskable.svg":     icon("k", plate=INK_DARK, radius=0, scale=0.62),
        "apple-touch.svg":       icon("a", plate=INK_DARK, radius=0),
        "og.svg":                og(),
    }
    for name, body in src.items():
        (SRC / name).write_text(body + "\n")

    # ── deployables ───────────────────────────────────────────────────────
    for f in ["wordmark.svg", "wordmark-on-light.svg", "mark.svg", "mark-on-light.svg", "favicon.svg"]:
        shutil.copy(SRC / f, OUT / f)

    png(SRC / "favicon.svg",       OUT / "favicon-16.png", 16)
    png(SRC / "favicon.svg",       OUT / "favicon-32.png", 32)
    png(SRC / "favicon.svg",       OUT / "favicon-48.png", 48)
    png(SRC / "apple-touch.svg",   OUT / "apple-touch-icon.png", 180)
    png(SRC / "icon-plain.svg",    OUT / "icon-192.png", 192)
    png(SRC / "icon-plain.svg",    OUT / "icon-512.png", 512)
    png(SRC / "icon-maskable.svg", OUT / "icon-512-maskable.png", 512)
    png(SRC / "og.svg",            OUT / "og-image.png", 1200, 630)
    png(SRC / "wordmark.svg",      OUT / "wordmark.png",    456, 280)
    png(SRC / "wordmark.svg",      OUT / "wordmark@2x.png", 912, 560)

    # multi-resolution .ico for legacy
    from PIL import Image
    ico_src = Image.open(OUT / "favicon-48.png").convert("RGBA")
    ico_src.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    (OUT / "site.webmanifest").write_text(json.dumps({
        "name": "A2App", "short_name": "A2App",
        "description": "Agent to App — AI agents that build entire applications.",
        "start_url": "/", "display": "standalone",
        "background_color": "#06070A", "theme_color": "#06070A",
        "icons": [
            {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/icon-512-maskable.png", "sizes": "512x512",
             "type": "image/png", "purpose": "maskable"},
        ],
    }, indent=2) + "\n")

    print(f"wrote {len(list(OUT.iterdir()))} files to {OUT.relative_to(ROOT.parent)}")
    for f in sorted(OUT.iterdir()):
        print(f"  {f.name:26} {f.stat().st_size:>8,} B")


if __name__ == "__main__":
    main()
