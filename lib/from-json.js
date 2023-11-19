import { fromStripes } from "./edges/from-stripes.js";
import { applyStripes } from "./edges/from-stripes-compat.js";
import { toPath } from "./edges/to-path.js";
import { boundary } from "./edges/misc.js";
import { extend } from "./edges/morph.js";
import { intersect } from "./edges/intersect.js";
import { entityClasses, entityTypes, layerTypes } from "./valetudo-types.js";
import TEMPLATE from "./default-template.js";
import XmlOut from "./xmlout.js";

function entityZIndex({ __class, type }) {
	let o = 0;
	for (let [c, t] of Object.entries(entityClasses)) {
		if (c === __class) {
			o += (t.indexOf(type) + 1);
			break;
		}
		o += t.length + 1;
	}
	return o;
}

export function entityComp(entity1, entity2) {
	return entityZIndex(entity1) - entityZIndex(entity2);
}

function processEntities(entities) {
	entities = entities.toSorted?.(entityComp) ?? [...entities].sort(entityComp);
	let o = 1;
	for (let i = 1; i < entities.length; i++) {
		if (entities[o - 1].__class === "PathMapEntity"
			&& entities[i].__class === "PathMapEntity"
			&& entities[o - 1].type === entities[i].type) {
			if (typeof entities[o - 1].points[0] === "number") {
				entities[o - 1] = { ...entities[o - 1], points: [entities[o - 1].points] };
			}
			entities[o - 1].points.push(entities[i].points);
		} else {
			entities[o++] = entities[i];
		}
	}
	entities.length = o;
	return entities;
}

export function preprocessMap(map, oldProcessed) {
	let layers = map.layers.map(l => {
		let { pixels, compressedPixels, ...tail } = l;
		let edges = applyStripes(fromStripes, pixels, compressedPixels);
		return { ...tail, edges };
	});
	let seglayers = layers.filter(l => l.type === "segment");
	intersect(seglayers.map(l => extend(l.edges, 3, 3)))
		.map((adj, i) => ({ adj, i, l: seglayers[i] }))
		.sort(({ adj: adj1 }, { adj: adj2 }) => adj2.size - adj1.size)
		.forEach(({ adj, i, l }) => {
			let neighborColorBits = Array.from(adj, v => seglayers[v].colorBit ?? 0n);
			let neighborColorMask = neighborColorBits.reduce((a, l) => a | l, 0n);
			l.colorBit = ~neighborColorMask & (neighborColorMask + 1n);
			l.color = Math.log2(Number(l.colorBit));
		});
	let bounds = boundary(layers.find(l => l.type === "wall").edges);
	return { ...map, layers, entities: processEntities(map.entities), bounds };
}

function writeJsonAttribs(meta, extra) {
	let f = x => x === "{}" ? undefined : x;
	return {
		"data-meta": f(JSON.stringify(meta)),
		"data-extra": f(JSON.stringify(extra)),
	};
}

function injectLayers(layers, out) {
	layers.forEach((layer, i, a) => {
		let {
			__class,
			type,
			edges,
			color,
			metaData: { segmentId, name, ...meta },
			...extra
		} = layer;
		delete extra.compressedPixels;
		delete extra.colorBit;
		if (layerTypes[type] !== __class) {
			Object.assign(extra, { __class, type });
		}
		let id = segmentId != null ? `segment${segmentId}` : null;
		let colorClass = color != null ? `color${color + 1}` : null;
		out.element("path", {
			"id": id,
			"class": [type, colorClass].filter(x => x).join(" "),
			"d": edges != null ? toPath(edges) : null,
			...writeJsonAttribs(meta, extra),
		}, out => {
			if (name != null) {
				out.element("title", {}, out => out.text(name));
			}
		});
	});
}

function injectEntities(entities, out) {
	entities.forEach(entity => {
		let { __class, type, points, metaData: { label, ...meta }, ...extra } = entity;
		if (entityTypes[type] !== __class) {
			Object.assign(extra, { __class, type });
		}
		let attr = { "class": type };
		let suffix = "";
		if (__class === "PointMapEntity") {
			if (meta.angle != null) {
				let rad = (meta.angle - 90) * Math.PI / 180;
				points = [points[0] - Math.cos(rad), points[1] - Math.sin(rad), ...points];
				meta.angle = undefined;
			} else {
				suffix = "z";
			}
		} else if (__class === "PolygonMapEntity") {
			suffix = "z";
		} else if (__class !== "PathMapEntity" && __class !== "LineMapEntity") {
			out.element("path", writeJsonAttribs(meta, { ...entity, metaData: undefined }));
			return;
		}
		let mpoints = typeof points[0] === "number" ? [points] : points;
		let str = "", lp = [0, 0];
		mpoints.forEach(points => {
			str += `m${points[0] - lp[0]} ${points[1] - lp[1]}`;
			for (let i = 2; i < points.length; i += 2) {
				let dx = points[i] - points[i - 2], dy = points[i + 1] - points[i - 1];
				str += `${dx < 0 ? "" : " "}${dx}${dy < 0 ? "" : " "}${dy}`;
			}
			str += points.length === 2 ? "z" : suffix;
			lp = points.slice(-2);
		});
		attr.d = str;
		out.element("path", { ...attr, ...writeJsonAttribs(meta, extra) }, out => {
			if (label != null) {
				out.element("title", {}, out => out.text(label));
			}
		});
	});
}

export function mapToSvg(map, template = TEMPLATE) {
	if (map?.layers.some(layer => layer.edges == null)) {
		map = preprocessMap(map);
	}

	let {
		__class,
		layers,
		entities,
		bounds,
		pixelSize,
		metaData: { version, ...meta },
		...extra
	} = map ?? { metaData: {} };

	function serial(out, child) {
		if (!child) {
			return;
		}
		child.forEach(v => {
			if (typeof v === "string") {
				out.text(v);
				return;
			}
			let { "$name": name, "$child": child, ...attr } = v;
			if (attr.id === "layers") {
				attr.transform = pixelSize != null ? `scale(${pixelSize})` : null;
				out.element(name, attr, out => injectLayers(layers ?? [], out));
			} else if (attr.id === "entities") {
				out.element(name, attr, out => injectEntities(entities ?? [], out));
			} else {
				out.element(name, attr, out => serial(out, child));
			}
		});
	}
	return XmlOut.document(out => {
		let { "$name": name, "$child": child, ...attr } = template;
		if (map !== undefined && !(__class === "ValetudoMap" && [1, 2].includes(version))) {
			throw new TypeError("Expected a ValetudoMap, version 1 or 2");
		}
		let viewBox;
		if (bounds != null) {
			let { xmin, xmax, ymin, ymax } = bounds;
			viewBox = [xmin, ymin, xmax - xmin, ymax - ymin].map(x => x * pixelSize).join(" ");
		}
		attr.viewBox = viewBox;
		attr.class = __class;
		attr["data-version"] = "0.1";

		Object.assign(attr, writeJsonAttribs(meta, extra));
		out.element(name, attr, out => serial(out, child));
	});
}
