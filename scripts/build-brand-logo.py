"""Export the existing Maison Zavi typography as a self-contained SVG logo.

Uses the repository's existing fonts; their licence terms still apply.
Run manually with fontTools when changing the brand artwork.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parent.parent


def lettering(text, filename, size, spacing, baseline):
    font = TTFont(ROOT / 'assets/fonts' / filename)
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    scale = size / font['head'].unitsPerEm
    x = 0
    bounds = BoundsPen(glyphs)
    paths = []
    for character in text:
        glyph = glyphs[cmap[ord(character)]]
        pen = SVGPathPen(glyphs)
        transform = (scale, 0, 0, -scale, x, 0)
        glyph.draw(TransformPen(pen, transform))
        glyph.draw(TransformPen(bounds, transform))
        paths.append('<path d="' + pen.getCommands() + '"/>')
        x += glyph.width * scale + spacing
    font.close()
    left, _, right, _ = bounds.bounds
    fit = min(1, 416 / (right - left))
    center = 256 - (left + right) * fit / 2
    return f'<g transform="translate({center} {baseline}) scale({fit})">' + ''.join(paths) + '</g>'


svg = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="Maison Zavi — Wedding and Luxury Cakes">'
svg += '<rect width="512" height="512" rx="32" fill="#491b29"/><g fill="#ddc39a">'
svg += lettering('MAISON', 'boutique-4.ttf', 18, 8, 152)
svg += lettering('ZAVI', 'runethia-regular.otf', 140, 12, 306)
svg += '<rect x="232" y="340" width="48" height="1"/>'
svg += lettering('WEDDING & LUXURY CAKES', 'boutique-4.ttf', 10, 2, 376)
svg += '</g></svg>\n'
(ROOT / 'assets/brand/site-logo.svg').write_text(svg, encoding='utf-8')
print('Exported assets/brand/site-logo.svg')
