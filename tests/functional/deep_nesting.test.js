const path = require("path")
const {
	setupTestEnvironment,
} = require("../testSetupHelpers.js")
const { assertEquals, runTests } = require("../testRunUtils.js")

const tests = {
	testDeepNestedReactivity: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		_.user = {
			profile: {
				settings: {
					theme: "dark",
					language: "en"
				},
				preferences: {
					notifications: true
				}
			},
			contact: {
				email: "test@example.com"
			}
		}

		const element = _(`
			div
				p $1
				p $2
				p $3
		`, [
			() => `Theme: ${_.user.profile.settings.theme}`,
			() => `Email: ${_.user.contact.email}`,
			() => `Notifications: ${_.user.profile.preferences.notifications ? "enabled" : "disabled"}`
		])

		window.document.body.appendChild(element)

		// Test initial values
		assertEquals(
			"Theme: dark",
			element.querySelector("p:nth-child(1)").textContent,
			"Should show initial theme"
		)
		assertEquals(
			"Email: test@example.com", 
			element.querySelector("p:nth-child(2)").textContent,
			"Should show initial email"
		)
		assertEquals(
			"Notifications: enabled",
			element.querySelector("p:nth-child(3)").textContent,
			"Should show initial notifications"
		)

		// Test deep property changes
		_.user.profile.settings.theme = "light"
		assertEquals(
			"Theme: light",
			element.querySelector("p:nth-child(1)").textContent,
			"Should update theme on deep change"
		)

		_.user.contact.email = "new@example.com"
		assertEquals(
			"Email: new@example.com",
			element.querySelector("p:nth-child(2)").textContent, 
			"Should update email on deep change"
		)

		_.user.profile.preferences.notifications = false
		assertEquals(
			"Notifications: disabled",
			element.querySelector("p:nth-child(3)").textContent,
			"Should update notifications on deep change"
		)

		// Verify dependency tracking - all should be tracked under "user"
		const userDependencies = $.dependency_map.get("user")
		assertEquals(
			3,
			userDependencies?.size || 0,
			"Should have 3 functions depending on user property"
		)
	}
}

runTests(path.basename(__filename), Object.values(tests))