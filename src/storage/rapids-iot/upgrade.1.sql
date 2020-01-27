-- use correct database
use rapidsiot;

-- create table for system
create table system(
    id int auto_increment,
    ts timestamp not null default current_timestamp,
    db_version int,
    primary key (id)
) collate=utf8_slovenian_ci;


-- create table for nodes
create table nodes(
    id int auto_increment,
    ts timestamp not null default current_timestamp,
    parent_id int,
    name  varchar(255),
    primary key (id)
) collate=utf8_slovenian_ci;

-- create table for sensor types
create table sensor_types(
    id int auto_increment,
    ts timestamp not null default current_timestamp,
    phenomena varchar(50),
    uom varchar(50),
    -- todo: min, max?
    primary key (id)
) collate=utf8_slovenian_ci;

-- create table for sensors
create table sensors(
    id int auto_increment,
    ts timestamp not null default current_timestamp,
    node_id int,
    sensor_type_id int,
    primary key (id)
) collate=utf8_slovenian_ci;

-- create table for measurements
create table measurements(
    id int auto_increment,
    ts timestamp not null default current_timestamp,
    measurement_ts timestamp,
    sensor_id int,
    value json,
    primary key (id),
    index(sensor_id),
    index(measurement_ts),
    index(value)
) collate=utf8_slovenian_ci;