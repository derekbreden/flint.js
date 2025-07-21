const fs = require("fs")
const path = require("path")
const { spawn } = require("child_process")

const findTestFiles = (dir) => {
	const files = []
	const items = fs.readdirSync(dir)

	for (const item of items) {
		const fullPath = path.join(dir, item)
		const stat = fs.statSync(fullPath)

		if (stat.isDirectory()) {
			files.push(...findTestFiles(fullPath))
		} else if (item.endsWith(".test.js")) {
			files.push(fullPath)
		}
	}

	return files
}

const runTest = (testPath) => {
	return new Promise((resolve) => {
		const child = spawn("node", [testPath], {
			stdio: "inherit"
		})

		child.on("close", (code) => {
			resolve(code === 0)
		})
	})
}

const runAllTests = async () => {
	console.log("Running tests...\n")

	const testDir = path.join(__dirname, "functional")
	const testFiles = findTestFiles(testDir)

	let passed = 0
	let failed = 0

	for (const testFile of testFiles) {
		const success = await runTest(testFile)
		if (success) {
			passed++
		} else {
			failed++
		}
	}

	console.log(`\nTest Summary: ${passed} passed, ${failed} failed`)

	if (failed > 0) {
		process.exit(1)
	}
}

runAllTests()