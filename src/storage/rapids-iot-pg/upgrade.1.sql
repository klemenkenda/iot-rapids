-- use correct database
create schema if not exists rapids_iot;

-- create table for system
create table rapids_iot.system(
    id serial primary key not null,
    ts timestamp not null default current_timestamp,
    db_version int
);

-- create table for places
create table rapids_iot.places(
    uuid varchar(50),
    ts timestamp not null default current_timestamp,
    title varchar(255),
    crawler varchar(50),
    x float,
    y float,
    primary key (uuid)
);

-- create table for nodes
create table rapids_iot.nodes(
    uuid varchar(50),
    ts timestamp not null default current_timestamp,
    place_uuid varchar(50),
    title varchar(255),
    primary key (uuid)
);

-- create table for sensor types
create table rapids_iot.sensor_types(
    uuid varchar(50),
    ts timestamp not null default current_timestamp,
    phenomena varchar(50),
    uom varchar(50),
    description varchar(255),
    -- todo: min, max?
    primary key (uuid)
);

-- create table for sensors
create table rapids_iot.sensors(
    id serial primary key not null,
    uuid varchar(50),
    ts timestamp not null default current_timestamp,
    node_uuid varchar(50),
    sensor_type_uuid varchar(50),
    title varchar (255)
);
create unique index sensors_uuid_idx on rapids_iot.sensors (uuid);

-- create table for measurements
create table rapids_iot.measurements(
    id serial primary key not null,
    ts timestamp not null default current_timestamp,
    measurement_ts timestamp,
    sensor_id int,
    value float
);
create unique index measurements_sensor_id_ts_idx on rapids_iot.measurements (sensor_id, measurement_ts);
create index measurements_sensor_id_idx on rapids_iot.measurements (sensor_id);
create index measurements_ts_idx on rapids_iot.measurements (measurement_ts);
