// imports
const CrawlerUtils = require('./utils/crawlerutils');
const ActiveCrawlers = require('./config/active_crawlers.json');
const fs = require('fs');

// dynamically load all the crawlers
const crawlerConfigs = CrawlerUtils.getCrawlers();

crawlerConfigs.forEach((crawler, i) => {
    if (ActiveCrawlers.includes(crawler.config.id)) {
        // create sensor_type fields
        console.log(crawler.config.sensor_types);

        // create files
        if (!fs.existsSync(__dirname + '/../data/' + crawler.config.id)) {
            fs.mkdirSync(__dirname + '/../data/' + crawler.config.id);
        }
    }
});