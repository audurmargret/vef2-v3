CREATE TABLE IF NOT EXISTS users (
  id serial primay key,
  username varchar(128) not null unique,
  password varchar(300) not null
);