export function boundary(edges) {
	let xmin, xmax;
	for (let i = 0; i < edges.length; i += 3) {
		let x = edges[i], l = edges[i + 2];
		if (!(xmin < x)) {
			xmin = x;
		}
		if (!(xmax > x + l)) {
			xmax = x + l;
		}
	}
	return { xmin, xmax, ymin: edges[1], ymax: edges[edges.length - 2] };
}
