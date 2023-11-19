import { fromPath } from "./edges/from-path.js";
import { toStripes } from "./edges/to-stripes.js";
import { parsePath } from "./parse-path.js";
import { layerTypes, entityTypes } from "./valetudo-types.js";
import { SaxesParser } from "saxes";

export function svgToMap(xml) {
	let parser = new SaxesParser();
	let tags = [];
	let map;

	parser.on("text", function(data) {
		if (tags.at(-1)?.el === "title") {
			if (tags.at(-3)?.id === "layers") {
				map.layers.at(-1).metaData.name = data;
			} else {
				map.entities.at(-1).metaData.label = data;
			}
		}
	});
	parser.on("opentag", function(node) {
		let { id } = node.attributes;
		tags.push({ el: node.name, id });
		if (tags.length === 1) {
			let classes = Array.from(node.attributes.class.matchAll(/\S+/g));
			let [__class] = classes.find(([c]) => c === "ValetudoMap");
			let version = node.attributes["data-version"];
			if (version !== "0.1") {
				throw TypeError("Unsupported Valetudo Map SVG version " + version);
			}
			map = {
				...JSON.parse(node.attributes["data-extra"] ?? "{}"),
				metaData: { ...JSON.parse(node.attributes["data-meta"] ?? "{}"), version: 2 },
				__class,
			};
		}
		if (id === "layers" || id === "entities") {
			map[id] = [];
		}
		if (id === "layers") {
			map.pixelSize = +node.attributes.transform.match(/^scale\((\d+)\)$/)[1];
		}
		if (tags.at(-2)?.id === "layers") {
			let classes = Array.from(node.attributes.class.matchAll(/\S+/g));
			let [type] = classes.find(([c]) => layerTypes[c] != null) ?? [];
			let __class = layerTypes[type];
			map.layers.push({
				__class,
				type,
				...JSON.parse(node.attributes["data-extra"] ?? "{}"),
				pixels: [],
				compressedPixels: toStripes(fromPath(node.attributes.d)),
				metaData: {
					...JSON.parse(node.attributes["data-meta"] ?? "{}"),
					segmentId: id?.match(/^segment(.*)$/, "")?.[1],
				},
			});
		}
		if (tags.at(-2)?.id === "entities") {
			let classes = Array.from(node.attributes.class.matchAll(/\S+/g));
			let [type] = classes.find(([c]) => entityTypes[c] != null) ?? [];
			let __class = entityTypes[type];
			let tmpl = {
				__class,
				type,
				...JSON.parse(node.attributes["data-extra"] ?? "{}"),
				metaData: {
					...JSON.parse(node.attributes["data-meta"] ?? "{}"),
				},
			};
			let points = [];
			parsePath(node.attributes.d, {
				moveTo(x, y) {
					points.push([x, y]);
				},
				lineTo(x, y) {
					points.at(-1).push(x, y);
				},
			});
			points.forEach(line => {
				let entity = { ...tmpl, points: line };
				if (__class === "PointMapEntity") {
					let [tx, ty, x, y] = line;
					if (y != null) {
						let rad = Math.atan2(y - ty, x - tx);
						entity.metaData.angle = +(rad * 180 / Math.PI + 90).toFixed(8);
						entity.points = [x, y];
					}
				}
				map.entities.push(entity);
			});
		}
	});
	parser.on("closetag", function(node) {
		tags.pop();
	});

	parser.write(xml).close();
	return map;
}
