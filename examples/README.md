# Flint.js Examples

This folder contains example applications built with Flint.js to demonstrate the framework's capabilities and patterns.

## Examples

### TodoMVC
A complete implementation of the TodoMVC specification, featuring:
- Add, edit, delete todos
- Mark todos as complete/incomplete  
- Filter views (All, Active, Completed)
- Persistent storage with localStorage
- Routing for different views

**Key Flint.js concepts demonstrated:**
- Reactive state with `_` object
- Template creation with `_()` function
- DOM selection with `$()` function
- Event delegation and handling
- Conditional rendering and list updates

### Counter
A simple counter application showing:
- Reactive state updates
- Event handling
- Basic component structure

**Key Flint.js concepts demonstrated:**
- Basic reactivity with `_.count`
- Template syntax with parameters
- Event handling patterns

## Running the Examples

Each example is a standalone HTML file that can be opened directly in a browser:

1. Navigate to the example directory
2. Open `index.html` in your browser
3. The example will load with Flint.js from the parent directory

## Code Structure

Each example follows Flint.js conventions:
- **`_` function**: Template creation only - executes functions immediately, creates DOM elements
- **`$` function**: DOM selection only - returns elements with helper methods  
- **Variables**: `snake_case` for all variables
- **Functions**: `camelCase` for functions only
- **Reactivity**: Functions in templates execute when dependencies change

## Learning Path

1. Start with **Counter** to understand basic reactivity
2. Move to **TodoMVC** to see real-world application patterns
3. Study how state management and event handling work together