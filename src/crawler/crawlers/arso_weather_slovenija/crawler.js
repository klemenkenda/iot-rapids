// imports
const CrawlerUtils = require('../../utils/crawlerutils');
const SQLUtils = require('../../utils/sqlutils.js');

// external imports
const cheerio = require('cheerio');

// const cheerio = require('cheerio'); // handling DOM
const moment = require('moment'); // handling time

/**
 * Class for template crawler.
 */
class ArsoWeatherSloveniaCrawler {
    /**
     * Responsible for loading state
     */
    constructor() {
        // loading config
        this.config = CrawlerUtils.loadConfig(__dirname);
        // loading state
        this.state = CrawlerUtils.loadState(__dirname);
    


        this.SQLUtils = new SQLUtils();
        //this.SQLUtils.getPlaces();
    }
    /**
     * Responsible for crawling at one step.
     *
     * NOTE: Take care that the crawler is resistant to delays (it crawls
     * also historic data if needed). Crawler should provide all the steps
     * denoted in the comments of this method.
     */
    async crawl() {
        console.log('Starting crawl: ' + this.config.id);

        // retrieve data from SQL
        const places = await this.SQLUtils.getPlaces();
        const nodes = await this.SQLUtils.getNodes();
        let sensors = await this.SQLUtils.getSensors();


        // do the crawling here
        try {
            
            const stationNames = []
            let placeData = await this.getLocationData();
            for (const el of Object.keys(placeData.points)) {

                const node_p = {
                    uuid: el.slice(1,),
                    title: placeData.points[el].name,
                    x: placeData.points[el].lon,
                    y: placeData.points[el].lat
                }
                
                stationNames.push(node_p.title);
            
                // does this place already exist?
                const place = places.filter(x => x.uuid === node_p.uuid);
                if (place.length === 0) {
                    await this.SQLUtils.insertPlace("arso_weather_slovenija", node_p.uuid, node_p.title, node_p.x, node_p.y);
                };

                //NODES

                const node = nodes.filter(x => x.uuid === node_p.uuid);
                if (node.length === 0) {
                    await this.SQLUtils.insertNode(node_p.uuid, node_p.uuid, node_p.title + " samodejna postaja");
                };

            


            }
            
            let weatherData = await this.getWeatherData(places);
            let param;
            let stationList = []
            for (let station in weatherData) {
                param = [];
                let name = stationNames[station].replace(/\s/g, "");
                stationList.push(name)
                for (let vars of Object.values(weatherData[station].params)) {
                    param.push(vars);
                }
                let lastMeasure;
                let stationData = [];
                let lastUnix;
                for (let el of Object.values(weatherData[station].points)) {
                    for (let ts of Object.keys(el)) {
                        lastUnix = (parseInt(ts.slice(1,))-89411160)*60;
                        lastMeasure = moment.unix((parseInt(ts.slice(1,))-89411160)*60).toISOString(true);
                        let measurement = {
                            "Date" : lastMeasure
                        }
                       for (let i in param) {
                           
                           if (Object.entries(el[ts])[i]) {
                            measurement[`${param[i].name} [${param[i].unit}]`] = `${Object.entries(el[ts])[i][1]}`;
                           } else {
                            measurement[`${param[i].name} [${param[i].unit}]`] = "/";
                           } 
                       }
                        
                        stationData.push(JSON.stringify(measurement));
                 
                    }
                }


                /*//inserting sensors into the db
                for (let idx in param) {
                    const sensor = sensors.filter(x => x.uuid === JSON.stringify(Object.keys(weatherData[station].points)).slice(3,-2));
                    if (sensor.length === 0) {
                        let uuid = JSON.stringify(Object.keys(weatherData[station].points)).slice(3,-2);
                        await this.SQLUtils.insertSensor(idx,uuid, param[idx].pid, param[idx].name + "[" + param[idx].unit + "]")
                    };
                }
                */

                
                
                let fromTime = this.config.time_interval[0];
                if (this.state != {}) {
                    if (this.state[name] !== undefined) {
                        fromTime = moment.unix(this.state[name].lastRecord).toISOString(true);
                    }
                }
                
               // update datalake repository with the crawled data
                if (fromTime !== lastMeasure) {
                    CrawlerUtils.saveToDataLake(stationData, fromTime, {
                        dir: this.config.id,
                        type: this.config.log_type,
                        name: name + "[" + this.config.time_interval + "]",
                    });    
                }



                
                // update the state with the last crawled timestamp
                this.updateState(stationList, lastUnix);
    

                // write final state
                CrawlerUtils.saveState(__dirname, this.state);

            }
                


        } catch (e) {
                console.log("ERROR:", e);
        }

        console.log('Finishing crawl: ' + this.config.id);
    }

    
    async getLocationData(base_loc = this.config.url_locations, 
        timeInterval = this.config.time_interval, 
        types = this.config.station_type) {
        const url = base_loc + "d1=" + timeInterval[0] + "&d2=" + timeInterval[1] + "&type=" + types;
        const body = await CrawlerUtils.getURL(url);
        const $ = cheerio.load(body, {xmlMode: true});
        let stringData = $("pujs").text().slice(17, -2);
        const locationData = JSON.parse(stringData.replace(/(\w+:)|(\w+ :)/g, function(s) {
            return '"' + s.substring(0, s.length-1) + '":';
          }));
        return locationData;
    }
    
    async getWeatherData(places, url = this.config.url_data, vars = this.config.variables, 
        update = this.config.update, timeInterval = this.config.time_interval) {
            const weather = []
            let i = 0
            for (const station of places) {
                if (i === 3) {
                    break;
                }
                i++

                let weatherUrl = url + "vars=" + vars + "&group=" + update + "Data0&type=" + update + "&id=" + station.uuid + "&d1=" + timeInterval[0] + "&d2=" + timeInterval[1];
                const body = await CrawlerUtils.getURL(weatherUrl);
                const $ = cheerio.load(body, {xmlMode: true});
                let stringData = "{" + $("pujs").text().slice(117, -1)
                let weatherData = JSON.parse(stringData.replace(/(\w+:)|(\w+ :)/g, function(s) {
                    return '"' + s.substring(0, s.length-1) + '":';
                }));
                ;
                weather.push(weatherData)
            }

            return weather;
        }


    findWithAttr(array, attr, value) {
        for(var i = 0; i < array.length; i += 1) {
            if(array[i][attr] === value) {
                return i;
            }
        }
        return -1;
    }        

    

    updateState(stationList, lastRecord) {
        for (let name of stationList) {

            this.state[name] = {"lastRecord" : lastRecord};
            
        }
    
    }
    /**
     * Loads the datalake data into the database.
     */
    load() {
        // load the data from datalake into the db
    }
}




module.exports = ArsoWeatherSloveniaCrawler;
