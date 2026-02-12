module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true, // ✔ Coverage
  coverageDirectory: 'coverage',
  reporters: [
    'default',
    // ✔ HTML reports
    ['jest-html-reporters', {
      "publicPath": "./test-reports",
      "filename": "test-report.html"
    }],
    // ✔ CI XML reports (JUnit)
    ['jest-junit', {
      "outputDirectory": "./test-reports",
      "outputName": "junit.xml"
    }]
  ],
  testTimeout: 60000
};