import { Schema, model } from 'mongoose'

const schema = new Schema({
  title: {
    type: String,
    required: [true, '缺少標題名稱']
  },
  author: {
    type: String,
    required: [true, '缺少作者名稱']
  },
  image: {
    type: [String],
    required: [true, '缺少認同卡圖片']
  },
  date: {
    type: Date,
    required: [true, '缺少文章日期']
  },
  description: {
    type: String,
    required: [true, '缺少文章內容']
  },
  category: {
    type: String,
    required: [true, '缺少文章分類'],
    enum: {
      values: ['地區回饋', '愛心公益', '學校認同', '市民卡', '公會組織'],
      message: '文章分類錯誤'
    }
  },
  sell: {
    type: Boolean,
    required: [true, '缺少文章上架狀態']
  }
}, {
  timestamps: true,
  versionKey: false
})

export default model('articles', schema)
