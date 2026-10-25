# YouTube Channel Art: Safe Zones & Mathematical Geometry Guide

A strict technical reference for engineers, designers, and AI agents building responsive YouTube channel art.

---

## 1. Master Canvas Specifications

- **Aspect Ratio**: `16:9`
- **Native Dimensions**: `2560 x 1440 px`
- **File Weight Limit**: Maximum `6 MB`
- **Supported Formats**: `PNG`, `JPEG`, `WEBP`, or programmatically rendered `SVG` (exported to PNG at 2560x1440).
- **SVG ViewBox**: `viewBox="0 0 2560 1440"`

---

## 2. Cross-Device Cropping Coordinates

YouTube uses a single master image (`2560 x 1440 px`) and dynamically crops it depending on the client viewport.

```
(0,0)                                                                 (2560,0)
+----------------------------------------------------------------------------+
|                                                                            |
|                              TV DISPLAY BLEED                              |
|                            (2560 x 1440 Total)                             |
|                                                                            |
|  (0, 508.5)                                                    (2560, 508.5)
|  +----------------------------------------------------------------------+  |
|  |                   DESKTOP SLICE (2560 x 423)                         |  |
|  |                                                                      |  |
|  |           (352.5, 508.5)                           (2207.5, 508.5)   |  |
|  |           +---------------------------------------------+            |  |
|  |           |         TABLET SLICE (1855 x 423)           |            |  |
|  |           |                                             |            |  |
|  |           |  (507, 508.5)                 (2053, 508.5) |            |  |
|  |           |  +---------------------------------------+  |            |  |
|  |           |  |      MOBILE & TEXT SAFE AREA          |  |            |  |
|  |           |  |          (1546 x 423)                 |  |            |  |
|  |           |  |                                       |  |            |  |
|  |           |  |   CRITICAL BRANDING, LOGOS, TEXT,     |  |            |  |
|  |           |  |   AND SUBJECT FACES LIVE HERE         |  |            |  |
|  |           |  |                                       |  |            |  |
|  |           |  +---------------------------------------+  |            |  |
|  |           |  (507, 931.5)                 (2053, 931.5) |            |  |
|  |           +---------------------------------------------+            |  |
|  |           (352.5, 931.5)                           (2207.5, 931.5)   |  |
|  |                                                                      |  |
|  +----------------------------------------------------------------------+  |
|  (0, 931.5)                                                    (2560, 931.5)
|                                                                            |
|                              TV DISPLAY BLEED                              |
|                                                                            |
+----------------------------------------------------------------------------+
(0,1440)                                                             (2560,1440)
```

### Coordinate Bounding Boxes

| Viewport | X Range (`minX` to `maxX`) | Y Range (`minY` to `maxY`) | Width | Height |
|---|---|---|---|---|
| **TV Full** | `0` to `2560` | `0` to `1440` | `2560 px` | `1440 px` |
| **Desktop Full** | `0` to `2560` | `508.5` to `931.5` | `2560 px` | `423 px` |
| **Tablet** | `352.5` to `2207.5` | `508.5` to `931.5` | `1855 px` | `423 px` |
| **Universal Safe Area** | **`507` to `2053`** | **`508.5` to `931.5`** | **`1546 px`** | **`423 px`** |

---

## 3. The Three Critical Safe Zones Rules

### Rule 1: The Safe Area Center Anchor
The center point of the safe area is:
- **X Center**: `(507 + 2053) / 2 = 1280.0 px`
- **Y Center**: `(508.5 + 931.5) / 2 = 720.0 px`
The center of the safe area is precisely the optical center of the master canvas.

### Rule 2: Left Content Anchor (Text Block)
For standard left-aligned or split layouts:
- **Start X**: `580 px` to `600 px` (leaves an intentional 70-90px breathing room from the left mobile edge).
- **Max Text Width**: `900 px` (prevents text from colliding with right-side visual artwork).
- **Y Range**: Vertically centered between `y = 560` and `y = 880`.

### Rule 3: Right Content Anchor (Visual Artwork / Cutouts)
- **Start X**: `1480 px` to `1520 px`.
- **Max Art Width**: `480 px` to `500 px`.
- **End X**: `2000 px` (ensures at least 50px buffer before the mobile crop at `2053 px`).

---

## 4. YouTube UI Overlay Interference

On the live YouTube channel page, YouTube overlays UI elements over the banner:

1. **Channel Avatar / Profile Picture**:
   - On **Desktop**: Rendered *below* the banner in modern YouTube UI (no overlap).
   - On **Mobile App**: Rendered *below* the banner with header details.
   - On **Older/Embedded Web**: Occasionally overlaps the bottom-left corner (`x: 507-650, y: 850-931.5`).
   - **Defensive Rule**: Do not place micro-text or critical disclaimers in the absolute bottom-left corner.

2. **Channel Links & Social Badges (Desktop)**:
   - YouTube renders clickable link pills (e.g. `website.com`, Twitter, Instagram) in the **bottom-right corner** of the desktop slice (`x: 2100 to 2500, y: 860 to 920`).
   - **Defensive Rule**: Keep the bottom-right of the desktop slice clear of primary messaging; treat it as ambient texture or extended background bleed.

---

## 5. Responsive Verification Script (JavaScript / Node)

Use this programmatic check to verify that all SVG text and graphical elements stay within the safe area:

```javascript
// Bounding box verification for SVG elements
const SAFE_BOUNDS = {
  minX: 507,
  maxX: 2053,
  minY: 508.5,
  maxY: 931.5,
  width: 1546,
  height: 423
};

function verifySafeBounds(elementX, elementY, elementWidth, elementHeight) {
  const isInsideX = elementX >= SAFE_BOUNDS.minX && (elementX + elementWidth) <= SAFE_BOUNDS.maxX;
  const isInsideY = elementY >= SAFE_BOUNDS.minY && (elementY + elementHeight) <= SAFE_BOUNDS.maxY;
  
  return {
    compliant: isInsideX && isInsideY,
    overflowX: Math.max(0, SAFE_BOUNDS.minX - elementX) + Math.max(0, (elementX + elementWidth) - SAFE_BOUNDS.maxX),
    overflowY: Math.max(0, SAFE_BOUNDS.minY - elementY) + Math.max(0, (elementY + elementHeight) - SAFE_BOUNDS.maxY)
  };
}
```
