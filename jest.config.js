module.exports = {
  preset: "ts-jest",
  moduleFileExtensions: ["js", "jsx", "json", "vue", "ts"],
  transform: {
    "^.+\\.vue$": "vue-jest",
    ".+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$":
      "jest-transform-stub",
    "^.+\\.(js|jsx)?$": "babel-jest",
    "node_modules/variables/.+\\.(j|t)sx?$": "ts-jest",
    "^.+\\.ts?$": "ts-jest"
  },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  snapshotSerializers: ["jest-serializer-vue"],
  // testMatch: [
  //   "<rootDir>/(test/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx))",
  //   "<rootDir>/**/**/**/test/**"
  // ],
  transformIgnorePatterns: [
    "<rootDir>/node_modules/",
    "node_modules/(?!variables/.*)"
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/api/**/*.js",
    "<rootDir>/utils/**/*.js",
    "<rootDir>/components/**/*.vue",
    "<rootDir>/pages/**/*.vue"
  ]
};
// "transform": {
//   "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { "presets": ["next/babel"] }]
// },
// "globalSetup": "./globalSetup.js",
// "setupFiles": [
//   "./jest.setup.js"
// ],
// "modulePaths": [
//   "<rootDir>"
// ],
// "testEnvironment": "node",
// "collectCoverageFrom": [
//   "src/server/**",
//   "src/utils/**",
//   "src/pages/api/**",
//   "!src/server/**/**/index.ts"
// ],
// "moduleNameMapper": {
//   "^@root(.*)$": "<rootDir>/src$1",
//   "^@client(.*)$": "<rootDir>/src/client$1",
//   "^@server(.*)$": "<rootDir>/src/server$1"
// },
// "coverageThreshold": {
//   "global": {
//     "statements": 80,
//     "branches": 65,
//     "functions": 80,
//     "lines": 85
//   }
// },
// "moduleDirectories": [
//   "node_modules"
// ]
// }
