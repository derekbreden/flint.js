const path = require("path")
const {
	setupTestEnvironment,
} = require("../testSetupHelpers.js")
const { assertEquals, runTests } = require("../testRunUtils.js")

const tests = {
	testCleanDOMStructure: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		_.items = ["apple", "banana"]

		const element = _(`
			div[id=container]
				$1
		`, [
			() => _.items.map(item => _(`p ${item}`))
		])

		window.document.body.appendChild(element)

		// Verify clean DOM structure - no wrapper spans
		const container = $("#container")
		assertEquals(
			2,
			container.children.length,
			"Container should have exactly 2 direct children (no wrapper spans)"
		)
		
		assertEquals(
			"P",
			container.children[0].tagName,
			"First child should be a paragraph, not a wrapper span"
		)
		
		assertEquals(
			"P", 
			container.children[1].tagName,
			"Second child should be a paragraph, not a wrapper span"
		)

		// Verify no spans with display:contents exist
		const spans = container.querySelectorAll("span")
		assertEquals(
			0,
			spans.length,
			"Should have no span elements (no wrapper spans)"
		)

		// Test that updates still work with clean structure
		_.items.push("cherry")
		
		assertEquals(
			3,
			container.children.length,
			"Should have 3 children after adding item"
		)
		
		assertEquals(
			"cherry",
			container.children[2].textContent,
			"Third child should be the new item"
		)
	}
}

runTests(path.basename(__filename), Object.values(tests))