const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment');

const CrawlerUtils = require('../../crawlerutils');

class ArsoWaterSloveniaCrawler {
    constructor(water_type, url_file, data_file) {
        this.water_type = water_type;
        this.config = CrawlerUtils.loadConfig(__dirname);

        if (this.water_type == 'sw') {
            this.url = this.config.surface_water.start;
            this.base_url = this.config.surface_water.base;
            this.time_parse = 'DD.MM.YYYY hh:mm';
        } else if (this.water_type == 'gw') {
            this.url = this.config.ground_water.start;
            this.base_url = this.config.ground_water.base;
            this.time_parse = 'YYYY-MM-DD hh:mm';
        }
        this.url_file = url_file;
        this.data_file = data_file;
    }

    /**
     * Run to crawl.
     */
    async crawl() {
        let self = this;
        let links =  await this.getURLs();

        for (let i = 0; i < links.length - 1; i++) {
            let url = links[i];
            self.getData(url);
        }
    }

    /**
     * construct file with URLs with data
     * @param {String} url 
     * @param {String} base_url
     */
    getURLs(url = this.url, base_url = this.base_url) {
        return new Promise((resolve, _) => {
            let links = [];
            request(url, (err, _res, body) => {
                if (err) {
                    console.log(err, "error occured while hitting URL");
                } else {
                    const $ = cheerio.load(body);
                    $('map>area').each(function () {
                        let link = $(this).attr('href');
                        link = base_url + link;
                        links.push(link);
                    })
                    resolve(links);
                }
            })
        })
    }

    /**
     * Get data and save it in csv file
     * @param {String} url 
     */
    getData(url) {
        let data = [];
        let station_name = '';
        let from_time = 0;
        let self = this;
        request(url, (err, res, body) => {
            if (err) {
                console.log(err, "error occured while hitting URL");
            } else {
                const $ = cheerio.load(body);
    
                $('body>table>tbody>tr>td.vsebina>h1').each(function() { // find name of station
                    station_name = $(this).text().replace(/ /g, "_").replace(/_-_/g, "-").replace(/\//g, "-");
                });

                fs.readFile(self.data_file + station_name + '.csv', 'utf-8', (err, dat) => {
                    if (err) {
                        data = self.findData($, data, from_time);
                        self.saveToFile(data, station_name);
                    } else {
                        from_time = self.checkLastDate(dat);
                        data = self.findData($, data, from_time);
                        //console.log(data)
                        self.saveToFile(data, station_name);
                    }
                });
            }    
        });
    }

    /**
     * Save data to file.
     * @param {Array} data 
     * @param {String} station_name 
     */
    saveToFile(data, station_name) {
        let self = this;
        for (let i = data.length; i > 0; i--) {
            fs.appendFileSync(self.data_file + station_name + '.csv', String(data[i-1])+'\n', err => {});
        }
    }

    /**
     * Find data in HTML
     * @param {*} $ 
     * @param {Array} data 
     * @param {Date} from_time 
     */
    findData($, data, from_time) {
        let get_out = false;
        let self = this;
        $('body>table>tbody>tr>td.vsebina>table.podatki>tbody>tr').each(function () { // get data
            let new_data = [];
            let iter_num = 0;
    
            $(this).find('td').each(function () {
                let item = $(this).text();
    
                if (iter_num == 0) {
                    item = String(moment(item, self.time_parse).format());
                    if (from_time >= Date.parse(item)) {
                        get_out = true;
                        return false;
                    };
                };
                new_data.push(item);
                iter_num += 1;
            });
    
            if (get_out) {
                return false;
            }

            //console.log(new_data)
            if (self.water_type == 'gw' && new_data[1] == '-' && new_data[2] == '-') {
                // do not write when no data for ground water
            } else if (self.water_type == 'sw' && new_data[1] == '-' && new_data[2] == '-' && new_data[3] == '-') {
                // do not write when no data for surface water
            } else {
                data.push(new_data);
            };
            
        });
        return data;
    }

    /**
     * Check last date.
     * @param {String} dat 
     */
    checkLastDate(dat) {
        let lines = dat.trim().split('\n');
        let lastLine = lines.slice(-1)[0];
    
        let splitLine = lastLine.split(',');
        let from_time = Date.parse(splitLine.slice(0)[0]);

        return from_time;
    }
}
module.exports = ArsoWaterSloveniaCrawler;

let cr_sur = new ArsoWaterSloveniaCrawler(water_type='sw', url_file='linksSurface.txt', data_file='./data_surfacewater/');
//let cr_gr = new ArsoWaterSloveniaCrawler(water_type='gw', url_file='linksGround.txt', data_file='./data_groundwater/');

cr_sur.crawl();
//cr_gr.crawl();
