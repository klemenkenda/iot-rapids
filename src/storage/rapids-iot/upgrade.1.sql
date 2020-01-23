-- use correct database
use rapidsiot;

-- create table for system
create table system(
    id int auto_increment,
    ts timestamp not null default current_timestamp,
    db_version int
) collate=utf8_slovenian_ci;