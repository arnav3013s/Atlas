# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Nationwide portfolio demo

The app contains 55 fictional properties: the original five Texas properties plus 50 generated examples, one in each U.S. state. These are not actual CBRE assets or live readings. Approximate city coordinates are in `src/locations.ts`; synthetic readings and costs are generated in `src/App.tsx` using the same screening formula as the original properties.

`src/NationalMap.tsx` renders an offline SVG map with status markers, nearby-property groups, zoom, pan, and links to the property overview. Search matches property names, building types, cities, and full state names. Status filters affect both the map and cards. Recovery previews update map colors and the portfolio average; manual scenarios remain separate.

State outlines in `src/usaMap.ts` are projected from `src/us-states.json`, retrieved from https://github.com/PublicaMundi/MappingAPI/blob/master/data/geojson/us-states.json. Alaska and Hawaii use repositioned, scaled insets. No map API key or runtime map network request is required.

## AI assistant setup

From the app folder, copy `.env.example` to `.env`, then set `OPENAI_API_KEY` in `.env` to your OpenAI API key. Never put the key in React code or a VITE_ variable, commit it, or paste it in chat. Optionally change OPENAI_MODEL to a Responses-compatible model available to your account (default gpt-4.1-mini).

Stop the existing server with Ctrl+C and run `npm run dev` from the app folder. It starts Vite and the local API on port 8787. Choose AI Assistant in the sidebar to open the full-page workspace, or use Ask AI in a property overview. Select a facilities manager, technician or executive role.

Without a key, automatic scores and action previews still work. AI shows connection instructions, not fabricated responses. Submitting sends this property's sample readings, calculated values and conversation to OpenAI using store:false. Conversations stay in browser memory and clear when you leave the AI page, switch properties or change roles. The assistant cannot execute actions or modify scores.

Checks: npm run build, npm run lint, npm run test:assistant. Backend tests do not make paid API calls. Live output needs an API key and credits. This server is for a local hackathon demo; public hosting requires authentication, quotas and deployment origin controls. Static hosting alone does not run the assistant API.

Documentation: https://developers.openai.com/api/docs/guides/text

