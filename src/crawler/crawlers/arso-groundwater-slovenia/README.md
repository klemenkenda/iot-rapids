# rapids-iot crawlers
A crawler for web resources for `rapids-iot`.

The crawler directory includes:

* `config.json` file / config parameters for the parser.
* `crawler.js` file / main crawler file containing Crawler class, which exposes two methods `crawl()` (crawling the web resource) and `load()` (loading data from data lake to database).
* `state.json` file holding the current state of the crawler (file is not committed to the repository).

Each crawler should be able to rebuild the db structure from data lake.

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