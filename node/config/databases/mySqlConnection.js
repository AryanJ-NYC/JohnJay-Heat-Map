const config = require('../config'),
      mysql = require('mysql'),
      connectionPool = mysql.createPool({
        connectionLimit: 10,
        host: '149.4.68.217',
        user: config.DB_READ_USER,
        database: 'bpl_performance_lab',
        password: config.DB_PW
      });

exports.connectionPool = connectionPool;
exports.QUERY_LIMIT = 500;
