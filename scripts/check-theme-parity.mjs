import fs from "node:fs";

const stylesheet = fs.readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const themeToken = /^\s*(--(?:color|background|shadow)-[\w-]+):\s*(.+);$/gm;

function block(selector) {
  const start = stylesheet.indexOf(selector);
  if (start < 0) throw new Error(`Missing theme selector: ${selector}`);
  const openingBrace = stylesheet.indexOf("{", start);
  const closingBrace = stylesheet.indexOf("\n}", openingBrace);
  if (openingBrace < 0 || closingBrace < 0) throw new Error(`Malformed theme block: ${selector}`);
  return {
    start,
    end: closingBrace + 2,
    content: stylesheet.slice(openingBrace + 1, closingBrace),
  };
}

function tokens(themeBlock) {
  return new Map([...themeBlock.content.matchAll(themeToken)].map((match) => [match[1], match[2]]));
}

const lightBlock = block(":root");
const darkBlock = block('html[data-theme="dark"]');
const light = tokens(lightBlock);
const dark = tokens(darkBlock);
const lightOnly = [...light.keys()].filter((token) => !dark.has(token));
const darkOnly = [...dark.keys()].filter((token) => !light.has(token));

if (lightOnly.length || darkOnly.length) {
  throw new Error(`Theme token mismatch. Light only: ${lightOnly.join(", ") || "none"}. Dark only: ${darkOnly.join(", ") || "none"}.`);
}

const unused = [...light.keys()].filter((token) => !stylesheet.includes(`var(${token})`));
if (unused.length) throw new Error(`Unused theme tokens: ${unused.join(", ")}`);

const componentCss = [
  stylesheet.slice(0, lightBlock.start),
  stylesheet.slice(lightBlock.end, darkBlock.start),
  stylesheet.slice(darkBlock.end),
].join("\n");
const rawColor = /#[0-9a-f]{3,8}\b|rgba?\(|(?:repeating-)?linear-gradient\(/i;
if (rawColor.test(componentCss)) {
  throw new Error("A raw color was found outside the semantic theme blocks.");
}

function relativeLuminance(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) throw new Error(`Surface hierarchy token must be a six-digit hex color: ${value}`);
  const channels = match[1].match(/.{2}/g).map((channel) => Number.parseInt(channel, 16) / 255);
  return channels.reduce((sum, channel, index) => {
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

const lightSurfaces = {
  panel: relativeLuminance(light.get("--color-surface-panel")),
  page: relativeLuminance(light.get("--color-surface-page")),
  chrome: relativeLuminance(light.get("--color-surface-chrome")),
};
const darkSurfaces = {
  panel: relativeLuminance(dark.get("--color-surface-panel")),
  page: relativeLuminance(dark.get("--color-surface-page")),
  chrome: relativeLuminance(dark.get("--color-surface-chrome")),
};
if (!(lightSurfaces.panel > lightSurfaces.page && lightSurfaces.page > lightSurfaces.chrome)) {
  throw new Error("Light surfaces must descend in luminance: panel > page > chrome.");
}
if (!(darkSurfaces.panel < darkSurfaces.page && darkSurfaces.page < darkSurfaces.chrome)) {
  throw new Error("Dark surfaces must ascend in luminance: panel < page < chrome.");
}

const changed = [...light].filter(([token, value]) => dark.get(token) !== value).length;
console.log(JSON.stringify({
  lightDeclarations: light.size,
  darkDeclarations: dark.size,
  matchingTokenNames: true,
  changedValues: changed,
  sharedValues: light.size - changed,
  lightDistinctValues: new Set(light.values()).size,
  darkDistinctValues: new Set(dark.values()).size,
  surfaceHierarchy: {
    light: "panel > page > chrome",
    dark: "panel < page < chrome",
  },
}, null, 2));
