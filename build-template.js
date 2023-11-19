import { parseTemplate } from "valetudo-map-svg/template";
import * as fs from "node:fs";
import CleanCSS from "clean-css";

process.chdir(new URL(".", import.meta.url).pathname);

const input = fs.readFileSync("default-template.svg", "utf-8");
const template = parseTemplate(input, {
	minifier: (tag, text) => tag === "style" ? new CleanCSS().minify(text).styles : text.trim(),
});

let code = `
// Auto-generated file

// eslint-disable-next-line
export default ${JSON.stringify(template)};
`;

fs.writeFileSync("lib/default-template.js", code.trimStart());
