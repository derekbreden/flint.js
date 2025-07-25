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

## How Dependency Tracking Works

Flint's reactivity is based on **automatic dependency tracking** - it watches which properties your functions access and re-runs them when those properties change.

### Step 1: First Execution and Tracking

```javascript
_.count = 5
_.name = "Alice"

const element = _(`
  p Count: $1, Name: $2
`, [
  () => _.count,        // Function A
  () => _.name          // Function B  
])
```

When this template is created:

1. **Function A executes**: `() => _.count` 
   - Flint pushes a tracking context onto the stack
   - Function accesses `_.count` 
   - Flint records: "Function A depends on `_.count`"
   - Function returns `5`
   - Tracking context is popped

2. **Function B executes**: `() => _.name`
   - New tracking context pushed 
   - Function accesses `_.name`
   - Flint records: "Function B depends on `_.name`"
   - Function returns `"Alice"`
   - Tracking context popped

### Step 2: Dependency Map Creation

After execution, Flint builds an internal map:
```javascript
$.dependency_map = new Map([
  ["count", Set([FunctionA_context])],
  ["name", Set([FunctionB_context])]  
])
```

Each context contains:
- The original function
- Reference to the DOM node it controls
- Whether it's for content or attributes

### Step 3: State Change Triggers Updates

```javascript
_.count = 10  // This triggers the reactive update
```

When `_.count` changes:

1. **Lookup dependents**: Flint checks `$.dependency_map.get("count")`
2. **Re-execute Function A**: 
   - Clears old dependencies for this function
   - Pushes new tracking context
   - Executes `() => _.count` (returns `10`)
   - Records new dependencies (still just `_.count`)
   - Updates DOM: `p` element's text becomes `"Count: 10, Name: Alice"`
3. **Function B unchanged**: Since `_.name` didn't change, Function B never executes

### Step 4: Only Affected DOM Updates

The key insight: **Only the specific DOM node controlled by Function A updates**. The rest of the page stays exactly the same.

### Deep Property Tracking

Flint tracks nested properties automatically:

```javascript
_.user = { profile: { name: "Bob" } }

const card = _(`p $1`, [
  () => `Hello ${_.user.profile.name}`  // Depends on "user" 
])

_.user.profile.name = "Carol"  // Triggers update
_.user = { profile: { name: "Dave" } }  // Also triggers update
```

Both assignments trigger the function because they modify the `"user"` property that was accessed.

### Array Mutations

Array methods are intercepted to trigger reactivity:

```javascript
_.items = ["apple", "banana"]

const list = _(`ul $1`, [
  () => _.items.map(item => _(`li ${item}`))
])

_.items.push("cherry")  // Automatically triggers re-render
// The function re-executes, creates 3 <li> elements, replaces the <ul> contents
```

## Understanding Re-execution

When state changes trigger functions to re-run, Flint uses different update strategies depending on whether the function controls **content** or **attributes**.

### Content Functions: replaceWith

Content functions (for placeholders like `$1`, `$2`) use `replaceWith` to swap DOM nodes:

```javascript
_.message = "Hello"

const greeting = _(`
  div
    p $1
    span Static text
`, [
  () => `Message: ${_.message}`  // Content function
])

// Later...
_.message = "Goodbye"
```

**What happens during re-execution:**

1. Function re-runs: `() => "Message: Goodbye"` 
2. Creates new text node: `"Message: Goodbye"`
3. **Replaces** the old text node with `replaceWith()`
4. The `<span>` with "Static text" is **never touched**

The key insight: **Only the specific text node controlled by the function changes**. The rest of the DOM structure stays identical.

### Attribute Functions: Direct Updates

Attribute functions update DOM attributes directly without replacing elements:

```javascript
_.isActive = true
_.theme = "dark"

const button = _(`
  button[class=$1][disabled=$2] Click me
`, [
  () => `btn ${_.theme}`,    // Attribute function for class
  () => !_.isActive          // Attribute function for disabled
])

// Later...
_.theme = "light"  // Only the class attribute updates
_.isActive = false // Only the disabled attribute updates
```

**What happens during re-execution:**

1. **Class function re-runs**: `() => "btn light"`
2. **Direct attribute update**: `element.setAttribute("class", "btn light")`
3. **Disabled function re-runs**: `() => true` 
4. **Direct attribute update**: `element.setAttribute("disabled", true)`

The button element itself is never replaced - just its attributes change.

### Complex Content: Full Replacement

When content functions return complex structures, the entire structure gets replaced:

```javascript
_.showDetails = false
_.user = { name: "Alice", age: 30 }

const profile = _(`
  div
    h1 User Profile  
    $1
`, [
  () => {
    if (_.showDetails) {
      return _(`
        div
          p Name: ${_.user.name}
          p Age: ${_.user.age}
          button Hide Details
      `)
    }
    return _(`button Show Details`)
  }
])

_.showDetails = true  // Entire content area gets replaced
```

**What happens:**
1. Function re-executes and returns a new `<div>` with user details
2. `replaceWith()` swaps the old `<button>` with the new `<div>` 
3. The `<h1>` stays untouched

### Why This Is Efficient

**No Virtual DOM Diffing**: Unlike React/Vue, Flint doesn't compare old vs new virtual trees. It knows exactly which functions need to re-run and which DOM nodes to update.

**Surgical Updates**: Only the minimal necessary DOM changes happen:
- If `_.user.name` changes → only the name text node updates
- If `_.theme` changes → only the class attribute updates  
- If `_.showDetails` changes → only the details section replaces

**No Wasted Work**: Functions that don't depend on changed properties never execute. DOM nodes controlled by those functions stay exactly the same.

### Debugging Re-execution

You can watch re-execution in action:

```javascript
_.count = 0

const counter = _(`p $1`, [
  () => {
    console.log(`Function running! Count is ${_.count}`)
    return `Count: ${_.count}`
  }
])

_.count = 1  // Console: "Function running! Count is 1"
_.count = 2  // Console: "Function running! Count is 2"  
_.name = "Alice"  // No console output - function doesn't depend on _.name
```

This transparency makes it easy to understand and debug reactive behavior.

## Mental Model

To use Flint effectively, it helps to understand the core mental model that differs from other reactive frameworks.

### Functions as Live Connections

In Flint, **functions create live connections between state and DOM**:

```javascript
_.temperature = 72

const thermometer = _(`
  div[class=$1]
    p Temperature: $2°F
`, [
  () => _.temperature > 80 ? "hot" : "cool",    // Live connection: state → class
  () => _.temperature                            // Live connection: state → text
])
```

Think of each function as a **permanent wire** connecting state to a specific DOM node. When state changes, electricity flows through the wire and updates that exact spot in the DOM.

**Not this**: "Re-render the component and figure out what changed"  
**But this**: "Temperature changed, so update the two nodes connected to temperature"

### No Virtual DOM

Unlike React/Vue, Flint doesn't create virtual representations of your UI:

```javascript
// React mental model (simplified):
function Component() {
  const [count, setCount] = useState(0)
  
  // Creates virtual DOM tree on every render
  return React.createElement('div', null, 
    React.createElement('p', null, `Count: ${count}`),
    React.createElement('button', { onClick: () => setCount(count + 1) }, 'Increment')
  )
}
// React diffs old virtual tree vs new virtual tree, then applies changes
```

```javascript
// Flint mental model:
_.count = 0

const counter = _(`
  div
    p Count: $1  
    button Increment
`, [
  () => _.count  // Direct connection: _.count changes → this text node updates
])

// No virtual DOM. No diffing. Direct updates.
```

**Virtual DOM approach**: Build entire UI tree → Compare with previous tree → Calculate minimal changes → Apply to real DOM

**Flint approach**: State changes → Trigger connected functions → Update specific DOM nodes directly

### Transparent and Inspectable

Flint's reactivity is completely transparent. You can see exactly what's happening:

```javascript
_.user = { name: "Alice", posts: 5 }

const profile = _(`
  div
    h1 $1
    p Posts: $2
`, [
  () => _.user.name,     // Function A
  () => _.user.posts     // Function B  
])

// Inspect the dependency map
console.log($.dependency_map)
// Map(1) { 
//   "user" => Set(2) [ FunctionA_context, FunctionB_context ]
// }

_.user.name = "Bob"  // Only Function A re-runs
_.user.posts = 10    // Only Function B re-runs  
_.otherData = "xyz"  // No functions re-run
```

There's no hidden framework magic. You can trace exactly why something updated or why it didn't.

### Thinking in Connections, Not Components

**Component-based thinking** (React/Vue):
- "I have a UserCard component"
- "When user state changes, re-render the UserCard"  
- "Framework figures out what actually needs to update"

**Connection-based thinking** (Flint):
- "I have DOM nodes with live connections to state"
- "The name text node is connected to `_.user.name`"
- "The avatar image is connected to `_.user.avatar`"
- "When `_.user.name` changes, that specific text node updates immediately"

### Granular vs Coarse Updates

**Other frameworks**: Coarse-grained updates
```javascript  
// Vue component (simplified)
export default {
  data() {
    return { user: { name: "Alice", email: "alice@example.com", avatar: "alice.jpg" } }
  },
  template: `
    <div class="user-card">
      <img :src="user.avatar">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
    </div>
  `
}

// When user.name changes, Vue re-evaluates the entire template
// Optimizations help, but the mental model is "re-render the component"
```

**Flint**: Fine-grained updates
```javascript
_.user = { name: "Alice", email: "alice@example.com", avatar: "alice.jpg" }

const userCard = _(`
  div[class=user-card]
    img[src=$1]
    h3 $2
    p $3
`, [
  () => _.user.avatar,    // Only this updates when avatar changes
  () => _.user.name,      // Only this updates when name changes  
  () => _.user.email      // Only this updates when email changes
])

// Mental model: "Each piece of state is connected to its specific DOM node"
```

### Performance Implications

This mental model has performance benefits:

- **No reconciliation**: No comparing old vs new trees
- **No wasted renders**: Functions only run when their dependencies change
- **Minimal DOM work**: Only the specific nodes that need updating are touched
- **Predictable**: You can trace exactly what will update when state changes

### Debugging Mental Model

When something isn't updating as expected:

1. **Check dependencies**: Does your function access the right state?
   ```javascript
   // Won't update when _.user.name changes
   () => "Hello there"  // No dependencies
   
   // Will update when _.user.name changes  
   () => `Hello ${_.user.name}`  // Depends on "user"
   ```

2. **Inspect the map**: What does `$.dependency_map` show?
   ```javascript
   console.log($.dependency_map.get("user"))  // Which functions depend on user?
   ```

3. **Add logging**: Watch functions execute
   ```javascript
   () => {
     console.log("Name function running:", _.user.name)
     return _.user.name
   }
   ```

The transparency makes debugging reactive behavior straightforward - you can see exactly what's connected to what.