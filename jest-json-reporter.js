const fs = require('fs');
const path = require('path');

/**
 * Custom Jest reporter that writes results as JSON for the health API.
 * Results are saved to .next/test-results.json for consumption by /api/health/run-tests.
 */
class JsonReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    const output = {
      timestamp: new Date().toISOString(),
      success: results.success,
      numTotalTests: results.numTotalTests,
      numPassedTests: results.numPassedTests,
      numFailedTests: results.numFailedTests,
      numPendingTests: results.numPendingTests,
      startTime: results.startTime,
      duration: Date.now() - results.startTime,
      testSuites: results.testResults.map(suite => ({
        name: path.basename(suite.testFilePath),
        status: suite.numFailingTests > 0 ? 'failed' : 'passed',
        duration: suite.perfStats?.end - suite.perfStats?.start || 0,
        tests: suite.testResults.map(test => ({
          name: test.fullName || test.title,
          status: test.status,
          duration: test.duration,
          error: test.failureMessages?.length > 0
            ? test.failureMessages.join('\n').substring(0, 500)
            : null
        }))
      }))
    };

    const outDir = path.resolve(__dirname, '.next');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outDir, 'test-results.json'),
      JSON.stringify(output, null, 2)
    );
  }
}

module.exports = JsonReporter;
