// imports
const Crawler = require('../crawlerutils');
let state = Crawler.loadState(__dirname);
Crawler.saveState(__dirname, state);