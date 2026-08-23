"use strict";
/**
 * @nymrel/machine-trust
 * Dual-Audience Machine Trust & AI Search Discoverability Engine
 *
 * Copyright 2026 Nymrel / JalenBuilds LLC.
 * Licensed under the MIT License.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Types
__exportStar(require("./types.js"), exports);
// Generators
__exportStar(require("./generators/jsonLd.js"), exports);
__exportStar(require("./generators/llmsTxt.js"), exports);
__exportStar(require("./generators/robotsTxt.js"), exports);
__exportStar(require("./generators/answerFirst.js"), exports);
// Validators
__exportStar(require("./validators/domConsistency.js"), exports);
__exportStar(require("./validators/crawlerAccess.js"), exports);
// Reporters
__exportStar(require("./reporters/index.js"), exports);
//# sourceMappingURL=index.js.map