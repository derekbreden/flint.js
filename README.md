# Flint.js

Fine-grained reactive DOM library with zero dependencies and no build step.

## What is Flint?

Flint provides reactive DOM updates through a simple API: `_` creates reactive templates, `$` selects elements. When state changes, only the affected DOM nodes update automatically.

## Basic Usage

### DOM Creation

```javascript
// Create elements with _
const button = _(`button Click me`)
document.body.appendChild(button)

// Select elements with $
$("button").on("click", () => alert("Clicked!"))
```

### Template Parameters

```javascript
const name = "Alice"
const greeting = _(`
  div
    h1 Hello $1!
    p Welcome to our app.
`, [name])

document.body.appendChild(greeting)
```

### Reactive State

```javascript
// _ is both a template function AND a reactive state object
_.count = 0

const counter = _(`
  div
    p Count: $1
    button $2
`, [
  () => _.count,           // This function re-runs when _.count changes
  () => "Increment"
])

// When _.count changes, the paragraph updates automatically
$("button").on("click", () => _.count++)

document.body.appendChild(counter)
```

### Conditional Rendering

```javascript
_.showDetails = false
_.user = { name: "Bob", email: "bob@example.com" }

const app = _(`
  div
    h1 User Profile
    button $1
    $2
`, [
  () => _.showDetails ? "Hide" : "Show Details",
  () => {
    if (_.showDetails) {
      return _(`
        div
          p $1
          p $2
      `, [
        () => `Name: ${_.user.name}`,
        () => `Email: ${_.user.email}`
      ])
    }
    return _(`p Click to show details`)
  }
])

$("button").on("click", () => _.showDetails = !_.showDetails)
```

### Dynamic Lists

```javascript
_.todos = [
  { id: 1, text: "Learn Flint", done: false },
  { id: 2, text: "Build an app", done: false }
]

const todoApp = _(`
  div
    h1 Todo List
    $1
    button Add Todo
`, [
  () => _(`
    ul
      $1
  `, [
    _.todos.map(todo => 
      _(`
        li
          input[type=checkbox][checked=$1]
          span $2
      `, [
        todo.done,
        todo.text
      ])
    )
  ])
])

$("button").on("click", () => {
  _.todos = [..._.todos, {
    id: Date.now(),
    text: `Todo ${_.todos.length + 1}`,
    done: false
  }]
})
```

### Reactive Attributes

```javascript
_.theme = "dark"
_.isActive = true

const card = _(`
  div[class=$1][data-active=$2][hidden=$3]
    h3 $4
`, [
  () => `card ${_.theme}`,     // Reactive class attribute
  () => _.isActive,            // Reactive data attribute  
  () => !_.isActive,           // Reactive boolean attribute
  () => "User Card"
])

// Attribute updates happen automatically
_.theme = "light"              // Updates class to "card light"
_.isActive = false             // Updates data-active to "false", adds hidden attribute
```

## Key Features

- **Zero dependencies** - Pure JavaScript, works in any modern browser
- **No build step** - Include one file and start coding
- **Fine-grained reactivity** - Only affected DOM nodes update

## API Reference

### Template Creation: `_(template, args)`
- `template` - String with indented structure and `$1`, `$2` placeholders
- `args` - Array of values or functions for placeholders
- Returns DOM element with helper methods

### Element Selection: `$(selector, [element])`
- `selector` - CSS selector string
- `element` - Optional parent element (defaults to document)
- Returns element(s) with helper methods: `.on()`, `.$()`, `.forEach()`

### Reactive State: `_.*`
- Any property on `_` becomes reactive
- Deep property changes trigger updates: `_.user.profile.name = "Alice"`
- Arrays support mutations: `_.items.push(newItem)`

### Debugging: `$.dependency_map`
- Map showing which functions depend on each property
- Useful for understanding reactive relationships

## Template Syntax

```javascript
// Indentation defines nesting
_(`
  div
    h1 Title
    p Paragraph
`)

// Attributes in square brackets
_(`button[class=primary][disabled] Click me`)

// Parameters replace placeholders
_(`div $1`, ["Hello World"])

// Functions create reactive content and attributes
_(`p $1`, [() => _.message])
_(`div[class=$1] $2`, [() => _.theme, () => _.content])
```