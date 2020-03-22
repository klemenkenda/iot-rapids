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
    x float,
    y float,
    primary key (uuid)
) collate=utf8_slovenian_ci;

-- create table for nodes
create table nodes(
    uuid varchar(50),
    ts timestamp not null default current_timestamp,
    place_id int,
    name varchar(255),
    primary key (uuid)
) collate=utf8_slovenian_ci;

-- create table for sensor types
create table sensor_types(
    id int auto_increment,
    ts timestamp not null default current_timestamp,
    phenomena varchar(50),
    uom varchar(50),
    description varchar (255),
    -- todo: min, max?
    primary key (id)
) collate=utf8_slovenian_ci;

-- create table for sensors
create table sensors(
    uuid varchar(50),
    ts timestamp not null default current_timestamp,
    node_id int,
    sensor_type_id int,
    title varchar (255),
    primary key (uuid)
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