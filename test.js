const { JSDOM } = require("jsdom")
const fs = require("fs")
const path = require("path")

// Simple test utilities
let test_results = []

const assertEquals = (expected, actual, message) => {
	const pass = expected === actual
	test_results.push({
		pass,
		message,
		expected,
		actual,
	})
}

const runTests = async (test_name, test_functions) => {
	test_results = []
	console.log(`Running ${test_name}`)

	for (const test_fn of test_functions) {
		try {
			const result = test_fn()
			if (result && typeof result.then === "function") {
				await result
			}
		} catch (error) {
			test_results.push({
				pass: false,
				message: `Test threw error: ${error.message}`,
				expected: "No error",
				actual: error.toString(),
			})
		}
	}

	// Print results
	let failures = 0
	test_results.forEach((result) => {
		if (!result.pass) {
			failures++
			console.log(`  ✗ ${result.message}`)
			console.log(`    Expected: ${result.expected}`)
			console.log(`    Actual:   ${result.actual}`)
		} else {
			console.log(`  ✓ ${result.message}`)
		}
	})

	if (failures > 0) {
		console.log(`\n${failures} test(s) failed`)
		process.exit(1)
	} else {
		console.log(`\nAll tests passed!`)
	}
}

// Set up test environment
const setupTestEnvironment = () => {
	const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
		url: "http://localhost:3000",
		pretendToBeVisual: true,
	})

	const window = dom.window
	global.window = window
	global.document = window.document

	// Load flint.js
	const flint_source = fs.readFileSync(path.join(__dirname, "flint.js"), "utf8")
	const script = new window.Function(flint_source + "; window.$ = $;")
	script.call(window)

	return window
}

// Tests
const tests = {
	testBasicSelection: () => {
		const window = setupTestEnvironment()
		const { document, $ } = window

		// Create a test element
		const div = document.createElement("div")
		div.className = "test-div"
		div.textContent = "Hello"
		document.body.appendChild(div)

		// Test selection
		const selected = $(".test-div")
		assertEquals(
			"Hello",
			selected.textContent,
			"Should select element by class"
		)
	},

	testBasicCreation: () => {
		const window = setupTestEnvironment()
		const { $ } = window

		// Create element with flint syntax
		const element = $(`
			div[class=test] Hello World
		`)

		assertEquals(
			"DIV",
			element.tagName,
			"Should create div element"
		)
		assertEquals(
			"test",
			element.className,
			"Should set class attribute"
		)
		assertEquals(
			"Hello World",
			element.textContent,
			"Should set text content"
		)
	},

	testParameterSubstitution: () => {
		const window = setupTestEnvironment()
		const { $ } = window

		const element = $(`
			div[class=$1] $2
		`, ["my-class", "Dynamic Text"])

		assertEquals(
			"my-class",
			element.className,
			"Should substitute class parameter"
		)
		assertEquals(
			"Dynamic Text",
			element.textContent,
			"Should substitute text parameter"
		)
	},

	testNestedElements: () => {
		const window = setupTestEnvironment()
		const { $ } = window

		const element = $(`
			ul
				li First
				li Second
				li Third
		`)

		assertEquals(
			"UL",
			element.tagName,
			"Should create ul element"
		)
		assertEquals(
			3,
			element.children.length,
			"Should have 3 li children"
		)
		assertEquals(
			"First",
			element.children[0].textContent,
			"First li should have correct text"
		)
	},

	testHelperMethods: () => {
		const window = setupTestEnvironment()
		const { document, $ } = window

		// Create test structure
		document.body.innerHTML = `
			<div class="parent">
				<span class="child">Child 1</span>
				<span class="child">Child 2</span>
			</div>
		`

		const parent = $(".parent")
		
		// Test .$ helper
		const children = parent.$(".child")
		assertEquals(
			2,
			children.length,
			"Should find 2 children with .$"
		)

		// Test .on helper
		let clicked = false
		parent.on("click", () => { clicked = true })
		parent.click()
		assertEquals(
			true,
			clicked,
			"Should handle click event with .on"
		)
	},

	testArrayParameter: () => {
		const window = setupTestEnvironment()
		const { $ } = window

		const items = ["Apple", "Banana", "Cherry"]
		const list_items = items.map(item => $(`
li $1`, [item]))

		const list = $(`
			ul
				$1
		`, [list_items])

		assertEquals(
			3,
			list.children.length,
			"Should insert array of elements"
		)
		assertEquals(
			"Banana",
			list.children[1].textContent,
			"Should have correct text in array elements"
		)
	}
}

// Run tests
runTests("flint.js tests", Object.values(tests))