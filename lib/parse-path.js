export function parsePath(path, visitor) {
	let pos = [0, 0], rel, c, i;
	const cmds = {
		"m": ["moveTo", 0, 2, "l"],
		"l": ["lineTo", 0, 2, "l"],
		"h": ["lineTo", 0, 1, "h"],
		"v": ["lineTo", 1, 2, "v"],
		"z": ["close", 2, 2, "z"],
	};
	for (let { 1: num, 2: cmd, index } of path.matchAll(/(-?[\d.]+)|([^ ,])/g)) {
		if (cmd) {
			let lcmd = cmd.toLowerCase();
			rel = cmd === lcmd;
			c = cmds[lcmd];
			if (c == null) {
				throw new Error(`unexpected char '${cmd}' at ${index}`);
			}
			i = c[1];
		} else if (num !== "") {
			pos[i] = (rel && pos[i]) + +num;
			i++;
			if (i === c[2]) {
				visitor[c[0]]?.(...pos);
				c = cmds[c[3]];
				i = c[1];
			}
		}
	}
	return visitor;
}
