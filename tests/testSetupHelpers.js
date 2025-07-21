const { JSDOM } = require("jsdom")
const fs = require("fs")
const path = require("path")

const setupTestEnvironment = async () => {
	const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
		url: "http://localhost:3000",
		pretendToBeVisual: true,
	})

	const window = dom.window
	global.window = window
	global.document = window.document

	// Load flint.js
	const flint_source = fs.readFileSync(path.join(__dirname, "..", "flint.js"), "utf8")
	const script = new window.Function(flint_source + "; window.$ = $;")
	script.call(window)

	return window
}

module.exports = { setupTestEnvironment }