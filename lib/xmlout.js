function xmlEscape(c) {
	return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c] ?? c;
}

class XmlOut {
	static #ok;
	static #quotes = {
		"'": { ch: "'", esc: /[&<']/g },
		'"': { ch: '"', esc: /[&<"]/g },
	};

	static #textEsc = /[&<>]/g;
	#out;
	#empty;
	#quote;
	#esc;
	constructor() {
		if (!XmlOut.#ok) {
			throw "bad";
		}
		this.#out = "";
		this.#quote = XmlOut.#quotes["'"];
	}

	element(name, attr, cb) {
		this.#out += this.#empty ? ">" : "";
		this.#empty = false;
		this.#out += `<${name}`;
		Object.entries(attr ?? {}).forEach(([name, value]) => {
			if (value == null) {
				return;
			}
			this.#out += ` ${name}=${this.#quote.ch}`;
			this.#esc = this.#quote.esc;
			this.text(value);
			this.#out += this.#quote.ch;
		});
		this.#empty = true;
		this.#esc = XmlOut.#textEsc;
		cb?.(this);
		this.#out += this.#empty ? "/>" : `</${name}>`;
		this.#empty = false;
	}

	text(data) {
		if (typeof data === "function") {
			return data(this);
		}
		this.#out += this.#empty ? ">" : "";
		this.#empty = false;
		this.#out += data.replaceAll(this.#esc, xmlEscape);
	}

	static document(fn) {
		XmlOut.#ok = true;
		let out = new XmlOut();
		XmlOut.#ok = false;
		fn(out);
		return out.#out;
	}
}

export default XmlOut;
