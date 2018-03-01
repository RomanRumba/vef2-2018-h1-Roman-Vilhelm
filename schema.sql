DROP TABLE IF EXISTS booksRead;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

CREATE TABLE users(
	id SERIAL PRIMARY KEY,
	username VARCHAR(999) UNIQUE NOT NULL,
	password VARCHAR(999) NOT NULL,
	name VARCHAR(999) NOT NULL,
	imgPath TEXT
);
CREATE TABLE books(
	id SERIAL PRIMARY KEY,
	title VARCHAR(999) UNIQUE NOT NULL,
	ISBN13 char(13) NOT NULL,
	author VARCHAR(999),
	description TEXT NOT NULL,
	category VARCHAR(999) NOT NULL,
	ISBN10 VARCHAR(999),
	published VARCHAR(999),
	pagecount INT,
	language char(2)
);
CREATE TABLE booksRead(
	userID INT REFERENCES users(id),
	bookID INT REFERENCES books(id),
	rating INT,
	review TEXT NOT NULL,
	PRIMARY KEY(userID, bookID)
);

