# Reactive Attributes Specification

## Problem

Currently, attribute values in templates do not support reactive functions:

```javascript
// This does NOT work - function is not executed or tracked
_(`div[class=$1]`, [() => _.theme])  // Sets class to "[function]", not "dark"
```

Attribute placeholders only accept static values, but users will naturally expect them to work reactively like content placeholders.

## Required Behavior

Attribute values should support reactive functions just like content placeholders:

```javascript
_.theme = "dark"
_.isActive = true

const element = _(`
  div[class=$1][data-active=$2]
    p $3
`, [
  () => _.theme,           // Should set class="dark" and update when _.theme changes
  () => _.isActive,        // Should set data-active="true" and update when _.isActive changes  
  () => "Content here"     // Content already works reactively
])

// Later: these should update the DOM attributes automatically
_.theme = "light"          // Should change class to "light"
_.isActive = false         // Should change data-active to "false"
```

## Implementation Requirements

### 1. Function Execution for Attributes

Modify attribute processing to detect and execute functions:

```javascript
// In attribute processing (around line 90-92):
if (value.startsWith("$")) {
  const arg_index = Number(value.slice(1)) - 1
  let arg = flint_args[arg_index]
  
  // NEW: Execute function with tracking if needed
  if (typeof arg === "function") {
    arg = $.executeWithTracking(arg, element) // element may not exist yet
  }
  
  value = arg
}
```

### 2. Attribute-Specific Reactivity

Unlike content updates that replace entire nodes, attribute updates must modify existing attributes:

```javascript
// New function needed: $.reExecuteAttributeFunction(tracking_context)
// Should call: element.setAttribute(attributeName, newValue)
```

### 3. Tracking Context for Attributes

Attribute functions need special tracking context that includes:
- The target element
- The attribute name
- The function itself
- Dependencies

```javascript
const attribute_tracking_context = {
  fn: attributeFunction,
  element: targetElement,
  attributeName: "class",
  dependencies: new Set()
}
```

### 4. DOM Update Strategy

When dependencies change, attribute functions should:
1. Re-execute the function
2. Update only the specific attribute on the element
3. NOT replace the entire element (unlike content placeholders)

## Implementation Challenges

### Challenge 1: Element Creation Timing

Attributes are processed before the element is created, but we need the element reference for tracking. 

**Solution**: Process attributes in two phases:
1. Collect reactive attribute functions during parsing
2. Execute and track them after element creation

### Challenge 2: Multiple Attributes on Same Element

A single element may have multiple reactive attributes:

```javascript
_(`div[class=$1][style=$2][data-count=$3]`, [
  () => _.theme,
  () => `color: ${_.textColor}`,
  () => _.count
])
```

Each attribute function needs separate tracking contexts but they all target the same element.

### Challenge 3: Mixed Static and Reactive Attributes

Elements may have both static and reactive attributes:

```javascript
_(`div[id=static-id][class=$1][disabled]`, [() => _.dynamicClass])
```

Only reactive attributes should be tracked and updated.

## Testing Requirements

1. **Basic reactive attributes**: Class, style, data attributes update when state changes
2. **Multiple reactive attributes**: Multiple attributes on same element work independently  
3. **Mixed attributes**: Static attributes remain unchanged when reactive ones update
4. **Memory cleanup**: Attribute function dependencies are cleaned up when element is removed
5. **Performance**: Attribute updates don't trigger unnecessary DOM operations

## Integration with Existing System

### Dependency Map Extension

The existing `$.dependency_map` should work seamlessly:
- Attribute functions are stored alongside content functions
- Same cleanup logic applies when elements are removed
- Same re-execution logic, but different DOM update strategy

### Error Handling

Maintain fail-fast philosophy:
- Invalid attribute values should throw immediately
- Function errors in attributes should not break other reactivity

## Success Criteria

```javascript
// This complete example should work:
_.user = { name: "Alice", role: "admin", active: true }

const userCard = _(`
  div[class=$1][data-role=$2][hidden=$3]
    h3 $4
`, [
  () => _.user.active ? "user-card active" : "user-card",
  () => _.user.role,
  () => !_.user.active,
  () => _.user.name
])

// All of these should update both content AND attributes:
_.user.name = "Bob"           // Updates h3 content
_.user.role = "user"          // Updates data-role attribute  
_.user.active = false         // Updates class and hidden attributes
```

The system should feel natural and consistent - if functions work in content placeholders, they should work identically in attribute placeholders.