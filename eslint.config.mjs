import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    // The site is served from a subdirectory, so a root-relative URL written by
    // hand resolves above the app and 404s. Next prefixes <Link>, the router and
    // next/image for you, but nothing else — and because local dev serves from
    // the root, the mistake builds clean and looks correct right up until it is
    // deployed. That is how the logo and the login artwork shipped broken.
    // Route these through asset() from lib/asset.ts instead.
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // Lowercase JSX names are raw HTML elements, which is exactly the set
          // Next does NOT prefix. Capitalised ones (<Link>, <Image>) are
          // components that handle it themselves, so they must not be flagged.
          selector:
            'JSXOpeningElement[name.name=/^(img|source|video|audio|iframe|embed|object|track|a|link|area|use|image|script)$/] > JSXAttribute[name.name=/^(src|srcSet|poster|data|href|xlinkHref)$/] > Literal[value=/^\\/(?!\\/)/]',
          message:
            "Root-relative URL breaks under basePath. Wrap it in asset() from @/lib/asset — or use <Link>/next-image, which prefix it themselves.",
        },
        {
          selector:
            'CallExpression[callee.object.name="window"][callee.property.name=/^(open)$/] > Literal[value=/^\\/(?!\\/)/]',
          message:
            "window.open bypasses the router, so basePath is not applied. Wrap the path in asset() from @/lib/asset.",
        },
      ],
    },
  },
];

export default eslintConfig;
