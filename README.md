# rapids-iot
A suite for managing IoT data, parsing of web resources, etc. The suite is tightly coupled with [iot-fusion](https://github.com/klemenkenda/iot-fusion) and [ml-rapids](https://github.com/JozefStefanInstitute/ml-rapids).

## Development

### Linter
Use `npm run lint` and `npm run lint-fix` to automatically fix the errors.

## Development plan:

* dockerization of the system
  * decision on the use of scalable DB
* finalize DB schema
* functionality for one crawler to handle multiple scenarios
* development of crawlers
  * General
    * darksky weather forecasts
    * arso daily weather
  * Water4Cities
    * groundwater data (Slovenia)
    * surfacewater data (Slovenia)
    * water pumps (Skiathos)
  * FACTLOG crawlers
    * JEMS (Canada - archive)
    * Piacenza
    * Continental
    * BRC
    * TUPRAS
  * NAIADES
    * Alicante (150.000 sensors!)
* REST API for data retrieval
* REST API for metadata (configuration/sensor registration)
* Simulators (sending data via Kafka or RabbitMQ or something else)
  * simulate also data delay, missing values
