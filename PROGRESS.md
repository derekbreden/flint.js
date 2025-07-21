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

## Critical Design Decision: Deep Observation, Shallow Tracking

**Observation Level**: Deep - detect changes at any nested level like `_.foo.bar.baz = "b"`  
**Dependency Tracking Level**: Shallow - only track top-level properties like `_.foo`  
**Re-render Trigger**: When `_.foo.bar.baz` changes, treat it as "_.foo changed" and re-render any function that accessed `_.foo`

Example:
```javascript
_.user = { profile: { name: "Alice" } }
() => _.user.profile.name  // Tracks dependency: ["user"] (not "user.profile.name")
_.user.profile.name = "Bob"  // Detected as change to "user", triggers re-render
```

This keeps dependency tracking simple while ensuring all relevant changes trigger updates.

## Next Steps (Individual Changes)

### Step 4: Implement Deep Object Monitoring  
**IMMEDIATE NEXT STEP**: Set up nested Proxy monitoring to detect deep changes but report them as top-level changes:
```javascript
_.foo = {bar: {baz: "a"}}
_.foo.bar.baz = "b"  // Should console.warn: "[MONITOR] Property 'foo' changed"
```
- Add recursive Proxy wrapping for nested objects
- Implement change bubbling to top-level property names
- Add temporary console.warn to verify deep changes are detected as top-level
- Test with nested object modifications and verify correct property names reported
- Remove console.warn after verification

### Step 5: Track Function Dependencies
When functions execute during template creation, track which top-level `_` properties they access:
```javascript
// During: () => _.count + _.user.profile.name
// Track: ['count', 'user'] for this specific function (top-level only)
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