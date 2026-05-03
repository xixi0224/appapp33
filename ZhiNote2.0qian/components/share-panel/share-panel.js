Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },
  
  data: {
    isDarkMode: false
  },
  
  lifetimes: {
    attached() {
      // 检查深色模式状态
      const darkMode = wx.getStorageSync('darkMode')
      this.setData({
        isDarkMode: darkMode
      })
    }
  },
  
  methods: {
    // 关闭分享面板
    close() {
      this.triggerEvent('close')
    },
    
    // 导出PDF
    exportPdf() {
      wx.showLoading({
        title: '生成PDF中...'
      })
      
      // 调用后端API生成PDF
      wx.request({
        url: `${getApp().globalData.baseUrl}/api/export/pdf`,
        method: 'POST',
        data: {
          pageType: this.properties.pageType,
          pageData: this.properties.pageData
        },
        success: (res) => {
          wx.hideLoading()
          if (res.data.code === 0) {
            // 显示保存和分享选项
            wx.showActionSheet({
              itemList: ['保存到手机', '发送给朋友'],
              success: (res) => {
                if (res.tapIndex === 0) {
                  // 保存到手机
                  wx.downloadFile({
                    url: res.data.data.pdfUrl,
                    success: (downloadRes) => {
                      if (downloadRes.statusCode === 200) {
                        wx.saveFile({
                          tempFilePath: downloadRes.tempFilePath,
                          success: () => {
                            wx.showToast({
                              title: 'PDF已保存到手机',
                              icon: 'success'
                            })
                          }
                        })
                      }
                    }
                  })
                } else if (res.tapIndex === 1) {
                  // 发送给朋友
                  wx.shareAppMessage({
                    title: '分享PDF',
                    path: `/pages/notes/notes?pdfId=${res.data.data.pdfId}`,
                    imageUrl: res.data.data.coverUrl
                  })
                }
              }
            })
          } else {
            wx.showToast({
              title: 'PDF生成失败',
              icon: 'none'
            })
          }
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({
            title: '网络异常，请重试',
            icon: 'none'
          })
        }
      })
      
      this.close()
    },
    
    // 导出图谱截图
    exportChart() {
      wx.showLoading({
        title: '生成截图中...'
      })
      
      // 调用后端API生成图谱截图
      wx.request({
        url: `${getApp().globalData.baseUrl}/api/export/chart`,
        method: 'POST',
        data: {
          chartData: this.properties.chartData
        },
        success: (res) => {
          wx.hideLoading()
          if (res.data.code === 0) {
            // 保存图片到相册
            wx.downloadFile({
              url: res.data.data.imageUrl,
              success: (downloadRes) => {
                if (downloadRes.statusCode === 200) {
                  wx.saveImageToPhotosAlbum({
                    filePath: downloadRes.tempFilePath,
                    success: () => {
                      wx.showToast({
                        title: '截图已保存到相册',
                        icon: 'success'
                      })
                    },
                    fail: () => {
                      wx.showToast({
                        title: '保存失败，请重试',
                        icon: 'none'
                      })
                    }
                  })
                }
              }
            })
          } else {
            wx.showToast({
              title: '截图生成失败',
              icon: 'none'
            })
          }
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({
            title: '网络异常，请重试',
            icon: 'none'
          })
        }
      })
      
      this.close()
    },
    
    // 分享卡片
    shareCard() {
      wx.showLoading({
        title: '生成分享卡片中...'
      })
      
      // 调用后端API生成分享卡片
      wx.request({
        url: `${getApp().globalData.baseUrl}/api/export/card`,
        method: 'POST',
        data: {
          pageType: this.properties.pageType,
          pageData: this.properties.pageData
        },
        success: (res) => {
          wx.hideLoading()
          if (res.data.code === 0) {
            // 保存图片到相册并分享
            wx.downloadFile({
              url: res.data.data.cardUrl,
              success: (downloadRes) => {
                if (downloadRes.statusCode === 200) {
                  wx.saveImageToPhotosAlbum({
                    filePath: downloadRes.tempFilePath,
                    success: () => {
                      wx.showToast({
                        title: '分享卡片已保存到相册',
                        icon: 'success'
                      })
                      // 分享到微信
                      wx.shareAppMessage({
                        title: this.properties.pageData.title || '分享笔记',
                        path: this.properties.pageData.sharePath || '/pages/index/index',
                        imageUrl: res.data.data.cardUrl
                      })
                    },
                    fail: () => {
                      wx.showToast({
                        title: '保存失败，请重试',
                        icon: 'none'
                      })
                    }
                  })
                }
              }
            })
          } else {
            wx.showToast({
              title: '分享卡片生成失败',
              icon: 'none'
            })
          }
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({
            title: '网络异常，请重试',
            icon: 'none'
          })
        }
      })
      
      this.close()
    },
    
    // 生成小程序码
    generateQrCode() {
      wx.showLoading({
        title: '生成小程序码中...'
      })
      
      // 调用后端API生成小程序码
      wx.request({
        url: `${getApp().globalData.baseUrl}/api/export/qrcode`,
        method: 'POST',
        data: {
          path: this.properties.pageData.sharePath || '/pages/index/index',
          scene: this.properties.pageData.scene || ''
        },
        success: (res) => {
          wx.hideLoading()
          if (res.data.code === 0) {
            // 保存图片到相册
            wx.downloadFile({
              url: res.data.data.qrcodeUrl,
              success: (downloadRes) => {
                if (downloadRes.statusCode === 200) {
                  wx.saveImageToPhotosAlbum({
                    filePath: downloadRes.tempFilePath,
                    success: () => {
                      wx.showToast({
                        title: '小程序码已保存到相册',
                        icon: 'success'
                      })
                    },
                    fail: () => {
                      wx.showToast({
                        title: '保存失败，请重试',
                        icon: 'none'
                      })
                    }
                  })
                }
              }
            })
          } else {
            wx.showToast({
              title: '小程序码生成失败',
              icon: 'none'
            })
          }
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({
            title: '网络异常，请重试',
            icon: 'none'
          })
        }
      })
      
      this.close()
    }
  }
})