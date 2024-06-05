// auth.js 的主要用途：處理使用者的登入請求並進行身份驗證。
import passport from 'passport'
import { StatusCodes } from 'http-status-codes'
import jsonwebtoken from 'jsonwebtoken'

export const login = (req, res, next) => {
  // 3. 正常狀態下，使用來自 passport / passport.js 的 login 策略來驗證使用者的身份(user)。
  passport.authenticate('login', { session: false }, (error, user, info) => {
    if (!user || error) {
      // 複習:|| 是邏輯 OR 運算符，如果其左側或右側的值為 true，則整個表達式的結果為 true。
      // 因此，if (!user || error) 的意思是：如果 user 是假值，或者 error 是真值，則執行接下來的程式碼塊。
      // 舉例: user 是假值（例如 null、undefined、NaN、0、空字串或 false）。error 是真值（即 error 存在且不是假值）。
      if (info.message === 'Missing credentials') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '欄位錯誤'
        })
        return
      } else if (info.message === '未知錯誤') {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '未知錯誤'
        })
        return
      } else {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: info.message
        })
        return
      }
    }
    // 4. 上述如正常，將 user 放進 req 裡面 -> 進 controllers/users.js 的 login
    // 意味著在後續的路由處理器中，我們可以透過 req.user 來訪問到這個使用者物件。
    req.user = user
    next()
  })(req, res, next)
}

export const jwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, data, info) => {
    if (error || !data) {
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        // JWT 格式不對、SECRET 不對
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'JWT 無效'
        })
      } else if (info.message === '未知錯誤') {
        console.log('jwt未知錯誤')
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'jwt未知錯誤'
        })
      } else {
        // 其他錯誤
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: info.message
        })
      }
      return
    }
    req.user = data.user
    req.token = data.token
    next()
  })(req, res, next)
}
