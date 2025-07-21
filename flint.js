/*
	Flint provides interfaces for creating elements and selecting elements.
	1) Creating elements with _:
		const list_item = _(`
			li[class=$1] $2
		`, ["red", "Red Item"])
		document.body.appendChild(list_item)
	2) Selecting elements with $:
		const title = $("h1")
		title.textContent = "New Title"
*/

const addHelpers = (element, $all) => {
	element.on = element.addEventListener.bind(element)
	element.forEach = (f) => $all.forEach(f)
	element.$ = (selector) => $(selector, element)
	element.length = $all ? $all.length : 1
}

const _ = (template, args) => {
	const flint_args = args || []
	
	let flint = template
		.split("\n")
		.filter((x) => x.trim() !== "")
		.map((original_text) => {
			return {
				text: original_text.trim(),
				level: original_text.match(/^([\s]*)/)[0].length,
			}
		})

	const createElement = (nodes, index = 0, parent = null) => {
		if (index >= nodes.length) {
			return null
		}
		const node = nodes[index]

		const attributes = (node.text.match(/\[[^\]]*\]/g) || []).map((attr) => {
			let [key, value] = attr.slice(1, -1).split("=")
			if (key.startsWith("$")) {
				const arg_index = Number(key.slice(1)) - 1
				key = flint_args[arg_index]
			}
			if (value) {
				if (value.startsWith("$")) {
					const arg_index = Number(value.slice(1)) - 1
					value = flint_args[arg_index]
				} else if (value.startsWith(`"`) && value.endsWith(`"`)) {
					value = value.slice(1, -1)
				} else if (value.startsWith(`'`) && value.endsWith(`'`)) {
					value = value.slice(1, -1)
				}
			} else {
				value = ""
			}
			return {
				key,
				value,
			}
		})

		node.text = node.text.replace(/\[[^\]]*\]/g, "")
		const parts = node.text.split(" ")
		let tag = parts[0]
		const rest = parts.slice(1).join(" ")

		let element = null

		if (tag.startsWith("$")) {
			const arg_index = Number(tag.slice(1)) - 1
			const arg = flint_args[arg_index]

			if (typeof arg === "string") {
				element = document.createTextNode(arg)
			} else if (Array.isArray(arg)) {
				element = document.createDocumentFragment()
				arg.forEach((child) => element.appendChild(child))
			} else {
				element = arg
			}
		} else {
			element = document.createElement(tag)

			attributes.forEach((attr) => {
				if (
					attr.value !== false
					&& attr.value !== 0
					&& attr.value !== null
					&& attr.value !== undefined
				) {
					element.setAttribute(attr.key, attr.value)
				}
			})

			if (rest.includes("$")) {
				const content = rest.replace(/\$\d+/g, (match) => {
					const arg_index = Number(match.slice(1)) - 1
					return flint_args[arg_index] !== undefined
						? flint_args[arg_index]
						: match
				})
				if (element.tagName === "TEXTAREA") {
					element.value = content
				} else {
					element.textContent = content
				}
			} else if (rest.length) {
				element.textContent = rest
			}
		}

		if (parent) {
			parent.appendChild(element)
		}

		const children = []
		let child_level = false
		for (let i = index + 1; i < nodes.length; i++) {
			if (nodes[i].level > node.level) {
				if (!child_level) {
					child_level = nodes[i].level
				}
				if (nodes[i].level === child_level) {
					createElement(nodes, i, element)
				}
			} else {
				break
			}
		}

		return element
	}

	const rootElement = document.createElement("div")

	let child_level = false
	for (let i = 0; i < flint.length; i++) {
		if (!child_level) {
			child_level = flint[i].level
		}
		if (flint[i].level === child_level) {
			createElement(flint, i, rootElement)
		}
	}

	if (rootElement.children.length === 1) {
		addHelpers(rootElement.children[0])
		return rootElement.children[0]
	} else {
		addHelpers(rootElement)
		return rootElement
	}
}

const $ = (selector, element) => {
	element = element || document
	const $all = element.querySelectorAll(selector)

	$all.forEach((element) => addHelpers(element, $all))

	if ($all.length === 1) {
		return $all[0]
	} else if ($all.length === 0) {
		return null
	} else {
		return $all
	}
}