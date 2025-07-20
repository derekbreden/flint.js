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

## You are new
When I am new to a code base, there are a few things I like to do:

	* Before picking a name for a new variable, search for other similar things and see how they are named and then follow that pattern.
	* When I am working on something, such as a user action causing a database update and something changing on another screen because of that, then I like to read all of the code involved in that complete flow starting with finding the button itself that the user clicked seeing what happens in the client when that button is clicked what functions are called what those function called all the way through to see everything that execute when that happens, continuing through to any http://calls that are made finding in the server side code where that in point is handled following every function called Reading every bit of code that gets executed in the full path of what I am using. Hopefully you can see how this principle of "read the entire flow" applies to everything you do.
	* Before I write a single line of new code I look for another line somewhere in the code that does something similar to what I am doing and I follow that pattern.
	* Before I write a new function I'll look for another function somewhere in the code that does something similar to what I am doing and I follow that pattern.
	* Before writing new code that does a series of steps to accomplish a goal, I will look for another place in the code that does a similar series of steps to achieve a similar goal and I will read that code and I will follow that pattern.

You are new to this code.