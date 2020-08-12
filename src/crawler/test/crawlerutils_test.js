const CrawlerUtils = require('../utils/crawlerutils.js');
const assert = require('assert');

describe('Testing crawlerutils', () => {
    it('getCrawlers', () => {
        const crawlers = CrawlerUtils.getCrawlers();
        assert.equal(Array.isArray(crawlers), true);
    });

    it('buildJSONStatQuery', async () => {
        const testUrl = "https://pxweb.stat.si:443/SiStatDb/api/v1/sl/20_Ekonomsko/14_poslovni_subjekti/01_14188_podjetja/1418807S.px";
        const testRestrictions = {
            "LETO": ["2012"],
            "OBČINE": ["002"]
        }
        const query = await CrawlerUtils.buildJSONStatQuery(testUrl, testRestrictions);
        
        assert.equal(query.query === undefined, false);
        assert.equal(query.query.length > 0, true);

    });
});
