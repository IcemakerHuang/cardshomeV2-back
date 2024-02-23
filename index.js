// index.js 是後端的進入點，這裡會導入所有的模組，並啟動伺服器。
// #region 流程:
// 1.伺服器收到一個 HTTP 請求（例如來自前端的使用者註冊資料）-> 給 index.js 中定義的中間件(例如 cors)和路由處理。
// 2.這個請求會被傳遞到相應的路由處理器，例如 routeUsers。在這個路由處理器中，你可能會使用 passport.js 來進行身份驗證或資料驗證。
// #endregion
import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import routeUsers from './routes/users.js'
import routeProducts from './routes/products.js' // 引入處理商品相關的請求的對應處理路由
import routeArticles from './routes/articles.js'
import { StatusCodes } from 'http-status-codes'
import './passport/passport.js'

const app = express()

app.use(cors({
  // origin = 請求的來源
  // callback(錯誤, 是否允許)
  origin (origin, callback) {
    // 允許哪些來源 (postman) 向後端發請求
    if (origin === undefined || origin.includes('github.io') || origin.includes('localhost')) {
      callback(null, true)
    } else {
      callback(new Error('CORS'), false)
    }
  }
}))
app.use((_, req, res, next) => {
  res.status(StatusCodes.FORBIDDEN).json({
    success: false,
    message: '請求被拒絕'
  })
})

app.use(express.json())
app.use((_, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: '資料格式錯誤'
  })
})

app.use('/users', routeUsers)
app.use('/products', routeProducts) // 為了讓前端能夠訪問到這個路由，你需要在 index.js 中導入這個路由(import)並使用 app.use() 方法。
app.use('/articles', routeArticles) // 文章

// 所有的請求方式都不符合以上的路由時，就會執行這個路由
app.all('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '找不到'
  })
})

app.listen(process.env.PORT || 4000, async () => {
  console.log('伺服器啟動')
  await mongoose.connect(process.env.DB_URL)
  console.log('資料庫連線成功')
})
