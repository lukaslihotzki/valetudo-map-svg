import { Heap } from "@datastructures-js/heap";

function insert(s, x, si) {
	let idx = s.findIndex(([el]) => el === -x);
	if (idx === -1) {
		idx = s.findIndex(([el]) => Math.abs(el) >= Math.abs(x));
		if (idx === -1) {
			idx = s.length;
		}
		s.splice(idx, 0, [x, si]);
		return idx + 1;
	} else {
		s.splice(idx, 1);
		return idx;
	}
}

export function intersect(segments) {
	let pos = new Uint32Array(segments.length);
	let result = segments.map(() => new Set());
	let heap = Heap.heapify(
		segments.map((_, i) => i),
		(i, j) => {
			let pi = pos[i], pj = pos[j], si = segments[i], sj = segments[j];
			return (sj[pj + 1] - si[pi + 1] || sj[pj] - si[pi]) < 0;
		},
	);
	let a = [];
	while (heap.size()) {
		let i = heap.extractRoot();
		let s = segments[i], p = pos[i];
		let x = s[p], l = s[p + 2];

		let xr = x + Math.abs(l);
		let il = x * Math.sign(l), ir = xr * -Math.sign(l);
		let li = insert(a, il, i);
		let ri = insert(a, ir, i);
		for (let j = li; j < ri; j++) {
			result[i].add(a[j][1]);
		}
		pos[i] += 3;
		if (pos[i] < segments[i].length) {
			heap.insert(i);
		}
	}
	result.forEach((v, i) => v.forEach(l => result[l].add(i)));
	return result;
}
