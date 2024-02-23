// 功能：處理商品資訊，包括新增、查詢、修改
import articles from '../models/articles.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator' // validator 是字符串驗證和清理（sanitization）庫，給getAll... 來驗證一個字符串是否是一個有效的 id、URL、手機號碼等。

export const create = async (req, res) => { // 用途：新增商品
  try {
    // req.body.image = req.file.path
    req.body.image = req.files.map(file => file.path)
    const result = await articles.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else {
      console.log('controllers未知錯誤')
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'create未知錯誤'
      })
    }
  }
}

export const getAll = async (req, res) => { // 管理員後台查商品getAll(無限制上下架)
  try {
    // req 物件代表 HTTP 請求，含有很多與請求相關的信息(ex:req.body...)，而 req.query 是一個從 URL 查詢解析出來的物件，包含了客戶端指定的查詢參數(例如查詢某個特定的資源、過濾某些資源等)。
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = parseInt(req.query.sortOrder) || -1
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 20
    const page = parseInt(req.query.page) || 1
    const regex = new RegExp(req.query.search || '', 'i')

    // 將上方參數都設定好，帶入下方查詢 -> 參數設好，進查詢步驟.find、.sort、.skip、.limit 來顯示結果
    const data = await articles
      .find({ // 1.查詢上方參數是否符合正則表達式
        $or: [ // MongoDB 查詢語法
          { name: regex },
          { description: regex }
        ]
      })
      // const text = 'a'
      // const obj = { [text]: 1 }
      // obj.a = 1
      .sort({ [sortBy]: sortOrder }) // 2.對結果做排序
      // .skip舉例：如果一頁 10 筆
      // 第 1 頁 = 0 ~ 10 = 跳過 0 筆 = (1 - 1) * 10
      // 第 2 頁 = 11 ~ 20 = 跳過 10 筆 = (2 - 1) * 10
      // 第 3 頁 = 21 ~ 30 = 跳過 20 筆 = (3 - 1) * 10
      .skip((page - 1) * itemsPerPage) // 3.跳過多少筆，因為要限制一頁幾筆
      .limit(itemsPerPage === -1 ? undefined : itemsPerPage)

    // estimatedDocumentCount() 計算總資料數
    const total = await articles.estimatedDocumentCount()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const get = async (req, res) => { // 前台顯示有上架的商品
  try {
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = parseInt(req.query.sortOrder) || -1
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 20
    const page = parseInt(req.query.page) || 1
    const regex = new RegExp(req.query.search || '', 'i')

    const data = await articles
      .find({
        sell: true, // 跟上方 getAll 不同的地方，只顯示有上架的
        $or: [
          { name: regex },
          { description: regex }
        ]
      })
      // const text = 'a'
      // const obj = { [text]: 1 }
      // obj.a = 1
      .sort({ [sortBy]: sortOrder })
      // 如果一頁 10 筆
      // 第 1 頁 = 0 ~ 10 = 跳過 0 筆 = (1 - 1) * 10
      // 第 2 頁 = 11 ~ 20 = 跳過 10 筆 = (2 - 1) * 10
      // 第 3 頁 = 21 ~ 30 = 跳過 20 筆 = (3 - 1) * 10
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage === -1 ? undefined : itemsPerPage) // 全部查詢

    // countDocuments() 依照 () 內篩選計算總資料數
    const total = await articles.countDocuments({ sell: true }) // 計算總共有幾個上架商品
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const getId = async (req, res) => { // 功能:查找單一商品
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID') // 使用validator 驗證 id 是否為有效的 mongoId

    const result = await articles.findById(req.params.id)

    if (!result) throw new Error('NOT FOUND')

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const edit = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // req.body.image = req.file?.path // ! 原本
    req.body.image = req.files.map(file => file.path)
    await articles.findByIdAndUpdate(req.params.id, req.body, { runValidators: true }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

// -!刪除
export const remove = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    await articles.findByIdAndDelete(req.params.id).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}
