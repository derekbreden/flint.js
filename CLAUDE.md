# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Principles

Every line, every punctuation mark, every word considered carefully. Say only what is absolutely necessary. Delete what is not.

## Progress Reporting Format

When making changes, use this format:

**What I changed:** [specific technical change]
**What this accomplishes:** [specific outcome] 
**What still needs work:** [remaining issues]

## Code Conventions

### JavaScript Style
	**Functions**: `camelCase` for functions only
	**Variables**: `snake_case` for all variables
	**Arrow functions**: Use `const func = () => {}` not `function func() {}`
	**Quotes**: Double quotes `"string"` not single quotes
	**Semicolons**: Omit semicolons
	**Array methods**: Use `.includes()` instead of `.indexOf() === -1`
	**Casting**: Use `Number()` not `parseInt()`

## DRY vs Readability

**Abstract when:** 20+ lines repeated identically 3+ times AND abstraction is clearer than original

**Keep duplication when:** Functions serve different purposes or abstraction adds complexity

**The test:** Would you rather debug the abstracted or original version?

## Flint.js Philosophy

### Fail Fast
Errors should bubble up immediately. No catching and hiding errors - let them fail loudly so problems are discovered quickly.

### Clean API Separation
- **`_` function**: Template creation only. Executes functions immediately, creates DOM elements.
- **`$` function**: DOM selection only. Returns elements with helper methods.

### Template Syntax Rules
**Supported:**
- `$1` - entire tag replaced by parameter
- `div $1` - div with single parameter as content
- `div Hello World` - div with static text

**Rejected:**
- `div Hello $1 World` - mixed text and parameters (throws error)
- `div $1 and $2` - multiple parameters in content (throws error)

### Function Parameters and Reactivity
Functions in template arguments execute immediately and are tracked for dependencies. When reactive state changes, these functions re-execute and update the DOM automatically. Return values (strings, numbers, DOM elements, arrays) are used as parameters for both content and attributes.

**Reactive Content**: `div $1` where `$1` is `() => _.message` updates when `_.message` changes
**Reactive Attributes**: `div[class=$1]` where `$1` is `() => _.theme` updates attributes when `_.theme` changes

## Testing Philosophy

### No Guard Assertions

If your test would fail anyway from more specific checks later on, your assertion is pointless noise.

```javascript
// ❌ WRONG: $element.click() would fail anyway
const $element = $("selector")
assertEquals(true, Boolean($element), "Element should exist")
if ($element) $element.click()

// ❌ WRONG: $("profile-edit-button").click() would fail anyway
$("nav-link").click()
assertEquals("/user/profile", state.path, "Should be on profile") // NOISE
$("profile-edit-button").click() // This tells you navigation failed anyway

// ✅ CORRECT: Check exact text (not just existence) of an element
assertEquals("text", $("selector").textContent.trim(), "Text should match")
```

### Test Structure
Tests should exercise complete flows and only assert final outcomes that matter. Use `_` to create test elements, `$` to select and interact with them.

## Development Philosophy

### Surgical Precision
Every feature must be intentional. If something "accidentally works," question whether it should. Clean boundaries are more important than convenience. When in doubt, prefer explicit errors over subtle bugs.

### Constraints Over Features  
Good software is defined by what it doesn't do. Reject features that muddy the API, even if they seem useful. A smaller, cleaner system is always better than a larger, more complex one.

### Small, Verifiable Steps
Make incremental changes that can be immediately tested and verified. Use temporary console.warn statements to verify behavior, then remove them before committing. Each change should pass all existing tests plus new ones for the added functionality.

### Fail Fast Philosophy
Errors should be loud, immediate, and obvious. Never catch and hide errors. Let them bubble up so problems are discovered quickly. An explicit error is always better than unexpected behavior.

### Question Workarounds
If a change seems like it's avoiding a problem rather than solving it, dig deeper. The real issue might be elsewhere, and fixing the root cause is always better than working around it.

## Standards and Quality

### Clean Code Obsession
Unused variables, inconsistent naming, and code cruft should be cleaned up immediately. Small details matter. Code should be minimal, consistent, and precise.

### Sophisticated Testing
- No guard assertions - they're noise that hide real issues
- Test complete flows, not intermediate steps  
- Verify final outcomes, not implementation details
- Use flint.js itself to create test elements where possible

### Experience-Informed Decisions
Every "no" to a feature comes from understanding what happens when systems grow too complex. Prefer simplicity that scales over convenience that doesn't.

## You are new
When I am new to a code base, there are a few things I like to do:

	* Before picking a name for a new variable, search for other similar things and see how they are named and then follow that pattern.
	* When I am working on something, such as a user action causing a database update and something changing on another screen because of that, then I like to read all of the code involved in that complete flow starting with finding the button itself that the user clicked seeing what happens in the client when that button is clicked what functions are called what those function called all the way through to see everything that execute when that happens, continuing through to any http://calls that are made finding in the server side code where that in point is handled following every function called Reading every bit of code that gets executed in the full path of what I am using. Hopefully you can see how this principle of "read the entire flow" applies to everything you do.
	* Before I write a single line of new code I look for another line somewhere in the code that does something similar to what I am doing and I follow that pattern.
	* Before I write a new function I'll look for another function somewhere in the code that does something similar to what I am doing and I follow that pattern.
	* Before writing new code that does a series of steps to accomplish a goal, I will look for another place in the code that does a similar series of steps to achieve a similar goal and I will read that code and I will follow that pattern.

You are new to this code.