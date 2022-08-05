module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    // 'plugin:vue/vue3-essential', // 基础错误级别的检测
    'plugin:vue/vue3-recommended', // 提升代码可读性和开发体验级的检测
    'plugin:prettier/recommended'
  ],
  parser: 'vue-eslint-parser',
  plugins: ['vue'],
  rules: {
    'linebreak-style': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    // prop需要定义默认值
    'vue/require-default-prop': 'off',
    // 组件名称必须有多个单词组成
    'vue/multi-word-component-names': 'off'
  }
}
