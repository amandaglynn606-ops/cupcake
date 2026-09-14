"""Encode the second user-provided video without cropping or real-time screen capture."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".tools" / "video-encoder"))
import imageio_ffmpeg

source = Path.home() / "Downloads" / "elegant-wedding-cake-with-white-frosting-and-flowe-2026-01-22-11-48-52-utc.mov"
destination = ROOT / "assets" / "videos"
encoder = imageio_ffmpeg.get_ffmpeg_exe()
records = []
for width, suffix in [(1280, ""), (854, "-mobile")]:
    output = destination / ("wedding-second-full-frame" + suffix + ".mp4")
    subprocess.run([encoder, "-hide_banner", "-loglevel", "warning", "-y", "-i", str(source),
                    "-map", "0:v:0", "-an", "-vf", f"scale={width}:-2",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "21",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output)], check=True)
    data = output.read_bytes()
    records.append({"file": output.relative_to(ROOT).as_posix(), "bytes": len(data),
                    "sha256": hashlib.sha256(data).hexdigest()})
    print(json.dumps(records[-1]), flush=True)
subprocess.run([encoder, "-hide_banner", "-loglevel", "warning", "-y", "-ss", "0.1", "-i", str(source),
                "-frames:v", "1", "-vf", "scale=1280:-2", "-c:v", "libwebp", "-quality", "90",
                str(destination / "wedding-second-full-frame-poster.webp")], check=True)
(ROOT / "artifacts" / "banner-video" / "second-encoded.json").write_text(json.dumps(records, indent=2))
