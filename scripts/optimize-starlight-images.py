"""Generate Starlight's responsive images. Requires Python 3 and Pillow.

Run from any directory with: python3 scripts/optimize-starlight-images.py
Original images are retained so derivatives can always be regenerated.
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/optimized/starlight"
IMAGES = [
    ("assets/vehicles/starlight/starlight-render-2026.png", "vehicle", [640, 1280, 1920, 2585], 90),
    ("assets/campaigns/2026/28kn-nozzle-injector.webp", "nozzle-injector", [360, 720, 1067], 88),
    ("assets/campaigns/2026/28kn-nozzle.webp", "nozzle", [360, 720, 1200], 88),
    ("assets/propulsion/M_NOZ_MCC_TLR_V5_(Assembly)_2026-Apr-19_10-10-02AM-000_CustomizedView5883812959 (1).webp", "propulsion", [240, 480, 929], 90),
    ("assets/ui/ea-partner-white.webp", "logo", [320], 95),
]


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for source, name, widths, quality in IMAGES:
        with Image.open(ROOT / source) as original:
            image = ImageOps.exif_transpose(original)
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
            for width in widths:
                if width > image.width:
                    raise ValueError(f"Cannot upscale {source} to {width}px")
                height = round(image.height * width / image.width)
                resized = image.resize((width, height), Image.Resampling.LANCZOS)
                target = OUTPUT / f"{name}-{width}.webp"
                resized.save(target, "WEBP", quality=quality, method=6)
                # Do not inflate already compressed originals at full resolution.
                if width == image.width and original.format == "WEBP" and target.stat().st_size > (ROOT / source).stat().st_size:
                    target.write_bytes((ROOT / source).read_bytes())
                print(f"{target.relative_to(ROOT)}: {width}x{height}, {target.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
