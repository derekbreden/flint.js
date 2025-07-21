const path = require("path")
const {
	setupTestEnvironment,
} = require("../testSetupHelpers.js")
const { assertEquals, runTests } = require("../testRunUtils.js")

const tests = {
	testContentTypeSwitching: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		_.mode = "string"
		_.text = "Hello"
		_.items = ["one", "two"]

		const element = _(`
			div
				$1
		`, [
			() => {
				if (_.mode === "string") {
					return _.text
				} else if (_.mode === "array") {
					return _.items.map(item => _(`p ${item}`))
				} else {
					return _(`strong Bold text`)
				}
			}
		])

		window.document.body.appendChild(element)

		// Test initial string content
		assertEquals(
			"Hello",
			element.textContent.trim(),
			"Should show string content initially"
		)
		assertEquals(
			0,
			element.querySelectorAll("p").length,
			"Should have no paragraphs for string mode"
		)

		// Switch to array mode
		_.mode = "array"

		assertEquals(
			2,
			element.querySelectorAll("p").length,
			"Should have 2 paragraphs in array mode"
		)
		assertEquals(
			"one",
			element.querySelector("p:first-child").textContent,
			"First paragraph should be 'one'"
		)
		assertEquals(
			"two",
			element.querySelector("p:last-child").textContent,
			"Second paragraph should be 'two'"
		)

		// Switch to element mode
		_.mode = "element"

		assertEquals(
			"Bold text",
			element.querySelector("strong").textContent,
			"Should show bold element"
		)
		assertEquals(
			0,
			element.querySelectorAll("p").length,
			"Should have no paragraphs in element mode"
		)

		// Switch back to string
		_.mode = "string"
		_.text = "Updated"

		assertEquals(
			"Updated",
			element.textContent.trim(),
			"Should show updated string content"
		)
		assertEquals(
			0,
			element.querySelectorAll("strong").length,
			"Should have no strong elements in string mode"
		)
	}
}

runTests(path.basename(__filename), Object.values(tests))