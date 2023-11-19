function* generate(data, map) {
	for (let i = 0; i < data.length; i += 3) {
		let tmp = map(data[i], data[i + 1], data[i + 2]);
		if (tmp != null) {
			yield tmp;
		}
	}
}

function* merge(g1, g2, lt) {
	let e1 = g1.next(), e2 = g2.next();
	while (!e1.done && !e2.done) {
		if (lt(e1.value, e2.value)) {
			yield e1.value;
			e1 = g1.next();
		} else {
			yield e2.value;
			e2 = g2.next();
		}
	}
	for (; !e1.done; e1 = g1.next()) {
		yield e1.value;
	}
	for (; !e2.done; e2 = g2.next()) {
		yield e2.value;
	}
}

function insert(s, xl, xr, proj = x => x) {
	function ins(x) {
		let idx = s.indexOf(proj(-x));
		if (idx === -1) {
			let v = proj(x);
			idx = s.findIndex(el => Math.abs(el) >= Math.abs(v));
			if (idx === -1) {
				idx = s.length;
			}
			s.splice(idx, 0, v);
		} else {
			s.splice(idx, 1);
		}
	}
	ins(xl);
	ins(xr);
}

function flatten(a) {
	let ctr = 0;
	return a.filter(v => {
		ctr += v < 0 ? -1 : 1;
		return +!(v < 0) === ctr;
	});
}

function xor(b, c, y, oedge = []) {
	let bi = 0, ci = 0, prevx = null;
	while (bi < b.length || ci < c.length) {
		let bv = Math.abs(b[bi] ?? Infinity), cv = Math.abs(c[ci] ?? Infinity);
		let bf = +(b[bi] < 0), cf = +(c[ci] < 0);
		let scan = Math.min(bv, cv);
		let scanf = (bv !== scan) ? cf : (cv !== scan) ? bf : Math.max(bf, cf);
		let ib = ((scan - bv || bf - scanf) < 0) ^ bf;
		let ic = ((scan - cv || cf - scanf) < 0) ^ cf;

		if (ib ^ ic ^ (prevx != null)) {
			if (prevx != null) {
				let len = scan - prevx;
				oedge.push(prevx, y, bf ? len : -len);
				prevx = null;
			} else {
				prevx = scan;
			}
		}
		bi += (bv === scan && bf === scanf);
		ci += (cv === scan && cf === scanf);
	}
	return oedge;
}

export function extend(edges, down = 3, right = 3, up = 0, left = 0) {
	edges = merge(
		generate(edges, (x, y, l) => l < 0 ? [x, y + down, l] : null),
		generate(edges, (x, y, l) => l < 0 ? null : [x, y - up, l]),
		([x0, y0, l0], [x1, y1, l1]) => (y0 - y1 || x0 - x1) < 0,
	);

	let proj = v => v - (v < 0 ? right : 0);
	let a = [], c = [], oedge = [], val = edges.next();
	while (!val.done) {
		let [x, y, l] = val.value;

		let xr = x + Math.abs(l);
		let il = x * Math.sign(l), ir = xr * -Math.sign(l);
		insert(a, il, ir, proj);

		val = edges.next();
		if (y === val.value?.at(1)) {
			continue;
		}

		let b = flatten(a);
		xor(b, c, y, oedge);
		c = b;
	}

	return oedge;
}
