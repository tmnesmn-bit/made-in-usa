#!/usr/bin/env python3
"""Scale the extension icon up for the site's home screen icons."""
from PIL import Image
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = Image.open(root / 'extension' / 'icons' / 'icon128.png').convert('RGBA')
for size in (192, 512):
    src.resize((size, size), Image.LANCZOS).save(root / 'site' / f'icon{size}.png')
print('icons written')
