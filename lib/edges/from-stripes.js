class MonotonicityError extends RangeError {
	constructor(message) {
		super(message ?? MonotonicityError.name);
	}

	get name() {
		return MonotonicityError.name;
	}
}

export function fromStripes(stripes) {
	let li = 0, lf = 0, i = 0, f = 0, edges = [], prevx = null;
	let x = stripes[0], y = stripes[1], lx = x, ly = y + 1;
	while (li < stripes.length) {
		let [scanx, scany, scanf] = (y - ly || x - lx || lf - f) < 0 ? [x, y, f] : [lx, ly, lf];
		let a = ((scany - ly || scanx - lx || lf - scanf) < 0) ^ lf;
		let b = ((scany - y || scanx - x || f - scanf) < 0) ^ f;

		if (a ^ b ^ (prevx != null)) {
			if (prevx != null) {
				let len = scanx - prevx;
				edges.push(prevx, scany, f ? len : -len);
				prevx = null;
			} else {
				prevx = scanx;
			}
		}
		if (lx === scanx && ly === scany && lf === scanf) {
			lf ^= 1;
			if (lf) {
				lx += stripes[li + 2];
			} else {
				lx = stripes[li += 3];
				ly = stripes[li + 1] + 1;
			}
		}
		if (x === scanx && y === scany && f === scanf) {
			f ^= 1;
			if (f) {
				x += stripes[i + 2];
			} else {
				let nx = stripes[i += 3] ?? 0;
				let ny = stripes[i + 1] ?? stripes[stripes.length - 2] + 2;
				if (((ny - y) || (nx - x)) < 0) {
					throw new MonotonicityError();
				}
				[x, y] = [nx, ny];
			}
		}
	}
	return edges;
}
