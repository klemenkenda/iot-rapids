const CrawlerUtils = require('../crawlerutils.js');
const assert = require('assert');

describe('Testing crawlerutils', () => {
    it('getCrawlers', () => {
        const crawlers = CrawlerUtils.getCrawlers();
        assert.equal(Array.isArray(crawlers), true);
    })
})