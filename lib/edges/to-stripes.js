export function toStripes(e) {
	let y = e[1];
	let x = [], xout = [];
	let xi = 0;
	let o = [];
	let x0, x1;
	for (let i = 0; i < e.length;) {
		let ex = e[i], ey = e[i + 1], el = e[i + 2];

		if (x0 == null && ey > y) {
			[x, xout] = [xout, x];
			xout.length = 0;
			[x0, x1] = x;
			xi = 2;
			y = x.length ? y + 1 : ey;
		}

		if (ey === y && !(ex > x1)) {
			i += 3;
			if (el < 0) {
				let l = -el;
				if (x0 === ex && x1 === ex + l) {
					x0 = x[xi++];
					x1 = x[xi++];
					continue;
				} else if (x0 === ex) {
					x0 += l;
					continue;
				} else if (x1 === ex + l) {
					x1 -= l;
				} else {
					xi -= 2;
					x[xi] = ex + l;
					x[xi + 1] = x1;
					x1 = ex;
				}
			} else {
				let l = el;
				if (ex + l === x0) {
					x0 = ex;
					continue;
				} else if (ex === x1) {
					x1 += l;
					if (x1 === x[xi]) {
						x1 = x[xi + 1];
						xi += 2;
					}
					continue;
				} else {
					xi -= 2;
					x[xi] = x0;
					x[xi + 1] = x1;
					x0 = ex;
					x1 = ex + l;
				}
			}
		}

		xout.push(x0, x1);
		o.push(x0, y, x1 - x0);
		x0 = x[xi++];
		x1 = x[xi++];
	}
	return o;
}
