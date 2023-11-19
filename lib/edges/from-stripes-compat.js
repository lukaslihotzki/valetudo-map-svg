export function toStripes(pixels, fallback) {
	if (!pixels?.length) {
		return fallback ?? [];
	}
	let result = [pixels[0], pixels[1], 1];
	for (let i = 2; i < pixels.length; i += 2) {
		let x = pixels[i], y = pixels[i + 1];
		if (result[result.length - 3] + result[result.length - 1] === x
			&& result[result.length - 2] === y) {
			result[result.length - 1]++;
		} else {
			result.push(x, y, 1);
		}
	}
	return result;
}

function chunkedSort(flat, n) {
	let chunked = [];
	flat?.forEach(v => {
		if (chunked.at(-1)?.length < n) {
			chunked.at(-1).push(v);
		} else {
			chunked.push([v]);
		}
	});
	return chunked?.sort(([x1, y1], [x2, y2]) => (y1 - y2) || (x1 - x2)).flat();
}

export function applyStripes(func, pixels, stripes) {
	try {
		return func(toStripes(pixels, stripes));
	} catch (e) {
		if (e.name === "MonotonicityError") {
			return func(toStripes(chunkedSort(pixels, 2), chunkedSort(stripes, 3)));
		} else {
			throw e;
		}
	}
}
