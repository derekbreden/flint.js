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
}

runTests(path.basename(__filename), Object.values(tests))