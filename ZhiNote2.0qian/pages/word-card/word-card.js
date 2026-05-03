const app = getApp()

Page({
  data: {
    wordList: [],
    currentWord: null,
    currentIndex: 0,
    isFlipped: false,
    knownCount: 0,
    unknownCount: 0
  },

  onLoad() {
    this.loadWordList()
  },

  // 加载单词列表
  loadWordList() {
    const that = this
    // 从后端获取单词列表
    wx.request({
      url: `${app.globalData.baseUrl}/api/word-list`,
      method: 'GET',
      success: function(res) {
        if (res.data.code === 0) {
          that.setData({
            wordList: res.data.data,
            currentWord: res.data.data[0]
          })
        }
      },
      fail: function(res) {
        console.log('获取单词列表失败', res)
      }
    })
  },

  // 翻转卡片
  flipCard() {
    this.setData({
      isFlipped: !this.data.isFlipped
    })
  },

  // 标记不认识
  markUnknown() {
    const that = this
    const wordId = that.data.currentWord.id
    
    // 调用后端API标记单词
    wx.request({
      url: `${app.globalData.baseUrl}/api/mark-word`,
      method: 'POST',
      data: {
        wordId: wordId,
        status: 'unknown'
      },
      success: function(res) {
        if (res.data.code === 0) {
          that.setData({
            unknownCount: that.data.unknownCount + 1
          })
          that.nextWord()
        }
      },
      fail: function(res) {
        console.log('标记单词失败', res)
      }
    })
  },

  // 标记认识
  markKnown() {
    const that = this
    const wordId = that.data.currentWord.id
    
    // 调用后端API标记单词
    wx.request({
      url: `${app.globalData.baseUrl}/api/mark-word`,
      method: 'POST',
      data: {
        wordId: wordId,
        status: 'known'
      },
      success: function(res) {
        if (res.data.code === 0) {
          that.setData({
            knownCount: that.data.knownCount + 1
          })
          that.nextWord()
        }
      },
      fail: function(res) {
        console.log('标记单词失败', res)
      }
    })
  },

  // 下一个单词
  nextWord() {
    const nextIndex = this.data.currentIndex + 1
    if (nextIndex < this.data.wordList.length) {
      this.setData({
        currentIndex: nextIndex,
        currentWord: this.data.wordList[nextIndex],
        isFlipped: false
      })
    } else {
      wx.showToast({
        title: '单词学习完成！',
        icon: 'success'
      })
    }
  }
})