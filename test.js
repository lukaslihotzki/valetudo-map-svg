import { stdin } from "node:process";
import assert from "node:assert";
import { gzipSync } from "node:zlib";
import fs from "node:fs/promises";

import { spawn } from "node:child_process";

import { entityComp, preprocessMap, mapToSvg } from "valetudo-map-svg/from-json";
import { svgToMap } from "valetudo-map-svg/to-json";

let fromAsyncIterable = iterable => ({
	iterator: iterable[Symbol.asyncIterator](),
	async pull(controller) {
		let { value, done } = await this.iterator.next();
		if (done) {
			controller.close();
		} else {
			controller.enqueue(value);
		}
	},
});

let splitStream = delimiter => ({
	buf: "",
	transform(chunk, controller) {
		let arr = (this.buf + chunk).split(delimiter);
		this.buf = arr.pop();
		arr.forEach(x => controller.enqueue(x));
	},
});

const chars = new ReadableStream(fromAsyncIterable(stdin))
	.pipeThrough(new TextDecoderStream())
	.pipeThrough(new TransformStream(splitStream("\n")));

let last;
for await (const line of chars) {
	let content = await fs.readFile(line, "utf-8");
	let base = line.replace(/.json$/, "");
	let map = JSON.parse(content);
	let t1 = Date.now();
	let svg = mapToSvg(preprocessMap(map));
	let t2 = Date.now();
	await fs.writeFile(base + ".svg", svg, "utf-8");
	let t3 = Date.now();
	let mapStr = JSON.stringify(svgToMap(svg));
	let t4 = Date.now();
	let map2 = JSON.parse(mapStr);
	[map, map2].forEach(m => m.entities.sort(entityComp).forEach(({ metaData }) => {
		if (metaData.angle != null) {
			metaData.angle = Math.round((metaData.angle + 360) % 360);
		}
	}));
	if (map.metaData.version !== 1) {
		try {
			assert.deepStrictEqual(map2, map);
		} catch (e) {
			console.error(e);
		}
	}
	console.log(base,
		mapStr.length, svg.length,
		gzipSync(mapStr).length, gzipSync(svg).length,
		t2 - t1, t4 - t3,
	);
	last = { base, map, content, svg, mapStr };
}

{
	let { content, svg, mapStr } = last;
	await Promise.all([[content, svg], [svg, mapStr]].map(async([input, expect]) => {
		let p = spawn("npx", ["valetudo-map-svg"], {});
		p.stdin.write(input);
		p.stdin.end();
		let data = "";
		for await (const chunk of p.stdout) {
			data += chunk;
		}
		try {
			assert.equal(data.trim(), expect);
		} catch (e) {
			console.error(e);
		}
	}));
}

{
	let p = spawn("inkscape", [`--export-filename=${last.base}.ink.svg`, "--", `${last.base}.svg`]);
	await new Promise((resolve, reject) => p.on("close", resolve));
	let content = await fs.readFile(`${last.base}.ink.svg`, "utf-8");
	try {
		assert.deepStrictEqual(last.map, JSON.parse(JSON.stringify(svgToMap(content))));
	} catch (e) {
		console.error(e);
	}
}
