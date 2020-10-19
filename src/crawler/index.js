// imports
const CrawlerUtils = require('./utils/crawlerutils');
const ActiveCrawlers = require('./config/active_crawlers.json');
const fs = require('fs');

// dynamically load all the crawlers
const crawlerConfigs = CrawlerUtils.getCrawlers();

const Crawlers = [];
const crawlers = [];
j = 0;

let i = 0;
crawlerConfigs.forEach((crawler) => {
    if (crawler.config.length == undefined) {
        if (ActiveCrawlers.includes(crawler.config.id)) {
            Crawlers.push(require(crawler.dir + '/crawler.js'));
            crawlers.push(new Crawlers[i]());
            i++;
        }
    } else {
        crawler.config.forEach((element) => {
            if (ActiveCrawlers.includes(element.id)) {
                Crawlers.push(require(crawler.dir + '/crawler.js'));
                crawlers.push(new Crawlers[i](id = element.id));
                i++;
            }
        });
    }

    if (!fs.existsSync(__dirname + '/../data/' + crawler.config.id)) {
        fs.mkdirSync(__dirname + '/../data/' + crawler.config.id);
    }
});

// hardcoded loop
const timeouts = {};
crawlers.forEach(async (crawler) => {
    async function runLoop() {
        await crawler.crawl();
    }
    runLoop();
    if (crawler.config.update.includes('d')) {
        timeouts[crawler.config.id] = (crawler.config.update.split('d')[0] * 24 * 60 * 60 * 1000);
    } else if (crawler.config.update.includes('m')) {
        timeouts[crawler.config.id] = (crawler.config.update.split('m')[0] * 60 * 1000);
    } else if (crawler.config.update.includes('h')) {
        timeouts[crawler.config.id] = (crawler.config.update.split('h')[0] * 60 * 60 * 1000);
    }
    setInterval(runLoop, timeouts[crawler.config.id]);
});
