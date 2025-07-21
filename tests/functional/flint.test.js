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
}

runTests(path.basename(__filename), Object.values(tests))