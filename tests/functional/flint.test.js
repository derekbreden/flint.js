const path = require("path")
const {
	setupTestEnvironment,
} = require("../testSetupHelpers.js")
const { assertEquals, runTests } = require("../testRunUtils.js")

const tests = {
	testFlow: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		// Create a complex nested structure using flint
		const app = _(`
			div[app]
				header
					h1[title] Todo App
					p $1
				main
					div[add-todo]
						input[type=text][placeholder=What needs to be done?]
						button[add] Add
					ul[todo-list]
						$2
				footer
					span[count] $3
		`, [
			"Welcome to the Flint app",
			[
				_(`
					li[todo] Buy milk
				`),
				_(`
					li[todo] Walk dog
				`),
			],
			"2 items"
		])

		// Add to document body
		window.document.body.appendChild(app)

		// Interact with the created elements
		$("h1[title]").textContent = "Updated Todo App"
		$("input[type=text]").value = "New task"
		
		// Test helper methods
		const todos = app.$("li[todo]")
		todos.forEach((todo, i) => {
			todo.setAttribute("data-index", i)
		})

		// Add click handler
		let clicked = false
		app.$("button[add]").on("click", () => {
			clicked = true
			const new_todo = _(`
				li[todo] $1
			`, [
				$("input[type=text]").value
			])
			app.$("ul[todo-list]").appendChild(new_todo)
		})

		// Trigger click
		$("button[add]").click()

		// Final assertions - only what matters
		assertEquals(
			"Updated Todo App",
			$("h1[title]").textContent,
			"Title should be updated"
		)
		assertEquals(
			3,
			$("li[todo]").length,
			"Should have 3 todos after adding one"
		)
		assertEquals(
			"New task",
			$("li[todo]:last-child").textContent,
			"Last todo should have the new task text"
		)
		assertEquals(
			true,
			clicked,
			"Click handler should have fired"
		)
	},

	testFunctionParameters: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		let count = 5
		let user = { name: "Alice", active: true }

		// Test function parameters returning various types
		const app = _(`
			div[test-functions]
				h1 $1
				p $2
				p $3
				div $4
		`, [
			() => `Welcome ${user.name}`,
			() => `Count: ${count}`,
			() => `Status: ${user.active ? "Active" : "Inactive"}`, 
			() => _(`
				ul
					li Item 1
					li Item 2
			`)
		])

		window.document.body.appendChild(app)

		// Test function returning string
		assertEquals(
			"Welcome Alice",
			$("h1").textContent,
			"Function should return interpolated string"
		)

		// Test function returning number (converted to string)  
		assertEquals(
			"Count: 5",
			$("p")[0].textContent,
			"Function should return number as string"
		)

		// Test function returning conditional string
		assertEquals(
			"Status: Active",
			$("p")[1].textContent,
			"Function should return conditional result"
		)

		// Test function returning DOM element
		assertEquals(
			2,
			$("ul li").length,
			"Function should return DOM elements properly"
		)
	},

	testReactivity: async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		// Set up state for conditional rendering
		_.showDetails = false
		_.user = { name: "Alice" }
		_.count = 5

		// Create template with conditional element rendering
		const app = _(`
			div[element-test]
				h1 Main App
				$1
		`, [
			() => {
				if (_.showDetails) {
					return _(`
						div[details]
							p $1
							span $2
					`, [
						() => `User: ${_.user.name}`,
						() => `Count: ${_.count}`
					])
				} else {
					return _(`
						p[summary] Click to show details
					`)
				}
			}
		])

		window.document.body.appendChild(app)

		// Test initial state (collapsed)
		assertEquals(
			"Click to show details",
			$("p[summary]").textContent,
			"Should show summary initially"
		)
		assertEquals(
			null,
			$("div[details]"),
			"Details div should not exist initially"
		)

		// Expand details - this should replace the summary element
		_.showDetails = true
		
		assertEquals(
			null,
			$("p[summary]"),
			"Summary should be gone after expanding"
		)
		assertEquals(
			"User: Alice",
			$("div[details] p").textContent,
			"Should show user details after expanding"
		)
		assertEquals(
			"Count: 5",
			$("div[details] span").textContent,
			"Should show count details after expanding"
		)

		// Test that inner reactive functions still work after DOM replacement
		_.user.name = "Bob"
		assertEquals(
			"User: Bob",
			$("div[details] p").textContent,
			"User name should update reactively in replaced element"
		)

		_.count = 10
		assertEquals(
			"Count: 10",
			$("div[details] span").textContent,
			"Count should update reactively in replaced element"
		)

		// Collapse details - should replace details element with summary
		_.showDetails = false
		
		assertEquals(
			"Click to show details",
			$("p[summary]").textContent,
			"Should show summary after collapsing"
		)
		assertEquals(
			null,
			$("div[details]"),
			"Details div should be gone after collapsing"
		)

		// Test that orphaned inner functions get cleaned up
		// Changes to cleaned up properties shouldn't cause any re-execution
		_.user.name = "Charlie"
		_.count = 20
		
		// Verify cleanup by inspecting $.dependency_map directly AFTER the changes
		const userDependencies = $.dependency_map.get("user")
		const countDependencies = $.dependency_map.get("count")
		
		// Should have no functions depending on user/count since details are collapsed
		assertEquals(
			undefined,
			userDependencies,
			"user dependencies should be cleaned up after collapse"
		)
		assertEquals(
			undefined,
			countDependencies,
			"count dependencies should be cleaned up after collapse"
		)
		
		// showDetails should still have one dependency (the main conditional function)
		const showDetailsDependencies = $.dependency_map.get("showDetails")
		assertEquals(
			1,
			showDetailsDependencies?.size || 0,
			"showDetails should still have main function dependency"
		)
	},
}

runTests(path.basename(__filename), Object.values(tests))