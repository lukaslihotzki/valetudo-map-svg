# Valetudo Map SVG

Map SVG is an alternative representation of Map JSON. With this software, Map SVG can be generated from and converted back to Map JSON.

## Usage

This repo provides
- the [JS Web Converter](https://lukaslihotzki.github.io/valetudo-map-svg/convert.xhtml)
- the CLI `npx valetudo-map-svg`, where you can pipe in Map JSON or Map SVG and the other format is piped out
- this package as a library for your JS software

## Rationale

Map SVG may be easier to use, because common software like web browsers and file browsers can directly render it. That's also why Map SVG contains embedded styling (and the segment coloring). Styling is done with CSS, so you can restyle Map SVG by swapping out the `style` or `marker` elements. Even with embedded styling, Map SVG is usually [smaller](https://github.com/lukaslihotzki/valetudo-map-svg/wiki/File-sizes) than Map JSON, either compared as plain text or gzipped, because it uses a more efficient textual encoding. While Map SVG is easy to use for your own software if you want to show the map, the widespread support of SVG should make even more advanced use cases possible. For example, the [Map JSON to Minecraft export](https://github.com/Hypfer/Valetudo-Minecraft-Mapper) could possibly be implemented by importing Map SVG in a CAD tool, extrude it, and export it with an ordinary CAD to Minecraft tool.

## Performance

Conversion of Map JSON's `compressedPixels` to an SVG path (and back) is non-trivial. The implementation is optimized, so it only needs constant extra space (excluding the input and output data). Runtime is $O(n)$ for conversion to SVG (if the input is pre-sorted) and $O(n*log(n))$ for conversion back to JSON, where $n$ is the input data size. Consequentially, the number of pixels is irrelevant (no unpacking to `pixels` or bitmaps).

Segment coloring is done with sweep line algorithms. When $k$ is the maximum number of intervals in any single line of the map, the extra space needed is $O(k)$ and the runtime is $O(n*k)$. This also avoids storing and processing single pixels.
