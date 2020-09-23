The crawlers in `config.json` should have the following structure:
```json
{
    "id": "pxweb2",
    "data-lake-type": "ldjson",
    "log_type": "yearly",
    "update": "1d",
    "url": "https://pxweb.stat.si:443/SiStatDb/api/v1/sl/20_Ekonomsko/04_cene/04250_IUC/0425005S.px",
    "db_uuid": "indeksi_uvoznih_neevro",
    "short_db_name": "Indeksi uvoznih cen neevro območje (CPA 2015)",
    "geo_metric_uuid": "obcina",
    "restrictions": {
      "INDEKS": [11]
    }
}
```
As the pxweb data might not contain unique and/or human-readable identifiers, some properties need to be added:
* `db_uuid` should be a unique UUID of the crawled table that will be used in the database
* `short_db_name` should be a human-readable database name
* `geo_metric_uuid` should be consistent across crawlers that use the same geographical category (e.g. občine...) If there is no geographical metric in the table, the default (`"SLOVENIJA"`) will be used.
* Optionally, `restrictions` can be added. The dimensions to be restricted (INDEKS in the above example) and their values (11 in the above example) can be obtained by selecting them in the PxWeb frontend and looking at the JSON query - see [this document](https://www.stat.si/StatWeb/File/DocSysFile/10721/px_web_api_help_SL.pdf) pages 4 and 5.

By default, all dimensions in the database are combined with each other. This might mean a lot of data. **Pay attention that the field limit that some APIs have is not exceeded.** Create several crawlers with different restrictions to overcome the limit.

TODO: Retrieve locations of cities, municipalities, cohesion regions etc., Tests...