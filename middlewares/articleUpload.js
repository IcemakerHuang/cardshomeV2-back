// multer 、 multer-storage-cloudinary  套件: 讓人可以上傳檔案 -> 因此新增 back/middlewares/upload.js （當中間件用）
import multer from 'multer' // 處理 multipart/form-data 套件
import { v2 as cloudinary } from 'cloudinary' // 雲端平台套件
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { StatusCodes } from 'http-status-codes' // 狀態碼套件

// 設定雲端平台，.env 要對齊 cloudinary.config 裡的設定
// 用途: 上傳圖片到雲端
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

const articleUpload = multer({
  storage: new CloudinaryStorage({ cloudinary }),
  fileFilter (req, file, callback) { // fileFilter 限制上傳的檔案類型（req: 請求的資訊, file: 檔案資訊, callback: 判斷是否允許檔案）
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) { // 只允許上傳 jpeg 和 png -> 用if判斷
      callback(null, true)
    } else {
      callback(new multer.MulterError('LIMIT_FILE_FORMAT'), false) // LIMIT_FILE_FORMAT 參數來自 multer ，用途: 限制檔案格式
    }
  },
  limits: {
    fileSize: 1024 * 1024, // 此為1 MB，限制檔案大小，不要太大容易用完流量
    files: 3
  }
})

export default (req, res, next) => {
  articleUpload.array('image', 3)(req, res, error => { // !修改: .array('image', 10) -> 傳10張圖片
    console.log('中間件articleUpload多圖片上傳')
    if (error instanceof multer.MulterError) {
      let message = '文章圖片上傳錯誤'
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = '文章圖片檔案太大'
      } else if (error.code === 'LIMIT_FILE_FORMAT') {
        message = '文章圖片檔案格式錯誤'
      }
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else if (error) {
      console.log(error)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '文章圖片_未知錯誤'
      })
    } else {
      next()
    }
  })
}
