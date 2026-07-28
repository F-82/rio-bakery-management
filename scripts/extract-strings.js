"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_morph_1 = require("ts-morph");
const fs = require("fs");
const path = require("path");
const project = new ts_morph_1.Project({
    tsConfigFilePath: "tsconfig.json",
});
const srcDir = path.join(__dirname, "../src");
const localesDir = path.join(__dirname, "../public/locales/en");
if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
}
const enDict = {};
function sanitize(text) {
    return text.trim().replace(/\s+/g, " ");
}
function processFile(sourceFile) {
    let hasModifications = false;
    // Skip files that shouldn't have UI text, like layout or api routes, or already translated
    if (sourceFile.getFilePath().includes("layout.tsx") || !sourceFile.getFilePath().endsWith(".tsx")) {
        return;
    }
    // Check if it's a React component by looking for default export or named export functions that return JSX
    const hasJSX = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxElement).length > 0 || sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxSelfClosingElement).length > 0;
    if (!hasJSX)
        return;
    const jsxTexts = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxText);
    const jsxAttributes = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxAttribute);
    let stringsReplaced = 0;
    // Process JSX Text
    for (const jsxText of jsxTexts) {
        const text = jsxText.getLiteralText();
        const cleanText = sanitize(text);
        // Ignore pure whitespace or simple symbols
        if (cleanText.length > 0 && /[a-zA-Z]/.test(cleanText)) {
            enDict[cleanText] = cleanText;
            jsxText.replaceWithText(`{t("${cleanText.replace(/"/g, '\\"')}")}`);
            stringsReplaced++;
        }
    }
    // Process JSX Attributes like placeholder, title
    const attributesToExtract = ["placeholder", "title", "alt", "label"];
    for (const attr of jsxAttributes) {
        const name = attr.getNameNode().getText();
        if (attributesToExtract.includes(name)) {
            const init = attr.getInitializer();
            if (init && init.isKind(ts_morph_1.SyntaxKind.StringLiteral)) {
                const text = init.getLiteralValue();
                const cleanText = sanitize(text);
                if (cleanText.length > 0 && /[a-zA-Z]/.test(cleanText)) {
                    enDict[cleanText] = cleanText;
                    init.replaceWithText(`{t("${cleanText.replace(/"/g, '\\"')}")}`);
                    stringsReplaced++;
                }
            }
        }
    }
    if (stringsReplaced > 0) {
        // Add import { useTranslation } from "react-i18next"
        const imports = sourceFile.getImportDeclarations();
        const hasI18nImport = imports.some((i) => i.getModuleSpecifierValue() === "react-i18next");
        if (!hasI18nImport) {
            sourceFile.addImportDeclaration({
                namedImports: ["useTranslation"],
                moduleSpecifier: "react-i18next",
            });
        }
        // Try to find the component function to inject `const { t } = useTranslation();`
        // We look for the default export or the main function
        const functions = sourceFile.getFunctions();
        const arrowFunctions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.ArrowFunction);
        // We try to inject it at the top of the body of any function returning JSX
        const injectIntoFunction = (func) => {
            const body = func.getBody();
            if (body && body.isKind(ts_morph_1.SyntaxKind.Block)) {
                const block = body;
                const statements = block.getStatements();
                const hasT = statements.some(s => s.getText().includes("useTranslation"));
                if (!hasT) {
                    block.insertStatements(0, "const { t } = useTranslation();");
                    hasModifications = true;
                }
            }
        };
        functions.forEach(f => {
            if (f.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxElement).length > 0)
                injectIntoFunction(f);
        });
        arrowFunctions.forEach(f => {
            if (f.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxElement).length > 0)
                injectIntoFunction(f);
        });
        if (hasModifications) {
            sourceFile.saveSync();
            console.log(`Processed: ${sourceFile.getBaseName()}`);
        }
    }
}
const files = project.getSourceFiles("src/**/*.tsx");
console.log(`Found ${files.length} tsx files.`);
for (const file of files) {
    processFile(file);
}
fs.writeFileSync(path.join(localesDir, "translation.json"), JSON.stringify(enDict, null, 2));
console.log("Extraction complete. Dictionary saved to public/locales/en/translation.json");
