const environments = {
  development: {
      host: "localhost",
      port: "8001",
      mysql: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '1225',
        database: 'autoin',
        multipleStatements: true
      }
  },

  test: {
      host: "localhost",
      port: "4000",
      mysql: {
        username: 'admin',
        password: '1225',
        database: 'autoin',
        host: 'localhost',
        port: '3306'
      }
  },

  /*cafe24사용
  production: {
    host: "autoinspec.com",
      port: "8001",
      mysql: {
        host: '10.0.0.1',
        port: 3306,
        user: 'autoinspec',
        password: 'autoinspec1020',
        database: 'autoinspec',
        multipleStatements: true
      }
  }
  */

  //AWS 사용
    production: {
        host: "13.124.33.232",
        port: "8001",
        mysql: {
            host: 'localhost',
            port: 3306,
            user: 'autoinspec',
            password: 'autoinspec1020',
            database: 'autoinspec',
            multipleStatements: true
        }
    }
}

const nodeEnv =  process.env.NODE_ENV || 'production';
exports.info = environments[nodeEnv].mysql;
