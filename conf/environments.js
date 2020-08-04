const environments = {
  development: {
      //이부분 로컬 디비에 맞게 전부 수정하세용~
      host: "localhost",
      port: "8001",
      mysql: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'ohg!0612',
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
  //AWS 버전
  production: {
    host: "13.124.33.232",
      port: "8001",
      mysql: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'autoin1020#',
        database: 'autoinspec',
        multipleStatements: true
      }
  }
}

//로컬 작업시 : development
//서버 작업시: production
const nodeEnv =  process.env.NODE_ENV || 'development';
exports.info = environments[nodeEnv].mysql;
