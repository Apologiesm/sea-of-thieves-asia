// Verifies the beta placeholder contract in config.js
global.window = {};
require("./config.js");
const c = window.SITE_CONFIG;
let bad = 0;

for (const [k, v] of Object.entries(c.links)) {
  if (v !== "REPLACE_BEFORE_LAUNCH") {
    console.log("BAD LINK", k, v);
    bad++;
  }
}
for (const [k, v] of Object.entries(c.collections)) {
  if (v !== "EMPTY_FOR_BETA") {
    console.log("BAD COLLECTION", k, v);
    bad++;
  }
}
console.log("links checked:", Object.keys(c.links).length);
console.log("collections checked:", Object.keys(c.collections).length);
console.log(bad === 0 ? "CONTRACT_OK" : "CONTRACT_FAILED");
process.exit(bad === 0 ? 0 : 1);
