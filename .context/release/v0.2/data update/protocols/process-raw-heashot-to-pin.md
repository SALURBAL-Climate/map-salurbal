# Protocol: Raw headshot → map pin

How to turn a designer-supplied raw headshot into a map pin that matches the
existing pins in `images/` (the ones used by `scripts/script.js` as
`iconUrl`). Written so a future agent can reproduce it without re-deriving the
geometry.

This is the exact process used to produce the v0.2 update pins (e.g.
`images/kai_usa_update.png`) from the raw files in
`.context/release/v0.2/data update/raw/`.

---

## 1. The two formats

### Input — raw headshot from Caro (the designer)
Lives in `.context/release/v0.2/data update/raw/` (e.g. `Kai HSsu  2.png`).

- Large **square** PNG (~2700–3000 px per side), `RGBA`.
- The person is already styled by the designer: an **orange/purple duotone**
  treatment over a **light-blue circular background**.
- The content is a **filled circle (disc)** — corners are fully transparent
  (`[255,255,255,0]`). The disc diameter is ~2464 px (the disc is centered but
  *not* necessarily at the exact image center, so always measure it).
- **No pin shape, no white border, no tail.** Just the duotone disc.

> ⚠️ Earlier raw files (e.g. `Kai.png`, `penelope brou.png` — now deleted from
> git) were *un-styled* rectangular photos on real backgrounds. Those are
> obsolete. The current raw files already carry the blue-duotone disc styling;
> we only reshape them. If you ever get an un-styled rectangular photo, send it
> back to the designer for the disc treatment rather than faking it.

### Output — map pin
Goes in `images/` (e.g. `images/kai_usa.png`). Matches the existing good pins
`celia_mexico.png`, `amanda_brasil.png`, `tamara_chile.png`, etc.

- `RGBA`, transparent corners.
- Canonical native size is **140 × 166**. We render at **2× = 280 × 332** for
  crispness (the current update pins are 280 × 332). Either is fine — the map
  CSS shows them at `120 × 120` with `background-size: contain`
  (`styles.css` → `.country-icon`).
- Shape = a **circle with a small teardrop tail** at the bottom (a map-pin /
  location-marker silhouette).
- A **white ring/border** (~14 px at 140-scale) sits between the photo and the
  silhouette edge, and the **tail is solid white**.

---

## 2. Reverse-engineered geometry (at the native 140 × 166 scale)

Measured from `images/celia_mexico.png` (a known-good pin):

| Element            | Value                                                        |
|--------------------|-------------------------------------------------------------|
| Canvas             | 140 × 166                                                    |
| Pin silhouette     | circle radius **70** centered at **(69.5, 69.5)** + a small tail tapering to a point at ~y=165 |
| Photo disc         | circle diameter **112** (= **0.80 × 140**), centered at **(69.5, 69.5)** |
| White ring         | the ~14 px gap between the 112-disc and the 140 silhouette  |
| Tail               | solid white, part of the silhouette below the circle        |

Key idea: **don't try to draw the teardrop tail by hand.** Reuse the **alpha
channel of an existing good pin** as the silhouette mask — it gives the exact
circle-plus-tail shape for free. Fill it white, then drop the photo disc
(at 80% diameter) on top, centered in the circle.

---

## 3. Procedure

1. **Silhouette** — load a known-good pin (`images/celia_mexico.png`), take its
   alpha channel = the master pin shape. Scale to target size if rendering 2×.
2. **White base** — paste solid white through that alpha. This yields the white
   ring + white tail automatically.
3. **Photo disc** — open the raw, find the disc by its opaque bounding box,
   crop, resize to the photo-disc diameter (112 native / 224 at 2×), and apply
   an anti-aliased circular mask (super-sampled). `min()` the circle mask with
   the raw's own alpha so no stray edge pixels leak in.
4. **Composite** — alpha-composite the disc centered on the circle center.
5. **Save** to `images/<name>_<country>.png`.

### Framing knobs (step 3) — "more head, less chest"
Caro's disc usually includes a lot of chest/shoulders. Two parameters tighten
the crop. They were tuned to **`ZOOM = 0.80`, `VC = 0.42`** for Kai (approved as
"perfect" — keep these as the default starting point):

- `ZOOM` — fraction of the disc used. `< 1` zooms in → bigger head. `0.80`.
- `VC`   — vertical center as a fraction of the disc. `< 0.5` shifts the crop
  up → less chest. `0.42`.

**Constraint (avoid transparent holes):** the visible circle must stay inside
the disc, so `|VC − 0.5| ≤ 0.5 × (1 − ZOOM)`. For `ZOOM = 0.80` that means
`VC ∈ [0.40, 0.60]`. Push `ZOOM` lower for a tighter face, but widen the VC
margin accordingly.

---

## 4. The script

Requires Python with Pillow (`PIL 12.x` was used). Run from the repo root.
Change the marked lines per person.

```python
from PIL import Image, ImageDraw
import numpy as np

# ---- per-person inputs ----
RAW    = '.context/release/v0.2/data update/raw/Kai HSsu  2.png'  # raw disc
OUT    = 'images/kai_usa_update.png'                              # output pin
# ---- framing (defaults approved for Kai) ----
ZOOM   = 0.80   # <1 = zoom in (bigger head)
VC     = 0.42   # <0.5 = shift up (less chest);  keep |VC-0.5| <= 0.5*(1-ZOOM)
# ---- fixed format ----
SCALE  = 2      # 1 -> 140x166 (canonical), 2 -> 280x332 (crisp, current update size)
TEMPLATE = 'images/celia_mexico.png'   # any known-good pin = silhouette source
PHOTO_D  = 112  # photo-disc diameter at native scale (0.80 * 140)

# 1) silhouette from a known-good pin
tmpl = Image.open(TEMPLATE).convert('RGBA')
W, H = tmpl.size
sil_alpha = np.array(tmpl)[:, :, 3]
cx = cy = (W - 1) / 2.0
Wb, Hb = W * SCALE, H * SCALE
sil = Image.fromarray(sil_alpha).resize((Wb, Hb), Image.LANCZOS)
cxb, cyb, pdb = cx * SCALE, cy * SCALE, PHOTO_D * SCALE

# 2) white base through the silhouette alpha (gives white ring + tail)
base = Image.new('RGBA', (Wb, Hb), (0, 0, 0, 0))
base.paste(Image.new('RGBA', (Wb, Hb), (255, 255, 255, 255)), (0, 0), sil)

# 3) raw disc -> framed crop -> circular mask
raw = Image.open(RAW).convert('RGBA')
ra = np.array(raw)[:, :, 3]
ys, xs = np.where(ra > 10)                      # opaque region = the disc
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
D = min(x1 - x0, y1 - y0)                        # disc diameter
dcx, dcy = (x0 + x1) / 2.0, (y0 + y1) / 2.0      # disc center
side = D * ZOOM
left = dcx - side / 2
top  = (y0 + VC * D) - side / 2                  # vertical center at VC of disc
crop = raw.crop((round(left), round(top), round(left + side), round(top + side)))
crop = crop.resize((pdb, pdb), Image.LANCZOS)

ss = 4                                           # supersampled circular mask
m = Image.new('L', (pdb * ss, pdb * ss), 0)
ImageDraw.Draw(m).ellipse((0, 0, pdb * ss - 1, pdb * ss - 1), fill=255)
m = m.resize((pdb, pdb), Image.LANCZOS)
dm = np.minimum(np.array(crop)[:, :, 3], np.array(m))  # also respect raw alpha
crop.putalpha(Image.fromarray(dm))

# 4) composite disc centered on the circle
px = int(round(cxb - pdb / 2))
py = int(round(cyb - pdb / 2))
base.alpha_composite(crop, (px, py))

# 5) save
base.save(OUT)
print('saved', OUT, base.size, 'zoom', ZOOM, 'vc', VC, 'disc', D)
```

---

## 5. Wiring into the map

The map references pins by filename in `scripts/script.js` (`countryIcons` →
`iconUrl`, e.g. line ~101 `iconUrl: 'images/kai_usa.png'`). To deploy a new pin:

- Either save directly over the referenced name (`images/kai_usa.png`), or
- Save as `*_update.png` first to compare, then rename over the real file once
  approved. (We staged `kai_usa_update.png` for review before swapping.)

No code change is needed if you keep the existing filename.

---

## 6. Verify

Always eyeball the output next to an existing good pin (`celia_mexico.png`):

- blue circular background present, orange/purple duotone, white ring, teardrop
  tail, transparent corners;
- no transparent holes inside the circle (if you see any, your `VC` violated the
  constraint in §3 — pull it back toward 0.5 or raise `ZOOM`);
- head framing comparable to the other pins (not too much chest).

---

## Appendix — the 4 pins in this update (v0.2)

| Raw file                        | Output pin (`*_update.png` staged) | Map slot            |
|---------------------------------|------------------------------------|---------------------|
| `Kai HSsu  2.png`               | `images/kai_usa.png`               | `estados-unidos-02` |
| `Giovanna Valentino 3.png`      | `images/giovanna_chile.png`        | `chile-02`          |
| `Laura Orlando 2.png`           | `images/lauraorlando_chile.png`    | `chile-03`          |
| `penelope brou v2.png`          | `images/penelope_peru.png`         | `peru`              |

Per-person framing actually used — **the designer frames each raw differently,
so the same `ZOOM`/`VC` does not fit everyone.** Start from the Kai defaults,
then eyeball and adjust:

| Pin       | `ZOOM` | `VC` | Note                                                        |
|-----------|--------|------|-------------------------------------------------------------|
| Kai       | 0.80   | 0.42 | default; raw has generous torso → tighten onto the head     |
| Penelope  | 0.80   | 0.42 | default works                                               |
| Laura     | 0.80   | 0.42 | default works                                               |
| Giovanna  | 0.86   | 0.54 | raw is a tight head-crop (big blue headroom, little torso). Default left her head too low with no torso. Zoom out + shift window **down** (raise `VC`) to drop the headroom and pull in her shoulders. |

Rule of thumb: if the head looks **too low / too much blue headroom above**,
raise `VC` (shift the crop window down) and/or raise `ZOOM` (zoom out) to bring
in more torso. Mind the constraint `|VC − 0.5| ≤ 0.5 × (1 − ZOOM)`.

Names/countries come from
`.context/release/v0.2/data update/raw/Perfiles Fellows página web.xlsx - Investigadores.csv`.
