module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    "eslint:recommended",
    "plugin:vue/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "vue/max-attributes-per-line": "off",
    "vue/html-indent": "off",
    "vue/html-self-closing": "off",
    "vue/attribute-hyphenation": "off",
    "vue/html-closing-bracket-newline": "off",
    "vue/require-prop-types": "off",
    "vue/html-closing-bracket-spacing": "off",
    "vue/singleline-html-element-content-newline": "off",
    "vue/mustache-interpolation-spacing": "off",
    "vue/multiline-html-element-content-newline": "off",
    "vue/name-property-casing": "off",
    "vue/order-in-components": "off",
    "vue/v-on-style": "off"

    // override/add rules settings here, such as:
    // 'vue/no-unused-vars': 'error'
  }
};
