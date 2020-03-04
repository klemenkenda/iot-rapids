const ArsoCravler = require('../crawlers/arso_water_slovenija/crawler.js');
const assert = require('assert');
const request = require('request');
const cheerio = require('cheerio');

describe('Testing arso crawler', () => {
    it('checkLastDate', () => {
        const crawler = new ArsoCravler();
        const dataWithDate = [{'Datum': '2020-02-01T16:30:00+01:00', 'Vodostaj [cm]': '54'},
            {'Datum': '2020-02-01T16:00:00+01:00', 'Vodostaj [cm]': '54'}];
        const lastDate = crawler.checkLastDate(dataWithDate);

        assert.equal(lastDate, 1580571000000);
    });

    it('findDataNames', () => {
        const crawler = new ArsoCravler();
        request('http://www.arso.gov.si/vode/podatki/amp/H5479_t_30.html', (err, _res, body) => {
            if (err) {
                assert(err);
            } else {
                const $ = cheerio.load(body);
                const names = crawler.findDataNames($);

                assert.equal(names[0], 'Datum');
                assert.equal(names[1], 'Vodostaj [cm]');
                assert.equal(names[2], 'Pretok [m³/s]');
                assert.equal(names[3], 'Temperatura vode [°C]');
            }
        });
    });

    it('findData', () => {
        const crawler = new ArsoCravler();
        request('http://www.arso.gov.si/vode/podatki/amp/H5479_t_30.html', (err, _res, body) => {
            if (err) {
                assert(!err);
            } else {
                const $ = cheerio.load(body);
                const data = crawler.findData($)[0];
                assert.ok(/[0-9]+-[0-9]+-[0-9]+T[0-9]+:[0-9]+:[0-9]+\+[0-9]+:[0-9]+/.test(data['Datum']));
                assert.ok(/[0-9]+/.test(data['Vodostaj [cm]']));
                assert.ok(/[0-9]+\.[0-9]+/.test(data['Pretok [m³/s]']));
                assert.ok(/[0-9]+\.[0-9]+/.test(data['Temperatura vode [°C]']));
            }
        });
    });

    it('getData', () => {
    });

    it('getURLs', async () => {
        const crawler = new ArsoCravler();
        urls = await crawler.getURLs('http://www.arso.gov.si/vode/podatki/amp/Ht_30.html');
        assert.equal(urls[0], 'http://www.arso.gov.si/vode/podatki/amp/H1060_t_30.html');
    });

    it('crawl', () => {
    });
});
