const path = require("path")
const {
	setupTestEnvironment,
} = require("../testSetupHelpers.js")
const { assertEquals, runTests } = require("../testRunUtils.js")

const tests = {
	testBasicReactiveAttributes: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		// Set up reactive state
		_.theme = "dark"
		_.isActive = true

		// Create element with reactive attributes
		const element = _(`
			div[class=$1][data-active=$2]
				p Content
		`, [
			() => _.theme,
			() => _.isActive
		])

		window.document.body.appendChild(element)

		// Test initial values
		assertEquals(
			"dark",
			element.getAttribute("class"),
			"Initial class should be dark"
		)
		assertEquals(
			"true",
			element.getAttribute("data-active"),
			"Initial data-active should be true"
		)

		// Test reactivity
		_.theme = "light"
		assertEquals(
			"light",
			element.getAttribute("class"),
			"Class should update to light"
		)

		_.isActive = false
		assertEquals(
			null,
			element.getAttribute("data-active"),
			"data-active should be removed when false"
		)
	},

	testMultipleReactiveAttributes: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		_.user = { role: "admin", status: "active" }
		_.count = 5

		const element = _(`
			div[class=$1][data-role=$2][data-status=$3][data-count=$4]
				p User Card
		`, [
			() => `user-card ${_.user.status}`,
			() => _.user.role,
			() => _.user.status,
			() => _.count
		])

		window.document.body.appendChild(element)

		// Test initial values
		assertEquals(
			"user-card active",
			element.getAttribute("class"),
			"Initial class should combine status"
		)
		assertEquals(
			"admin",
			element.getAttribute("data-role"),
			"Initial role should be admin"
		)
		assertEquals(
			"active",
			element.getAttribute("data-status"),
			"Initial status should be active"
		)
		assertEquals(
			"5",
			element.getAttribute("data-count"),
			"Initial count should be 5"
		)

		// Update multiple properties
		_.user.role = "user"
		_.user.status = "inactive"
		_.count = 10

		assertEquals(
			"user-card inactive",
			element.getAttribute("class"),
			"Class should reflect new status"
		)
		assertEquals(
			"user",
			element.getAttribute("data-role"),
			"Role should update to user"
		)
		assertEquals(
			"inactive",
			element.getAttribute("data-status"),
			"Status should update to inactive"
		)
		assertEquals(
			"10",
			element.getAttribute("data-count"),
			"Count should update to 10"
		)
	},

	testMixedStaticAndReactiveAttributes: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		_.dynamicClass = "highlight"

		const element = _(`
			div[id=static-id][class=$1][disabled]
				p Mixed attributes
		`, [
			() => _.dynamicClass
		])

		window.document.body.appendChild(element)

		// Test initial values
		assertEquals(
			"static-id",
			element.getAttribute("id"),
			"Static id should remain unchanged"
		)
		assertEquals(
			"highlight",
			element.getAttribute("class"),
			"Dynamic class should be set"
		)
		assertEquals(
			"",
			element.getAttribute("disabled"),
			"Static disabled should be set"
		)

		// Update only reactive attribute
		_.dynamicClass = "active"

		assertEquals(
			"static-id",
			element.getAttribute("id"),
			"Static id should still be unchanged"
		)
		assertEquals(
			"active",
			element.getAttribute("class"),
			"Dynamic class should update"
		)
		assertEquals(
			"",
			element.getAttribute("disabled"),
			"Static disabled should still be set"
		)
	},

	testAttributeCleanup: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		_.showCard = true
		_.cardTheme = "primary"

		// Create parent with conditional child that has reactive attributes
		const app = _(`
			div
				$1
		`, [
			() => {
				if (_.showCard) {
					return _(`
						div[class=$1]
							p Card content
					`, [
						() => `card ${_.cardTheme}`
					])
				}
				return _(`p No card`)
			}
		])

		window.document.body.appendChild(app)

		// Verify initial state
		assertEquals(
			"card primary",
			$("div.card").getAttribute("class"),
			"Card should have initial class"
		)

		// Test that attribute function works
		_.cardTheme = "secondary"
		assertEquals(
			"card secondary",
			$("div.card").getAttribute("class"),
			"Card class should update"
		)

		// Hide the card (should trigger cleanup)
		_.showCard = false
		assertEquals(
			null,
			$("div.card"),
			"Card should be removed"
		)

		// Trigger cardTheme change to test lazy cleanup
		_.cardTheme = "tertiary"

		// Verify cleanup by checking dependency map after the change
		const cardThemeDependencies = $.dependency_map.get("cardTheme")
		assertEquals(
			undefined,
			cardThemeDependencies,
			"cardTheme dependencies should be cleaned up"
		)
	},

	testAttributeRemovalConditions: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		_.testValue = "initial"

		const element = _(`
			div[data-test=$1]
		`, [
			() => _.testValue
		])

		window.document.body.appendChild(element)

		// Test initial value
		assertEquals(
			"initial",
			element.getAttribute("data-test"),
			"Should set initial value"
		)

		// Test all removal conditions: false, 0, null, undefined
		_.testValue = false
		assertEquals(
			null,
			element.getAttribute("data-test"),
			"Should remove attribute when false"
		)

		_.testValue = "restored"
		assertEquals(
			"restored",
			element.getAttribute("data-test"),
			"Should restore attribute"
		)

		_.testValue = 0
		assertEquals(
			null,
			element.getAttribute("data-test"),
			"Should remove attribute when 0"
		)

		_.testValue = "restored2"
		assertEquals(
			"restored2",
			element.getAttribute("data-test"),
			"Should restore attribute again"
		)

		_.testValue = null
		assertEquals(
			null,
			element.getAttribute("data-test"),
			"Should remove attribute when null"
		)

		_.testValue = undefined
		assertEquals(
			null,
			element.getAttribute("data-test"),
			"Should remove attribute when undefined"
		)
	}
}

runTests(path.basename(__filename), Object.values(tests))