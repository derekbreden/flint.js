const path = require("path")
const {
	setupTestEnvironment,
} = require("../testSetupHelpers.js")
const { assertEquals, runTests } = require("../testRunUtils.js")

const tests = {
	testArrayContentReactivity: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		_.items = ["apple", "banana"]

		const element = _(`
			div
				$1
		`, [
			() => _.items.map(item => _(`p ${item}`))
		])

		window.document.body.appendChild(element)

		// Test initial content
		assertEquals(
			2,
			element.querySelectorAll("p").length,
			"Should have 2 paragraphs initially"
		)
		assertEquals(
			"apple",
			element.querySelector("p:first-child").textContent,
			"First paragraph should be apple"
		)
		assertEquals(
			"banana",
			element.querySelector("p:last-child").textContent,
			"Second paragraph should be banana"
		)

		// Add item using push
		_.items.push("cherry")

		assertEquals(
			3,
			element.querySelectorAll("p").length,
			"Should have 3 paragraphs after push"
		)
		assertEquals(
			"cherry",
			element.querySelector("p:last-child").textContent,
			"Last paragraph should be cherry"
		)
	}
}

runTests(path.basename(__filename), Object.values(tests))