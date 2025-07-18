// https://www.figma.com/plugin-docs/manifest/
export default {
  name: "202506coupling-auto",
  id: "1527295112135238807",
  api: "1.0.0",
  main: "plugin.js",
  ui: "index.html",
  "documentAccess": "dynamic-page",
  "networkAccess": {
    "allowedDomains": [
      "*"
    ],
    "reasoning": "dev"
  },
  capabilities: [],
  enableProposedApi: false,
  editorType: ["figma", "figjam"],
};
