const { setupTestEnvironment } = require("../testSetupHelpers")
const { assertEquals, runTests } = require("../testRunUtils")
const fs = require("fs")
const path = require("path")

const tests = [
	async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		// Set up the basic HTML structure that TodoMVC expects
		window.document.body.innerHTML = `
			<section class="todoapp">
				<header class="header">
					<h1>todos</h1>
					<input class="new-todo" placeholder="What needs to be done?" autofocus>
				</header>
			</section>
		`

		// Mock localStorage
		const localStorage_mock = {
			store: {},
			getItem: function(key) {
				return this.store[key] || null
			},
			setItem: function(key, value) {
				this.store[key] = value.toString()
			},
			removeItem: function(key) {
				delete this.store[key]
			},
			clear: function() {
				this.store = {}
			}
		}
		window.localStorage = localStorage_mock

		// Load the TodoMVC app code
		const app_source = fs.readFileSync(path.join(__dirname, "..", "..", "examples", "todo-mvc", "app.js"), "utf8")
		const app_script = new window.Function("$", "_", "localStorage", "window", "document", app_source)
		app_script.call(window, $, _, window.localStorage, window, window.document)

		// Test initial state
		assertEquals(0, _.todos.length, "Should start with no todos")
		assertEquals("all", _.current_filter, "Should start with 'all' filter")
		assertEquals(null, _.editing_id, "Should start with no editing ID")
	},

	async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		window.document.body.innerHTML = `
			<section class="todoapp">
				<header class="header">
					<h1>todos</h1>
					<input class="new-todo" placeholder="What needs to be done?" autofocus>
				</header>
			</section>
		`

		window.localStorage = {
			store: {},
			getItem: function(key) { return this.store[key] || null },
			setItem: function(key, value) { this.store[key] = value.toString() }
		}

		const app_source = fs.readFileSync(path.join(__dirname, "..", "..", "examples", "todo-mvc", "app.js"), "utf8")
		const app_script = new window.Function("$", "_", "localStorage", "window", "document", app_source)
		app_script.call(window, $, _, window.localStorage, window, window.document)

		const new_todo_input = $(".new-todo")
		new_todo_input.value = "Test todo"
		
		// Simulate Enter key press
		const enter_event = new window.KeyboardEvent("keydown", {
			key: "Enter",
			bubbles: true
		})
		new_todo_input.dispatchEvent(enter_event)
		
		assertEquals(1, _.todos.length, "Should have one todo after adding")
		assertEquals("Test todo", _.todos[0].text, "Todo text should match input")
		assertEquals(false, _.todos[0].completed, "New todo should not be completed")
		assertEquals("", new_todo_input.value, "Input should be cleared after adding")
	},

	async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		window.document.body.innerHTML = `
			<section class="todoapp">
				<header class="header">
					<h1>todos</h1>
					<input class="new-todo" placeholder="What needs to be done?" autofocus>
				</header>
			</section>
		`

		window.localStorage = {
			store: {},
			getItem: function(key) { return this.store[key] || null },
			setItem: function(key, value) { this.store[key] = value.toString() }
		}

		const app_source = fs.readFileSync(path.join(__dirname, "..", "..", "examples", "todo-mvc", "app.js"), "utf8")
		const app_script = new window.Function("$", "_", "localStorage", "window", "document", app_source)
		app_script.call(window, $, _, window.localStorage, window, window.document)

		const new_todo_input = $(".new-todo")
		new_todo_input.value = "   "
		
		const enter_event = new window.KeyboardEvent("keydown", {
			key: "Enter",
			bubbles: true
		})
		new_todo_input.dispatchEvent(enter_event)
		
		assertEquals(0, _.todos.length, "Should not add empty todos")
	},

	async () => {
		const window = await setupTestEnvironment()
		const { $, _ } = window

		window.document.body.innerHTML = `
			<section class="todoapp">
				<header class="header">
					<h1>todos</h1>
					<input class="new-todo" placeholder="What needs to be done?" autofocus>
				</header>
			</section>
		`

		window.localStorage = {
			store: {},
			getItem: function(key) { return this.store[key] || null },
			setItem: function(key, value) { this.store[key] = value.toString() }
		}

		const app_source = fs.readFileSync(path.join(__dirname, "..", "..", "examples", "todo-mvc", "app.js"), "utf8")
		const app_script = new window.Function("$", "_", "localStorage", "window", "document", app_source)
		app_script.call(window, $, _, window.localStorage, window, window.document)

		// Add a todo first
		const new_todo_input = $(".new-todo")
		new_todo_input.value = "Test todo"
		
		const enter_event = new window.KeyboardEvent("keydown", {
			key: "Enter",
			bubbles: true
		})
		new_todo_input.dispatchEvent(enter_event)
		
		// Verify main section exists
		assertEquals(true, !!$("[main]"), "Main section should exist with todos")
		
		// Clear all todos
		_.todos = []
		
		// Give reactivity time to update
		await new Promise(resolve => setTimeout(resolve, 0))
		
		// Verify main section is removed
		assertEquals(false, !!$("[main]"), "Main section should be removed when no todos")
	}
]

runTests("todomvc.test.js", tests)