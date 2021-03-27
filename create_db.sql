CREATE TABLE users (id serial PRIMARY KEY, name VARCHAR (100) NOT NULL, fb_id VARCHAR (100) UNIQUE NOT NULL, bio TEXT, is_public BOOL);

CREATE TABLE checks (id serial PRIMARY KEY, from_id INT, to_id INT, activity VARCHAR(20) NOT NULL, CONSTRAINT fk_from_id FOREIGN KEY (from_id) REFERENCES users (id), CONSTRAINT fk_to_id FOREIGN KEY (to_id) REFERENCES users (id));
