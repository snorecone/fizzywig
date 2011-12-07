var domString = "<html><head></head><body></body></html>";
document = require("jsdom").jsdom(domString, null, { features: { QuerySelector: true }});
window = document.createWindow();
navigator = window.navigator;
CSSStyleDeclaration = window.CSSStyleDeclaration;

require("./env-assert");
require("../fizzywig.js");

fizzywig = window.fizzywig;
