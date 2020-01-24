// imports
const CrawlerUtils = require('./crawlerutils');

// dynamically load all the crawlers
let crawler_configs = CrawlerUtils.getCrawlers();

let Crawlers = [];
let crawlers = [];

crawler_configs.forEach((crawler, i) => {

    Crawlers.push(require(crawler.dir + "/crawler.js"));
    crawlers.push(new Crawlers[i]());

});

console.log(crawlers[1].load(), crawlers[1].config);