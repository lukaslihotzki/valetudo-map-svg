# Edges

Edges are used as intermediate representation between `compressedPixels` (called stripes) and SVG paths. They are also used for the segment coloring contact check, implemented as extending each segment and then checking intersections. Only horizontal edges are stored explicitly. The format is similar to `compressedPixels` (x, y, length). Upper edges (where the pixel below the edge is set) are stored with positive length, lower edges with negative length. Irrespective of the sign, the length points in positive x direction.
