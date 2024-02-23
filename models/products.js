import { Schema, model } from 'mongoose'

const schema = new Schema({
  name: {
    type: String,
    required: [true, '缺少認同卡名稱']
  },
  price: {
    type: Number,
    required: [true, '缺少認同卡申請費用']
  },
  image: {
    type: String,
    required: [true, '缺少認同卡圖片']
  },
  description: {
    type: String,
    required: [true, '缺少認同卡說明']
  },
  category: {
    type: String,
    required: [true, '缺少認同卡分類'],
    enum: {
      values: ['地區回饋', '愛心公益', '學校認同', '市民卡', '公會組織'],
      message: '認同卡分類錯誤'
    }
  },
  sell: {
    type: Boolean,
    required: [true, '缺少認同卡上架狀態']
  }
}, {
  timestamps: true, // 出現建立日期和更新日期
  versionKey: false // 不會出現_V
})

export default model('products', schema)
