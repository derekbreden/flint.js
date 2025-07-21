// Initialize state
_.todos = []
_.current_filter = "all"
_.editing_id = null

// Load from localStorage
const stored_todos = localStorage.getItem("todos-flint")
if (stored_todos) {
	_.todos = JSON.parse(stored_todos)
}

// Save to localStorage whenever todos change
const saveTodos = () => {
	localStorage.setItem("todos-flint", JSON.stringify(_.todos))
}

// Utility functions
const nextId = () => Date.now()

const getFilteredTodos = (filter) => {
	if (filter === "active") return _.todos.filter(todo => !todo.completed)
	if (filter === "completed") return _.todos.filter(todo => todo.completed)
	return _.todos
}

const getActiveCount = () => _.todos.filter(todo => !todo.completed).length
const getCompletedCount = () => _.todos.filter(todo => todo.completed).length

// DOM creation functions
const createTodoItem = (todo, afterRender) => {
	const todo_item = _(`
		li[todo-item][data-id=$1][completed=$2][editing=$3]
			div[view]
				input[toggle][type="checkbox"][checked=$4]
				label $5
				button[destroy] ×
			input[edit][value=$6]
	`, [
		() => todo.id,
		() => todo.completed ? true : false,
		() => _.editing_id === todo.id ? true : false,
		() => todo.completed,
		() => todo.text,
		() => todo.text
	])
	
	// Attach event handlers directly to the elements
	todo_item.$("[toggle]").on("click", () => {
		const todo_to_toggle = _.todos.find(t => t.id === Number(todo.id))
		if (todo_to_toggle) {
			todo_to_toggle.completed = !todo_to_toggle.completed
			saveTodos()
		}
	})
	
	todo_item.$("button[destroy]").on("click", () => {
		_.todos = _.todos.filter(t => t.id !== Number(todo.id))
		saveTodos()
	})
	
	todo_item.$("label").on("dblclick", () => {
		_.editing_id = todo.id
		// Note: The edit input will be shown via reactivity when editing_id changes
		// We'll need to focus it after the reactive update happens
	})
	
	const edit_input = todo_item.$("[edit]")
	if (edit_input) {
		// If this todo is being edited, focus the input after DOM insertion
		if (_.editing_id === todo.id) {
			afterRender(() => {
				edit_input.focus()
				edit_input.select()
			})
		}
		
		edit_input.on("keydown", (e) => {
			if (e.key === "Enter") {
				const todo_to_edit = _.todos.find(t => t.id === Number(todo.id))
				if (todo_to_edit) {
					if (e.target.value.trim()) {
						todo_to_edit.text = e.target.value.trim()
					} else {
						_.todos = _.todos.filter(t => t.id !== Number(todo.id))
					}
					_.editing_id = null
					saveTodos()
				}
			} else if (e.key === "Escape") {
				_.editing_id = null
			}
		})
		
		edit_input.on("blur", () => {
			if (_.editing_id === todo.id) {
				const todo_to_edit = _.todos.find(t => t.id === Number(todo.id))
				if (todo_to_edit) {
					if (edit_input.value.trim()) {
						todo_to_edit.text = edit_input.value.trim()
					} else {
						_.todos = _.todos.filter(t => t.id !== Number(todo.id))
					}
					_.editing_id = null
					saveTodos()
				}
			}
		})
	}
	
	return todo_item
}

const createMainSection = () => {
	const main_section = _(`
		section[main]
			input[toggle-all][type="checkbox"][id="toggle-all"][checked=$1]
			label[for="toggle-all"] Mark all as complete
			ul[todo-list] $2
	`, [
		() => _.todos.length > 0 && getActiveCount() === 0,
		(afterRender) => getFilteredTodos(_.current_filter).map(todo => createTodoItem(todo, afterRender))
	])
	
	// Attach toggle-all handler
	main_section.$("[toggle-all]").on("click", () => {
		const all_completed = _.todos.length > 0 && getActiveCount() === 0
		_.todos.forEach(todo => {
			todo.completed = !all_completed
		})
		saveTodos()
	})
	
	return main_section
}

const createFooter = () => {
	const footer = _(`
		footer[footer]
			span[todo-count]
				strong $1
				$2
			ul[filters]
				li
					a[href="#/"][selected=$3] All
				li
					a[href="#/active"][selected=$4] Active
				li
					a[href="#/completed"][selected=$5] Completed
			$6
	`, [
		() => getActiveCount(),
		() => getActiveCount() === 1 ? " item left" : " items left",
		() => _.current_filter === "all" ? true : false,
		() => _.current_filter === "active" ? true : false,
		() => _.current_filter === "completed" ? true : false,
		() => {
			if (getCompletedCount() > 0) {
				const clear_button = _(`button[clear-completed] Clear completed`)
				clear_button.on("click", () => {
					_.todos = _.todos.filter(todo => !todo.completed)
					saveTodos()
				})
				return clear_button
			}
			return document.createComment("no-clear-button")
		}
	])
	
	return footer
}

// Event handlers
const addTodo = (text) => {
	if (text.trim()) {
		_.todos.push({
			id: nextId(),
			text: text.trim(),
			completed: false
		})
		saveTodos()
	}
}


// Router
const handleRoute = () => {
	const hash = window.location.hash
	if (hash === "#/active") {
		_.current_filter = "active"
	} else if (hash === "#/completed") {
		_.current_filter = "completed"
	} else {
		_.current_filter = "all"
	}
}

// Initialize app
const initApp = () => {
	const todoapp = $(".todoapp")
	
	// Set up new-todo input handler
	const new_todo_input = $(".new-todo")
	if (new_todo_input) {
		new_todo_input.on("keydown", (e) => {
			if (e.key === "Enter") {
				addTodo(e.target.value)
				e.target.value = ""
			}
		})
	}
	
	// Create the app content using flint.js reactivity
	const app_content = _(`
		$1
		$2
	`, [
		() => _.todos.length > 0 ? createMainSection() : document.createComment("no-main"),
		() => _.todos.length > 0 ? createFooter() : document.createComment("no-footer")
	])
	
	// Add reactive content to app
	todoapp.appendChild(app_content)
}

// Handle routing
window.addEventListener("hashchange", handleRoute)
handleRoute()

// Start the app
initApp()