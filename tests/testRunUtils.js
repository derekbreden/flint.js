let test_results = []

const assertEquals = (expected, actual, message) => {
	const pass = expected === actual
	test_results.push({
		pass,
		message,
		expected,
		actual,
	})
}

const runTests = async (test_file_name, test_functions) => {
	test_results = []
	console.log(`  ${test_file_name}`)

	for (const test_fn of test_functions) {
		try {
			const result = test_fn()
			if (result && typeof result.then === "function") {
				await result
			}
		} catch (error) {
			test_results.push({
				pass: false,
				message: `Test threw error: ${error.message}`,
				expected: "No error",
				actual: error.toString(),
			})
		}
	}

	// Print results
	let failures = 0
	test_results.forEach((result) => {
		if (!result.pass) {
			failures++
			console.log(`  ✗ ${result.message}`)
			console.log(`    Expected: ${result.expected}`)
			console.log(`    Actual:   ${result.actual}`)
		} else {
			console.log(`  ✓ ${result.message}`)
		}
	})

	if (failures > 0) {
		console.log(`\n${failures} test(s) failed`)
		process.exit(1)
	}
}

module.exports = { assertEquals, runTests }