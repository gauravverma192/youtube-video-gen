import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["src/cli/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@remotion/bundler",
              message:
                "Import @remotion/bundler only from src/cli. Preview and composition code must not bundle or render.",
            },
            {
              name: "@remotion/renderer",
              message:
                "Import @remotion/renderer only from src/cli. Preview and composition code must not bundle or render.",
            },
          ],
        },
      ],
    },
  },
];
