// Initialize reactive state
_.count = 0

// Create the counter component
const counter_app = _(`
	div
		div.counter $1
		button[data-action="decrement"] -
		button[data-action="reset"] Reset
		button[data-action="increment"] +
`, [
	() => _.count
])

// Event handlers
const handle_click = (e) => {
	const action = e.target.dataset.action
	
	if (action === "increment") {
		_.count++
	} else if (action === "decrement") {
		_.count--
	} else if (action === "reset") {
		_.count = 0
	}
}

// Add event listener
counter_app.addEventListener("click", handle_click)

// Mount the app
$("#app").appendChild(counter_app)