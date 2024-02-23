// passport.js 主要是設定 Passport.js 的登入策略
// #region 導入用途說明:
// import passport from 'passport'：Passport.js 是一個用於 Node.js 的身份驗證中介軟體，提供了豐富的身份驗證策略，如 OAuth、OpenID 等。
// import passportLocal from 'passport-local'：Passport-Local 是 Passport.js 的一個策略，用於實現本地身份驗證（即使用使用者名稱和密碼的身份驗證）。
// import passportJWT from 'passport-jwt'：Passport-JWT 是 Passport.js 的一個策略，用於實現基於 JSON Web Token (JWT) 的身份驗證。
// import bcrypt from 'bcrypt'：bcrypt 是一個用於密碼雜湊的庫，常用於存儲用戶密碼。
// import users from '../models/users.js'：這是導入自定義模組 users，該模組可能是一個 Mongoose 模型，用於操作 MongoDB 數據庫中的 users 集合。
// #endregion
import passport from 'passport'
import passportLocal from 'passport-local'
import passportJWT from 'passport-jwt'
import bcrypt from 'bcrypt'
import users from '../models/users.js'

// passport.use 用途
// 建立一個passport.use的登入方式，並使用  passportLocal.Strategy() 的驗證策略
passport.use('login', new passportLocal.Strategy({
  usernameField: 'account',
  passwordField: 'password'
}, async (account, password, done) => {
  try {
    // 1.查到使用者帳號 user
    const user = await users.findOne({ account }) // 等待從數據庫中尋找使用者帳號的操作完成
    if (!user) {
      // #region 用途說明
      // 這裡檢查是否找到與輸入的帳號匹配的使用者，錯誤給'ACCOUNT'。
      // #endregion
      throw new Error('ACCOUNT')
    }
    if (!bcrypt.compareSync(password, user.password)) {
      // #region 用途說明
      // 如果找到了使用者，這裡會比較輸入的密碼和數據庫中存儲的密碼，錯誤給'PASSWORD'。
      // #endregion
      throw new Error('PASSWORD')
    }
    // 2.如果正常，傳出 user -> 進 middlewares / auth.js 的 login
    return done(null, user, null) // 如果沒有錯誤，則返回使用者資料
  } catch (error) { // 如果try有錯誤，則返回錯誤訊息
    if (error.message === 'ACCOUNT') {
      return done(null, null, { message: '帳號不存在' })
    } else if (error.message === 'PASSWORD') {
      return done(null, null, { message: '密碼錯誤' })
    } else {
      return done(null, null, { message: '未知錯誤' })
    }
  }
}))

passport.use('jwt', new passportJWT.Strategy({
  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true,
  ignoreExpiration: true // 略過過期檢查：因為某些路徑要允許過期的JWT，不然會出錯
}, async (req, payload, done) => {
  try {
    // 檢查過期
    // jwt 過期時間單位是秒，node.js 日期單位是毫秒，所以要乘以 1000
    const expired = payload.exp * 1000 < new Date().getTime()

    // 以下是驗證:
    /*
      如果請求網址是： http://localhost:4000/users/test?aaa=111&bbb=2
      以下是相關參數：
      req.originalUrl = /users/test?aaa=111&bbb=2
      req.baseUrl = /users
      req.path = /test
      req.query = { aaa: 111, bbb: 222 }
    */
    const url = req.baseUrl + req.path
    if (expired && url !== '/users/extend' && url !== '/users/logout') { // 讓這兩個 url 允許過期路徑
      throw new Error('EXPIRED') // 非兩個 url -> 顯示過期
    }

    // const token = req.headers.authorization.split(' ')
    const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    const user = await users.findOne({ _id: payload._id, tokens: token })
    if (!user) {
      throw new Error('JWT')
    }

    return done(null, { user, token }, null)
  } catch (error) {
    if (error.message === 'EXPIRED') {
      return done(null, null, { message: 'JWT 過期' })
    } else if (error.message === 'JWT') {
      return done(null, null, { message: 'JWT 無效' })
    } else {
      return done(null, null, { message: '未知錯誤' })
    }
  }
}))
