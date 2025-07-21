const path = require("path")
const {
	setupTestEnvironment,
} = require("../testSetupHelpers.js")
const { assertEquals, runTests } = require("../testRunUtils.js")

const tests = {
	testFlow: async () => {
		const window = await setupTestEnvironment()
		const { $ } = window

		// Create a complex nested structure using flint
		const app = $(`
			div[class=app]
				header
					h1[class=title] Todo App
					p Welcome to the $1 app
				main
					div[class=add-todo]
						input[type=text][placeholder=What needs to be done?]
						button[class=add] Add
					ul[class=todo-list]
						$2
				footer
					span[class=count] $3 items
		`, [
			"Flint",
			[
				$(`
li[class=todo] Buy milk`),
				$(`
li[class=todo] Walk dog`),
			],
			"2"
		])

		// Add to document body
		window.document.body.appendChild(app)

		// Interact with the created elements
		$("h1.title").textContent = "Updated Todo App"
		$("input[type=text]").value = "New task"
		
		// Test helper methods
		const todos = app.$(".todo")
		todos.forEach((todo, i) => {
			todo.setAttribute("data-index", i)
		})

		// Add click handler
		let clicked = false
		app.$("button.add").on("click", () => {
			clicked = true
			const new_todo = $(`
li[class=todo] $1`, [$("input[type=text]").value])
			app.$(".todo-list").appendChild(new_todo)
		})

		// Trigger click
		$("button.add").click()

		// Final assertions - only what matters
		assertEquals(
			"Updated Todo App",
			$("h1.title").textContent,
			"Title should be updated"
		)
		assertEquals(
			3,
			$(".todo").length,
			"Should have 3 todos after adding one"
		)
		assertEquals(
			"New task",
			$(".todo:last-child").textContent,
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