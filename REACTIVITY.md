# Flint.js Reactivity Specification

## Vision

Flint.js provides fine-grained reactivity through `_`, which serves dual purpose: as a template creation function and as a reactive state object. When functions are passed as template arguments, they execute immediately and their state dependencies are tracked. When state properties change, only the affected DOM nodes update automatically.

## Core API

```javascript
// _ is the reactive state object
_.title = "Hello World"
_.user = { name: "Alice", email: "alice@example.com" }
_.todos = []

// _ is also the template creation function
_(`
  div
    h1 $1
    p $2
`, [
  () => _.title,
  () => _.user.name
])

// $ is the selector/query function
$("div").addClass("active")
```

## Template Creation Syntax

```javascript
// Templates are created with _
_(`li $1`, [text])

// Indentation defines structure (newlines recommended for readability)
_(`
  ul
    li First
    li Second
`)

// $ is for selecting existing DOM elements
$("ul li").on("click", handler)
```

## Complete Example: Todo Application

```javascript
// Initialize state
_.todos = []
_.filter = 'all' // 'all', 'active', 'completed'

// Create the app
_(`
  div[class=todo-app]
    h1 Todo List
    $1
    $2
    $3
`, [
  // Input section
  () => {
    const $input = _(`
      div[class=input-section]
        input[type=text][placeholder=What needs to be done?]
        button Add
    `)
    
    $input.$("button").on("click", () => {
      const input = $input.$("input")
      if (input.value.trim()) {
        _.todos = [..._.todos, {
          id: Date.now(),
          text: input.value.trim(),
          completed: false
        }]
        input.value = ""
      }
    })
    
    $input.$("input").on("keypress", (e) => {
      if (e.key === "Enter") {
        $input.$("button").click()
      }
    })
    
    return $input
  },
  
  // Todo list section
  () => {
    const filtered = _.todos.filter(todo => {
      if (_.filter === 'active') return !todo.completed
      if (_.filter === 'completed') return todo.completed
      return true
    })
    
    if (filtered.length === 0) {
      return _(`p[class=empty] No todos to show`)
    }
    
    return _(`
      ul[class=todo-list]
        $1
    `, [
      filtered.map(todo => {
        const $item = _(`
          li[class=$1]
            input[type=checkbox][checked=$2]
            span $3
            button[class=delete] ×
        `, [
          todo.completed ? 'completed' : '',
          todo.completed,
          todo.text
        ])
        
        $item.$("input").on("change", (e) => {
          _.todos = _.todos.map(t =>
            t.id === todo.id 
              ? { ...t, completed: e.target.checked }
              : t
          )
        })
        
        $item.$("button").on("click", () => {
          _.todos = _.todos.filter(t => t.id !== todo.id)
        })
        
        return $item
      })
    ])
  },
  
  // Filter section
  () => {
    if (_.todos.length === 0) return null
    
    const $filters = _(`
      div[class=filters]
        button[class=$1] All
        button[class=$2] Active
        button[class=$3] Completed
        span[class=count] $4
    `, [
      _.filter === 'all' ? 'active' : '',
      _.filter === 'active' ? 'active' : '',
      _.filter === 'completed' ? 'active' : '',
      () => {
        const active = _.todos.filter(t => !t.completed).length
        return `${active} item${active !== 1 ? 's' : ''} left`
      }
    ])
    
    $filters.$("button").forEach(($btn, index) => {
      $btn.on("click", () => {
        _.filter = ['all', 'active', 'completed'][index]
      })
    })
    
    return $filters
  }
])
```

## Nested Reactivity Example

```javascript
// User profile cards with expandable details
_.users = [
  { id: 1, name: "Alice", email: "alice@example.com", role: "Admin" },
  { id: 2, name: "Bob", email: "bob@example.com", role: "User" }
]
_.expandedUsers = {} // { userId: boolean }

_(`
  div[class=user-list]
    h2 Users
    $1
`, [
  () => _.users.map(user => 
    _(`
      div[class=user-card]
        div[class=header]
          h3 $1
          button $2
        $3
    `, [
      user.name,
      _.expandedUsers[user.id] ? "−" : "+",
      // This function only re-runs when _.expandedUsers[user.id] changes
      () => {
        if (!_.expandedUsers[user.id]) return null
        
        return _(`
          div[class=details]
            p Email: $1
            p Role: $2
            $3
        `, [
          user.email,
          user.role,
          // This function only re-runs when user.role changes
          () => {
            if (user.role !== "Admin") return null
            
            return _(`
              div[class=admin-panel]
                h4 Admin Controls
                button Delete User
                button Reset Password
            `)
          }
        ])
      }
    ]).on("click", "button", () => {
      _.expandedUsers = {
        ..._.expandedUsers,
        [user.id]: !_.expandedUsers[user.id]
      }
    })
  )
])
```

## Implementation Requirements

### 1. Dual Nature of _
- `_` is both a function and an object
- As a function: creates DOM elements from templates
- As an object: holds reactive state with Proxy-based tracking

### 2. Dependency Tracking
Each reactive function tracks its own dependencies independently at the **top-level property only**:

```javascript
// When this function executes:
() => _.showDetails ? _.user.name : "Hidden"

// It tracks dependencies based on execution path:
// If _.showDetails is true: tracks ['showDetails', 'user'] (not 'user.name')
// If _.showDetails is false: tracks ['showDetails'] only
```

**Deep Observation, Shallow Tracking**: Changes are observed at any nested level but dependencies are tracked only at the top-level property:

```javascript
_.user = { profile: { name: "Alice", age: 30 } }

// Function that depends on user data
() => _.user.profile.name  // Tracks dependency: ['user']

// Later: deep change detection
_.user.profile.name = "Bob"  // Detected as change to 'user'
// Triggers: re-render of function above (depends on 'user')
```

This design keeps dependency tracking simple while still detecting all relevant changes.

### 3. Tracking Context Stack
The stack exists solely to map executing functions to their target DOM nodes:

```javascript
// Pseudocode
let trackingStack = []

function executeReactiveFunction(fn, targetNode) {
  trackingStack.push({ node: targetNode, deps: new Set() })
  const result = fn()
  const { node, deps } = trackingStack.pop()
  
  // Store this specific node's dependencies
  storeDependencies(node, deps)
  
  return result
}
```

Each function's dependencies are stored separately, enabling surgical updates:
- Change to `_.title` → only functions that accessed `_.title` re-run
- Change to `_.user.settings.theme` → only functions that accessed that specific path re-run

### 4. Function Return Values
Reactive functions can return:
- **Text/String** - becomes a TextNode
- **DOM Element** - inserted directly
- **Array** - of elements and/or strings, each handled appropriately
- **null/undefined** - results in no content

```javascript
// Returns text → TextNode
() => _.user.name

// Returns element
() => _(`span[class=badge] $1`, [_.user.role])

// Returns array of elements
() => _.items.map(item => _(`li $1`, [item]))

// Returns null (conditional rendering)
() => _.showDetails ? _(`div $1`, [_.details]) : null
```

### 5. Update Mechanism
When state changes:
1. Find all DOM nodes whose functions accessed that state path
2. Re-execute only those functions
3. Update only those DOM nodes with the new results
4. Re-track dependencies (they may have changed based on new state)

## Design Principles

1. **Minimal API Surface** - Just `$` for selection and `_` for reactive templates/state
2. **No Magic** - Dependency tracking should be inspectable via console.log
3. **Direct DOM Manipulation** - No virtual DOM, no diffing algorithms
4. **Zero Build Step** - Pure runtime reactivity
5. **Surgical Updates** - Each function tracks and updates independently

## Success Criteria

- `_` successfully serves as both template function and state object
- Each reactive function independently tracks its state dependencies
- State changes trigger updates only to affected DOM nodes
- Nested reactive functions enable fine-grained updates
- The entire system remains understandable and debuggable

## Behavioral Requirements

1. **State changes must trigger synchronous updates** - When `_.count++` executes, any UI depending on `_.count` updates before the next line of code runs

2. **Dependencies must be re-tracked on every execution** - A function accessing different state paths based on conditions must have its dependencies updated each time it runs

3. **Memory management** - When DOM nodes are removed from the document, their dependency tracking should be cleaned up (no memory leaks)

4. **Error handling** - If a reactive function throws an error, it should not break the entire reactive system or prevent other updates

5. **Deep property access** - Must support tracking nested paths like `_.users[0].profile.settings.theme`

6. **Array mutations** - Changing arrays via methods like `push()` or index assignment should trigger updates just like property assignment

7. **Developer experience** - Should provide a way to inspect current dependencies for debugging (e.g., `_.debugDependencies()` or similar)