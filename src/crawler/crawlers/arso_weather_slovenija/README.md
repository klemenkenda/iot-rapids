# rapids-iot crawlers
A crawler for web resources for `rapids-iot`.

The crawler directory includes:

* `config.json` file / config parameters for the parser (put all the parameters in here - do not hardcode in the crawler)
* `crawler.js` file / main crawler file containing Crawler class, which exposes two methods `crawl()` (crawling the web resource) and `load()` (loading data from data lake to database).
* `state.json` file holding the current state of the crawler (file is not committed to the repository).

Each crawler should be able to rebuild the db structure from data lake.

## Development

### Linting

Always check that your code corresponds to the linter rules. Go to `src/crawlers` and run `npm run lint`. You can use directly `npm run lint-fix` to fix the problems (that can automatically be fixed) with the linter itself.

## Methods

Crawler should use uniformed methods for common operations as defined in `crawlerutils.js`. This utils include:

* `loadState`
* `saveState`
* `loadConfig`
* `getURL` (gets an URL with a promise async/await)
* time manipulation functions:
  * `getWeekOfYear` (gets number of the week in year)
  * `getDayOfYear` (gets day in a year)
  * `saveToDataLake` (saving data to data lake; preferred method is `ldjson` - line delimited JSON)


### External Libraries

Discuss using new libraries (npm modules) for building crawlers with the team. Use the existing solutions to build new crawlers.

Current choices are:

* parsing DOM - [`cheerio`](https://cheerio.js.org/)
* handling time/date - [`moment`](https://momentjs.com/)

## Crawler specific:

Crawler should be set to daily refresh rate.

config.json:

### variables - sensor number as defined by ARSO (PID - parameter id):
p0:{ pid:"12", name:"p", unit:"hPa"},p1:{ pid:"13", name:"pmin", unit:"hPa"},
p2:{ pid:"14", name:"pmax", unit:"hPa"},
p3:{ pid:"2", name:"t2m_termin", unit:"°C"},
p4:{ pid:"15", name:"t2m", unit:"°C"},
p5:{ pid:"16", name:"t2mmin", unit:"°C"},
p6:{ pid:"17", name:"t2mmax", unit:"°C"},
p7:{ pid:"4", name:"rh_termin", unit:"%"},
p8:{ pid:"18", name:"rh", unit:"%"},
p9:{ pid:"19", name:"rhmin", unit:"%"},
p10:{ pid:"20", name:"rhmax", unit:"%"},
p11:{ pid:"26", name:"padavine", unit:"mm"},
p12:{ pid:"21", name:"veter_hitrost", unit:"m/s"},
p13:{ pid:"23", name:"veter_vek_smer", unit:"°"},
p14:{ pid:"24", name:"veter_max_hitrost", unit:"m/s"},
p15:{ pid:"27", name:"energija_gl", unit:"W/m2"},
p16:{ pid:"28", name:"energija_di", unit:"W/m2"},
p17:{ pid:"29", name:"energija_uvb", unit:"mW/m2"}

### station type: 
4 - automatic weather stations - recommended