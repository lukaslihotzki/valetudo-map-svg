import { Heap } from "@datastructures-js/heap";
import { parsePath } from "../parse-path.js";

export function fromPathSimple(path) {
	let { arr } = parsePath(path, {
		arr: [],
		moveTo(x, y) {
			this.pos = [x, y];
		},
		lineTo(x, y) {
			let [ox, oy] = this.pos;
			this.pos = [x, y];
			if (oy === y) {
				this.arr.push([Math.min(x, ox), y, x - ox]);
			} else if (ox !== x) {
				throw new Error("invalid edge");
			}
		},
	});
	return arr.sort(([x0, y0], [x1, y1]) => (y0 - y1 || x0 - x1)).flat();
}

export function fromPath(path) {
	let heap = new Heap(([x0, y0], [x1, y1]) => (y1 - y0 || x1 - x0) < 0);
	let result = [];
	parsePath(path, {
		moveTo(...arr) {
			this.pos = arr;
			while (heap._compare(arr, heap.root() ?? [])) {
				result.push(...heap.extractRoot());
			}
		},
		lineTo(x, y) {
			let [ox, oy] = this.pos;
			this.pos = [x, y];
			if (oy === y) {
				heap.insert([Math.min(x, ox), y, x - ox]);
			} else if (ox !== x) {
				throw new Error("invalid edge");
			}
		},
	});
	while (heap.size()) {
		result.push(...heap.extractRoot());
	}
	return result;
}
