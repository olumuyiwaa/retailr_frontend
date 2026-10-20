import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...coreWebVitals,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  {
    // Rules added by the React Compiler lint preset. Existing code predates them and they flag
    // patterns that work (reading localStorage in an effect, cached lazy components), so they
    // report as warnings until each site is reworked.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
    },
  },
];

export default config;
