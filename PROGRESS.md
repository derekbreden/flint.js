# Flint.js Progress Toward Reactivity

## Goal
Implement fine-grained reactivity where `_` serves dual purpose: template creation function AND reactive state object. Functions in templates should re-execute automatically when their state dependencies change.

## Key Changes Made

### 1. Separated Template Creation from Selection
- **Before**: Single `$` function handled both selection and creation
- **After**: `_` for template creation, `$` for DOM selection only
- **Benefit**: Clean API separation, matches REACTIVITY.md specification

### 2. Added Function Parameter Support  
- Functions in template args now execute immediately: `_('div $1', [() => someValue])`
- Return values (strings, numbers, DOM elements, arrays) work seamlessly
- Sets foundation for reactive re-execution of same functions

### 3. Added State Monitoring Infrastructure
- `_` is now a Proxy that intercepts property get/set operations
- `_.count = 42` and `_.count` access are both tracked
- TODO placeholders ready for dependency tracking and re-rendering

## Current Status
✅ Template creation with `_`  
✅ Function parameters execute immediately  
✅ State property monitoring via Proxy  
🔄 **Next**: Dependency tracking and automatic re-execution

## Next Steps (Individual Changes)

### Step 4: Track Function Dependencies
When functions execute during template creation, track which `_` properties they access:
```javascript
// During: () => _.count + _.user.name
// Track: ['count', 'user.name'] for this specific function
```
- Implement tracking context stack
- Store dependencies per DOM node/function pair
- Test with functions accessing multiple properties

### Step 5: Re-execute Functions on State Changes
When `_.count = newValue`, find and re-execute all functions that accessed `count`:
```javascript
_.count = 5  // Should trigger re-execution of functions that used _.count
```
- Implement dependency lookup and function re-execution
- Update only affected DOM nodes (not full re-render)
- Test with multiple independent state changes

### Step 6: Handle Nested Property Changes
Support deep property tracking like `_.user.profile.name`:
```javascript
_.user = { profile: { name: "Alice" } }
() => _.user.profile.name  // Should track nested path
_.user.profile.name = "Bob"  // Should trigger update
```
- Implement nested Proxy for object properties
- Track full property paths in dependency system
- Test with complex nested object changes

### Step 7: Array Mutation Support
Handle array operations that should trigger updates:
```javascript
_.items = ["a", "b"]
() => _.items.length  // Should re-execute on array changes
_.items.push("c")     // Should trigger dependent functions
```
- Proxy array methods (push, pop, splice, etc.)
- Track array mutations as state changes
- Test with various array operations

### Step 8: Memory Management
Clean up dependencies when DOM nodes are removed:
- Track DOM node lifecycle
- Remove dependencies for deleted nodes
- Prevent memory leaks in long-running apps

## Testing Philosophy
- Small, incremental changes with immediate testing
- Each step should pass all existing tests plus new ones
- No guard assertions - let failures bubble up naturally
- Use `_` to create test elements, `$` to interact with them

## Architecture Notes
- Fail fast - errors should bubble up immediately
- Re-create DOM nodes on updates (simpler than patching)
- Functions execute synchronously during template creation
- State changes trigger synchronous DOM updates
- No build step - pure runtime reactivity