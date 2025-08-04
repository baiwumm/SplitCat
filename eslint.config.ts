import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import pluginImport from "eslint-plugin-import"; // 新增
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    plugins: {
      js,
      import: pluginImport, // 新增
    },
    settings: {
      "import/resolver": {
        typescript: {
          // 告诉 ESLint 用 TS 的路径映射解析 @
          project: "./tsconfig.json", // 指定你的 tsconfig 路径
        },
      },
    },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
    rules: {
      // 新增 import/order 规则
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // 内置模块（如 `fs`, `path`）
            "external", // 外部依赖（如 `vue`, `lodash`）
            "internal", // 内部路径别名（如 `@/components`）
            "parent", // 父级目录（`../`）
            "sibling", // 同级目录（`./`）
            "index", // 当前目录（`./index`）
          ],
          "newlines-between": "always", // 组之间用空行分隔
          alphabetize: {
            order: "asc", // 按字母顺序排序
            caseInsensitive: true, // 忽略大小写
          },
        },
      ],
    },
  },
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
]);
