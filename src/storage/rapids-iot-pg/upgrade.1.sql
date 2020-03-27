-- use correct database
use rapidsiot;

-- create table for system
create table system(
    id int auto_increment,
    ts timestamp not null default current_timestamp,
    db_version int,
    primary key (id)
) collate=utf8_slovenian_ci;


-- create table for places
create table places(
    uuid varchar(50),
    ts timestamp not null default current_timestamp,
    title varchar(255),
    crawler varchar(50),
    x float,
    y float,
    primary key (uuid)
) collate=utf8_slovenian_ci;

-- create table for nodes
create table nodes(
    uuid varchar(50),
    ts timestamp not null default current_timestamp,
    place_uuid varchar(50),
    title varchar(255),
    primary key (uuid)
) collate=utf8_slovenian_ci;

-- create table for sensor types
create table sensor_types(
    uuid varchar(50),
    ts timestamp not null default current_timestamp,
    phenomena varchar(50),
    uom varchar(50),
    description varchar(255),
    -- todo: min, max?
    primary key (uuid)
) collate=utf8_slovenian_ci;

-- create table for sensors
create table sensors(
    id int auto_increment,
    uuid varchar(50),
    ts timestamp not null default current_timestamp,
    node_uuid varchar(50),
    sensor_type_uuid varchar(50),
    title varchar (255),
    primary key (id),
    index(uuid)
) collate=utf8_slovenian_ci;

-- create table for measurements
create table measurements(
    id int auto_increment,
    ts timestamp not null default current_timestamp,
    measurement_ts timestamp,
    sensor_id int,
    value float,
    primary key (id),
    index(sensor_id),
    index(measurement_ts),
    index(value)
) collate=utf8_slovenian_ci;