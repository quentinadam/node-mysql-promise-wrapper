"use strict";

const co = require("co");
const mysql = require("mysql");

class Connection {
    
    constructor(connection, options) {
        Object.defineProperties(this, {
            _connection: {value: connection},
            _processRow: {value: options.processRow},
        });
        for (let key in options.functions) {
            Object.defineProperty(this, key, { value: options.functions[key] });
        }
    }
    
    query(sql, options) {
        return new Promise((resolve, reject) => {
            this._connection.query(sql, options, (error, result) => {
                if (error) {
                    error.sql = mysql.format(sql, options);
                    return reject(error);
                }
                if (result instanceof Array && this._processRow) {
                    result.forEach((row) => { this._processRow(row); });
                };
                resolve(result);
            });
        });
    }
    
    escape(value) {
        return mysql.escape(value);
    }
    
    escapeId(value) {
        return mysql.escapeId(value);
    }
}

class Database {
    
    constructor(options) {
        Object.defineProperties(this, {
            _pool: {value: mysql.createPool(options)},
            _functions: {value: options.functions},
            _processRow: {value: options.processRow},
        });
        for (let key in options.functions) {
            if (!this[key]) {
                Object.defineProperty(this, key, { 
                    value: function () {
                        return this.connection((connection) => connection[key].apply(connection, arguments));
                    }
                });
            }
        }
    }
    
    connection(fn) {
        return co(function*() {
            let _connection = yield new Promise((resolve, reject) => {
                this._pool.getConnection((error, connection) => {
                    if (error) return reject(error);
                    resolve(connection);
                });
            });
            try {
                return yield fn(new Connection(_connection, {functions: this._functions, processRow: this._processRow}));
            } catch (error) {
                throw error;
            } finally {
                _connection.release();
            }
        }.bind(this));
    }
    
    query(sql, options) {
        return this.connection((connection) => connection.query(sql, options));
    }
    
    transaction(fn) {
        return this.connection(co.wrap(function*(connection) {
            try {
                yield connection.query("START TRANSACTION");
                let result = yield fn(connection);
                yield connection.query("COMMIT");
                return result;
            } catch (error) {
                yield connection.query("ROLLBACK");
                throw error;
            }
        }.bind(this)));
    }
    
    escape(value) {
        return mysql.escape(value);
    }
    
    escapeId(value) {
        return mysql.escapeId(value);
    }
    
    static escape(value) {
        return mysql.escape(value);
    }
    
    static escapeId(value) {
        return mysql.escapeId(value);
    }
}

module.exports = Database;
