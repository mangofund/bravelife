#!/usr/bin/env python3
"""把品红底的家具插画抠成透明 PNG：PYTHONPATH=.tools/py python3 scripts/pack-furniture.py

输入 images/furn-<主题>-<id>.png，输出 src/static/h5/art/<主题>/furn/<id>.png
做法：按与品红色的距离计算透明度，边缘做半透明过渡并去掉品红色溢边，最后裁掉空白、缩到 256px。
"""
import glob
import os
import sys

from PIL import Image

KEY = (255, 0, 255)
# 距离品红小于 INNER 完全透明，大于 OUTER 完全不透明，中间渐变
INNER = 90
OUTER = 170
SIZE = 256


def key_out(img):
    img = img.convert('RGBA')
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # 品红的特征：红、蓝高，绿低
            d = ((r - KEY[0]) ** 2 + (g - KEY[1]) ** 2 + (b - KEY[2]) ** 2) ** 0.5
            if d <= INNER:
                px[x, y] = (0, 0, 0, 0)
                continue
            alpha = 255 if d >= OUTER else int(255 * (d - INNER) / (OUTER - INNER))
            # 去溢边：边缘像素的红蓝分量不超过绿色太多
            if alpha < 255 or (r > g + 60 and b > g + 60):
                m = max(g, min(r, b) - 40)
                r, b = min(r, m + 40), min(b, m + 40)
            px[x, y] = (r, g, b, min(a, alpha))
    return img


def main():
    files = sorted(glob.glob('images/furn-*.png'))
    if not files:
        print('no furniture images found')
        sys.exit(1)
    for f in files:
        name = os.path.basename(f)[len('furn-'):-len('.png')]
        theme, item = name.split('-', 1)
        out_dir = os.path.join('src/static/h5/art', theme, 'furn')
        os.makedirs(out_dir, exist_ok=True)
        img = Image.open(f)
        img.thumbnail((512, 512))
        img = key_out(img)
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        img.thumbnail((SIZE, SIZE))
        out = os.path.join(out_dir, item + '.png')
        img.save(out, optimize=True)
        print(out, img.size, os.path.getsize(out) // 1024, 'KB')


if __name__ == '__main__':
    main()
