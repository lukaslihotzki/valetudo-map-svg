import { SaxesParser } from "saxes";

export function parseTemplate(template, { minifier } = {}) {
	let parser = new SaxesParser();
	let target = [];
	let rootEl;
	parser.on("text", function(raw_data) {
		if (!target.length) {
			return;
		}
		let data = minifier ? minifier(target.at(-1)["$name"], raw_data) : raw_data;
		if (data) {
			(target.at(-1)["$child"] ??= []).push(data);
		}
	});
	parser.on("opentag", function(node) {
		let newEl = { "$name": node.name, ...node.attributes };
		let tel = target.at(-1);
		if (tel) {
			(tel["$child"] ??= []).push(newEl);
		}
		target.push(newEl);
	});
	parser.on("closetag", function(node) {
		let el = target.pop();
		if (!target.length) {
			rootEl = el;
		}
	});
	parser.write(template).close();
	return rootEl;
}
