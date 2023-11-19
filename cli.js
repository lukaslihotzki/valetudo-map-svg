#!/usr/bin/env node

import { mapToSvg } from "valetudo-map-svg/from-json";
import { svgToMap } from "valetudo-map-svg/to-json";
import * as fs from "node:fs";

// we use stdout for JSON or XML exclusively
console = new console.Console({ stdout: process.stderr, stderr: process.stderr });

const input = fs.readFileSync(0, "utf-8");
if (input.trimStart()[0] === "<") {
	fs.writeFileSync(1, JSON.stringify(svgToMap(input)) + "\n");
} else {
	fs.writeFileSync(1, mapToSvg(JSON.parse(input)) + "\n");
}
