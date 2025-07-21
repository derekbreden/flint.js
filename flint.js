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

const $ = (selector, element) => {
	element = element || document
	const $all = element.querySelectorAll(selector)

	$all.forEach((el) => $.addHelpers(el, $all))

	if ($all.length === 1) {
		return $all[0]
	} else if ($all.length === 0) {
		return null
	} else {
		return $all
	}
}

// Dependency tracking infrastructure
$.dependency_map = new Map() // Map<string, Set<{fn, node}>>
$.tracking_stack = [] // Stack for capturing dependencies during function execution

$.addHelpers = (element, $all) => {
	element.on = element.addEventListener.bind(element)
	element.forEach = (f) => $all.forEach(f)
	element.$ = (selector) => $(selector, element)
	element.length = $all ? $all.length : 1
}

$.executeWithTracking = (fn, target_node) => {
	const tracking_context = {
		fn: fn,
		node: target_node,
		dependencies: new Set()
	}
	
	$.tracking_stack.push(tracking_context)
	const result = fn()
	$.tracking_stack.pop()
	
	// Store dependencies in the global map
	tracking_context.dependencies.forEach(prop => {
		if (!$.dependency_map.has(prop)) {
			$.dependency_map.set(prop, new Set())
		}
		$.dependency_map.get(prop).add(tracking_context)
	})
	
	return result
}

$.createTemplate = (template, args) => {
	// Don't execute functions yet - we'll do that when creating DOM nodes
	const flint_args = (args || []).map(arg => {
		return arg // Keep functions as-is for now
	})
	
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
			let is_reactive = false
			
			if (key.startsWith("$")) {
				const arg_index = Number(key.slice(1)) - 1
				key = flint_args[arg_index]
			}
			if (value) {
				if (value.startsWith("$")) {
					const arg_index = Number(value.slice(1)) - 1
					const arg = flint_args[arg_index]
					
					if (typeof arg === "function") {
						is_reactive = true
						value = arg // Keep function for later execution
					} else {
						value = arg
					}
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
				is_reactive,
			}
		})

		node.text = node.text.replace(/\[[^\]]*\]/g, "")
		const parts = node.text.split(" ")
		let tag = parts[0]
		const rest = parts.slice(1).join(" ")

		let element = null

		if (tag.startsWith("$")) {
			const arg_index = Number(tag.slice(1)) - 1
			let arg = flint_args[arg_index]

			// Execute function with tracking if needed
			let tracking_context = null
			if (typeof arg === "function") {
				const placeholder_node = document.createTextNode("") // Temporary placeholder
				tracking_context = {
					fn: arg,
					node: placeholder_node,
					dependencies: new Set()
				}
				
				$.tracking_stack.push(tracking_context)
				arg = arg()
				$.tracking_stack.pop()
			}

			if (typeof arg === "string") {
				element = document.createTextNode(arg)
			} else if (Array.isArray(arg)) {
				if (tracking_context) {
					// For reactive arrays, create a wrapper span to contain the elements
					element = document.createElement("span")
					element.style.display = "contents" // Make wrapper invisible
					arg.forEach((child) => element.appendChild(child))
				} else {
					// For static arrays, use DocumentFragment (original behavior)
					element = document.createDocumentFragment()
					arg.forEach((child) => element.appendChild(child))
				}
			} else {
				element = arg
			}
			
			// Update tracking context to point to actual element
			if (tracking_context) {
				tracking_context.node = element
				
				// Store dependencies in the global map
				tracking_context.dependencies.forEach(prop => {
					if (!$.dependency_map.has(prop)) {
						$.dependency_map.set(prop, new Set())
					}
					$.dependency_map.get(prop).add(tracking_context)
				})
			}
		} else {
			element = document.createElement(tag)

			// First pass: set static attributes and collect reactive ones
			const reactive_attributes = []
			attributes.forEach((attr) => {
				if (attr.is_reactive) {
					reactive_attributes.push(attr)
				} else if (
					attr.value !== false
					&& attr.value !== 0
					&& attr.value !== null
					&& attr.value !== undefined
				) {
					element.setAttribute(attr.key, attr.value)
				}
			})
			
			// Second pass: execute and track reactive attributes after element creation
			reactive_attributes.forEach((attr) => {
				const tracking_context = {
					fn: attr.value,
					element: element,
					attributeName: attr.key,
					dependencies: new Set()
				}
				
				$.tracking_stack.push(tracking_context)
				const result = attr.value()
				$.tracking_stack.pop()
				
				// Set the initial attribute value - mirror static attribute logic
				if (
					result !== false
					&& result !== 0
					&& result !== null
					&& result !== undefined
				) {
					element.setAttribute(attr.key, result)
				} else {
					element.removeAttribute(attr.key)
				}
				
				// Store dependencies in the global map
				tracking_context.dependencies.forEach(prop => {
					if (!$.dependency_map.has(prop)) {
						$.dependency_map.set(prop, new Set())
					}
					$.dependency_map.get(prop).add(tracking_context)
				})
			})

			if (rest.includes("$")) {
				// Handle single parameter as content: "div $1" case
				const match = rest.match(/^\$(\d+)$/)
				if (match) {
					const arg_index = Number(match[1]) - 1
					let arg = flint_args[arg_index]
					
					// Execute function with tracking if needed
					if (typeof arg === "function") {
						arg = $.executeWithTracking(arg, element)
					}
					
					if (arg !== undefined) {
						if (typeof arg === "string" || typeof arg === "number") {
							if (element.tagName === "TEXTAREA") {
								element.value = arg
							} else {
								element.textContent = arg
							}
						} else if (arg && typeof arg === "object" && arg.nodeType) {
							// DOM element - append as child
							element.appendChild(arg)
						} else if (Array.isArray(arg)) {
							arg.forEach(child => element.appendChild(child))
						}
					}
				} else {
					// Unsupported: mixed text and parameters
					throw new Error(`Unsupported template syntax: "${rest}". Use either static text or a single parameter like $1.`)
				}
			} else if (rest.length) {
				element.textContent = rest
			}
		}

		if (parent) {
			parent.appendChild(element)
		}

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

	const root_element = document.createElement("div")

	let child_level = false
	for (let i = 0; i < flint.length; i++) {
		if (!child_level) {
			child_level = flint[i].level
		}
		if (flint[i].level === child_level) {
			createElement(flint, i, root_element)
		}
	}

	if (root_element.children.length === 1) {
		$.addHelpers(root_element.children[0])
		return root_element.children[0]
	} else {
		$.addHelpers(root_element)
		return root_element
	}
}

$.createReactiveProxy = (obj, rootProp = null) => {
	return new Proxy(obj, {
		get(target, prop) {
			// Track property access for dependency tracking
			if ($.tracking_stack.length > 0) {
				const current_context = $.tracking_stack[$.tracking_stack.length - 1]
				current_context.dependencies.add(rootProp || prop)
			}
			
			const value = target[prop]
			
			// Intercept array methods
			if (Array.isArray(target) && typeof value === "function") {
				const mutatingMethods = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"]
				if (mutatingMethods.includes(prop)) {
					return function(...args) {
						const changedProp = rootProp || "array"
						
						// Auto-wrap any object arguments before calling original method
						const wrappedArgs = args.map(arg => {
							if (arg && typeof arg === "object" && !arg.nodeType) {
								return $.createReactiveProxy(arg, changedProp)
							}
							return arg
						})
						
						const result = target[prop].apply(target, wrappedArgs)
						
						// Trigger reactivity after mutation
						$.reExecuteDependentFunctions(changedProp)
						
						return result
					}
				}
			}
			
			if (value && typeof value === "object" && !value.nodeType) {
				return $.createReactiveProxy(value, rootProp || prop)
			}
			return value
		},
		set(target, prop, value) {
			const changedProp = rootProp || prop
			
			// Auto-wrap assigned values to ensure immediate reactivity
			if (value && typeof value === "object" && !value.nodeType) {
				target[prop] = $.createReactiveProxy(value, changedProp)
			} else {
				target[prop] = value
			}
			
			// Re-execute dependent functions
			$.reExecuteDependentFunctions(changedProp)
			
			return true
		}
	})
}

$.reExecuteDependentFunctions = (prop) => {
	if ($.dependency_map.has(prop)) {
		const dependent_functions = $.dependency_map.get(prop)
		const functions_to_remove = new Set()
		
		// If the Set is empty, just remove the map entry immediately
		if (dependent_functions.size === 0) {
			$.dependency_map.delete(prop)
			return
		}
		
		dependent_functions.forEach(tracking_context => {
			// Check if node/element still exists in DOM (memory leak cleanup)
			const target = tracking_context.node || tracking_context.element
			if (!target || !document.contains(target)) {
				functions_to_remove.add(tracking_context)
				return
			}
			
			// Clear old dependencies for this function
			tracking_context.dependencies.clear()
			
			// Re-execute with tracking
			$.tracking_stack.push(tracking_context)
			const new_result = tracking_context.fn()
			$.tracking_stack.pop()
			
			// Update DOM - different logic for content vs attributes
			if (tracking_context.attributeName) {
				// Attribute update - mirror static attribute logic
				if (
					new_result !== false
					&& new_result !== 0
					&& new_result !== null
					&& new_result !== undefined
				) {
					tracking_context.element.setAttribute(tracking_context.attributeName, new_result)
				} else {
					tracking_context.element.removeAttribute(tracking_context.attributeName)
				}
			} else {
				// Content update
				if (typeof new_result === "string" || typeof new_result === "number") {
					if (tracking_context.node.nodeType === 3) { // TEXT_NODE
						tracking_context.node.textContent = new_result
					} else if (tracking_context.node.nodeType === 1) { // ELEMENT_NODE
						// Replace element with text node when switching from element to string
						const textNode = document.createTextNode(new_result)
						tracking_context.node.replaceWith(textNode)
						tracking_context.node = textNode
					} else {
						// Fallback for other node types
						tracking_context.node.textContent = new_result
					}
				} else if (Array.isArray(new_result)) {
					// For array updates, replace with wrapper element
					const wrapper = document.createElement("span")
					wrapper.style.display = "contents"
					new_result.forEach((child) => wrapper.appendChild(child))
					tracking_context.node.replaceWith(wrapper)
					tracking_context.node = wrapper
				} else if (new_result && new_result.nodeType) {
					tracking_context.node.replaceWith(new_result)
					tracking_context.node = new_result // Update reference
				}
			}
			
			// Re-register new dependencies for this function
			tracking_context.dependencies.forEach(new_prop => {
				if (!$.dependency_map.has(new_prop)) {
					$.dependency_map.set(new_prop, new Set())
				}
				$.dependency_map.get(new_prop).add(tracking_context)
			})
		})
		
		// Clean up orphaned functions
		functions_to_remove.forEach(tracking_context => {
			dependent_functions.delete(tracking_context)
		})
		
		// Remove the entire map entry if no functions remain
		if (dependent_functions.size === 0) {
			$.dependency_map.delete(prop)
		}
	}
}

// Create _ as both a function (for templates) and a reactive state object
const _ = new Proxy($.createTemplate, {
	get(target, prop) {
		// Track property access for dependency tracking
		if ($.tracking_stack.length > 0) {
			const current_context = $.tracking_stack[$.tracking_stack.length - 1]
			current_context.dependencies.add(prop)
		}
		
		const value = target[prop]
		if (value && typeof value === "object" && !value.nodeType) {
			return $.createReactiveProxy(value, prop)
		}
		return value
	},
	set(target, prop, value) {
		// Auto-wrap assigned values to ensure immediate reactivity
		if (value && typeof value === "object" && !value.nodeType) {
			target[prop] = $.createReactiveProxy(value, prop)
		} else {
			target[prop] = value
		}
		
		// Re-execute dependent functions
		$.reExecuteDependentFunctions(prop)
		
		return true
	}
})