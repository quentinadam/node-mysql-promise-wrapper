# node-mysql-promise-wrapper

Wrapper for mysql with ES6 Promises

## Installation

```
npm install mysql-promise-wrapper
```

## Usage

```
const Database = require("mysql-promise-wrapper");

let database = new Database({
    host     : 'localhost',
    user     : 'me',
    password : 'secret',
    database : 'db'
});

database.query("SELECT * FROM items WHERE property = ?", ["value"]).then((rows) => {
    console.log(rows);
});

database.connection((connection) => {
    return connection.query("SELECT * FROM items WHERE property = ?", ["value"])
}).then((rows) => {
    console.log(rows);
});

```
