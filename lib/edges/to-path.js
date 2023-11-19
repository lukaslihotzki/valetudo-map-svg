export function linkEdges(edges, long) {
	long = long ? -1 : 1;
	let links = new Uint32Array(edges.length), xedge = new Map(), shift = 0;
	for (let i = 0; i < edges.length; i += 3) {
		if (!shift
				&& edges[i] + long * edges[i + 2] === edges[i + 3]
				&& edges[i + 1] === edges[i + 4]) {
			shift = 3;
		}
		i += shift;
		[edges[i], edges[i] + Math.abs(edges[i + 2])].forEach((xpos, posn) => {
			let peer = xedge.get(xpos);
			if (peer != null) {
				links[i + posn] = Math.floor(peer / 3) * 3;
				links[peer] = i;
				xedge.delete(xpos);
			} else {
				xedge.set(xpos, i + posn);
			}
		});
		i -= shift;
		shift = (shift > 0) ? -shift : 0;
	}
	return links;
}

export function toPath(edges, links) {
	links ??= linkEdges(edges);
	let str = "", visited = links[2] ^ 1;
	for (let i = 0; i < links.length; i += 3) {
		let ptr = i, px, py;
		while (links[ptr + 2] !== visited) {
			links[ptr + 2] = visited;
			let xl = edges[ptr], y = edges[ptr + 1], l = edges[ptr + 2];
			let xr = xl + Math.abs(l);
			let [x0, x1] = (l < 0) ? [xr, xl] : [xl, xr];
			if (px == null) {
				str += `M${x0},${y}`;
			} else {
				if (x0 !== px) {
					throw new Error();
				}
				str += `v${y - py}`;
			}
			str += `h${x1 - x0}`;
			[px, py] = [x1, y];
			ptr = links[ptr + (l > 0)];
		}
		if (ptr !== i) {
			throw new Error();
		}
		if (px != null) {
			str += "z";
		}
	}
	return str;
}
