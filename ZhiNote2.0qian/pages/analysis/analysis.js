import { setDarkMode, checkDarkMode } from '../../utils/theme'
// 导入ECharts库
const echarts = require('../ec-canvas/echarts')

Page({
  data: {
    // 文件信息
    fileInfo: null,
    showAsrContent: false,
    transcript: [],
    showTagMenu: false,
    selectedSegmentIndex: -1,
    // 课堂总结相关
    isAnalyzing: false,
    showClassSummary: false,
    activeTab: 'outline',
    classSummary: {
      outline: [],
      chapterSummaries: [],
      keypoints: [],
      difficulties: []
    },
    // 摘要图相关
    showSummaryImage: false,
    summaryImageUrl: '',
    // 知识点提取相关
    isExtracting: false,
    showKnowledgeExtract: false,
    knowledgeList: [],
    filteredKnowledge: [],
    selectedKnowledgeIndex: -1,
    selectedKnowledge: null,
    chapters: [],
    selectedChapterIndex: 0,
    // 内容压缩相关
    isCompressing: false,
    showContentCompress: false,
    isComparing: false,
    compressedContent: {
      title: '',
      sections: []
    },
    originalContent: '',
    // 考点识别相关
    isExtractingExamPoints: false,
    showExamPoints: false,
    examPoints: [],
    expandedRowIndex: -1,
    tableScrollLeft: 0,
    // ECharts相关
    ec: {
      onInit: function(canvas, width, height) {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height
        });
        canvas.setChart(chart);
        return chart;
      }
    }
  },

  onLoad(options) {
    // 检查深色模式状态并更新样式
    const darkMode = checkDarkMode()
    setDarkMode(darkMode)
    
    // 接收文件导入页面传递的参数
    if (options.file && options.category) {
      this.setData({
        fileInfo: {
          name: options.file,
          category: options.category,
          source: options.source || '文件导入'
        }
      })
      
      // 如果是音频类型，自动显示语音转文字内容
      if (options.category === 'audio') {
        this.loadTranscript()
      }
      
      // 显示提示信息
      wx.showToast({
        title: `您的《${decodeURIComponent(options.file)}》已就绪，AI已就绪为您分析。`,
        icon: 'none',
        duration: 3000
      })
    } else if (options.noteId && options.title) {
      // 接收文本输入页面传递的参数
      this.setData({
        fileInfo: {
          id: options.noteId,
          name: decodeURIComponent(options.title),
          category: 'text',
          source: options.source || '文本输入'
        }
      })
      
      // 显示提示信息
      wx.showToast({
        title: `您的《${decodeURIComponent(options.title)}》已就绪，AI已就绪为您分析。`,
        icon: 'none',
        duration: 3000
      })
    } else {
      // 从本地存储中读取参数（用于从text-input页面跳转）
      const noteId = wx.getStorageSync('analysisNoteId')
      const noteTitle = wx.getStorageSync('analysisNoteTitle')
      const noteSource = wx.getStorageSync('analysisNoteSource')
      const voiceTranscript = wx.getStorageSync('analysisTranscript')
      const voiceAudioId = wx.getStorageSync('voiceAudioId')
      
      if (noteId && noteTitle) {
        console.log('从本地存储读取参数:', noteId, noteTitle)
        this.setData({
          fileInfo: {
            id: noteId,
            name: noteTitle,
            category: 'text',
            source: noteSource || '文本输入'
          }
        })
        
        // 显示提示信息
        wx.showToast({
          title: `您的《${noteTitle}》已就绪，AI已就绪为您分析。`,
          icon: 'none',
          duration: 3000
        })
        
        // 清除本地存储的参数
        wx.removeStorageSync('analysisNoteId')
        wx.removeStorageSync('analysisNoteTitle')
        wx.removeStorageSync('analysisNoteSource')
      } else if (voiceTranscript && noteTitle) {
        // 处理从语音录入页面传来的转写结果
        console.log('从语音录入读取转写结果:', voiceTranscript)
        this.setData({
          fileInfo: {
            id: voiceAudioId || 1,
            name: noteTitle || '语音录入',
            category: 'audio',
            source: noteSource || '语音转文字'
          },
          transcript: voiceTranscript,
          showAsrContent: true
        })
        
        // 显示提示信息
        wx.showToast({
          title: `您的《${noteTitle}》已就绪，AI已就绪为您分析。`,
          icon: 'none',
          duration: 3000
        })
        
        // 清除本地存储的参数
        wx.removeStorageSync('analysisNoteTitle')
        wx.removeStorageSync('analysisNoteSource')
        wx.removeStorageSync('analysisTranscript')
        wx.removeStorageSync('voiceAudioId')
      } else {
        // 从本地存储中读取参数（用于从file-import页面跳转）
        const file = wx.getStorageSync('analysisFile')
        const category = wx.getStorageSync('analysisCategory')
        const source = wx.getStorageSync('analysisSource')
        const fileId = wx.getStorageSync('analysisFileId')
        
        if (file && category) {
          console.log('从本地存储读取参数:', file, category, fileId)
          this.setData({
            fileInfo: {
              id: fileId || 4, // 默认使用4作为fileId
              name: file,
              category: category,
              source: source || '文件导入'
            }
          })
          
          // 显示提示信息
          wx.showToast({
            title: `您的《${file}》已就绪，AI已就绪为您分析。`,
            icon: 'none',
            duration: 3000
          })
          
          // 清除本地存储的参数
          wx.removeStorageSync('analysisFile')
          wx.removeStorageSync('analysisCategory')
          wx.removeStorageSync('analysisSource')
          wx.removeStorageSync('analysisFileId')
        }
      }
    }
  },

  // 语音转文字
  goAsr() {
    const { fileInfo } = this.data
    
    if (!fileInfo) {
      wx.showToast({
        title: '请先选择或导入文件',
        icon: 'none'
      })
      return
    }
    
    if (fileInfo.category === 'audio') {
      // 如果是音频类型，显示转写内容
      this.setData({
        showAsrContent: true
      })
    } else {
      // 如果不是音频类型，调用后端API进行语音转文字
      wx.showLoading({
        title: '转换中...'
      })
      
      wx.request({
        url: `${getApp().globalData.baseUrl}/api/asr/convert`,
        method: 'POST',
        data: {
          fileId: fileInfo.id
        },
        success: (res) => {
          wx.hideLoading()
          if (res.data.code === 0) {
            this.setData({
              transcript: res.data.data.transcript,
              showAsrContent: true
            })
          } else {
            wx.showToast({
              title: '转换失败，请重试',
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
    }
  },

  // 隐藏语音转文字内容
  hideAsrContent() {
    this.setData({
      showAsrContent: false
    })
  },

  // 加载转写内容
  loadTranscript() {
    const { fileInfo } = this.data
    
    if (!fileInfo) {
      return
    }
    
    // 调用后端API获取转写内容
    wx.request({
      url: `${getApp().globalData.baseUrl}/api/asr/get-transcript`,
      method: 'GET',
      data: {
        fileId: fileInfo.id
      },
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({
            transcript: res.data.data.transcript,
            showAsrContent: true
          })
        }
      }
    })
  },

  // 选择分段
  selectSegment(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      selectedSegmentIndex: index
    })
  },

  // 显示标签菜单
  showTagMenu(e) {
    e.stopPropagation()
    const index = e.currentTarget.dataset.index
    this.setData({
      selectedSegmentIndex: index,
      showTagMenu: true
    })
  },

  // 隐藏标签菜单
  hideTagMenu() {
    this.setData({
      showTagMenu: false
    })
  },

  // 添加标签
  addTag(e) {
    const tag = e.currentTarget.dataset.tag
    const { transcript, selectedSegmentIndex } = this.data
    
    // 检查是否已经有该标签
    const segment = transcript[selectedSegmentIndex]
    if (!segment.tags) {
      segment.tags = []
    }
    
    if (!segment.tags.includes(tag)) {
      segment.tags.push(tag)
      segment.hasTags = true
      
      // 更新数据
      this.setData({
        transcript: transcript
      })
      
      // 保存标签到后端
      this.saveTags(selectedSegmentIndex, segment.tags)
    }
    
    this.hideTagMenu()
  },

  // 保存标签到后端
  saveTags(index, tags) {
    wx.request({
      url: `${getApp().globalData.baseUrl}/api/asr/save-tags`,
      method: 'POST',
      data: {
        segmentIndex: index,
        tags: tags
      },
      success: (res) => {
        if (res.data.code === 0) {
          console.log('标签保存成功')
        }
      }
    })
  },

  // 课堂总结
  goClassSummary() {
    const { fileInfo, showClassSummary } = this.data
    
    if (showClassSummary) {
      // 如果已经显示了总结，直接返回
      return
    }
    
    if (!fileInfo) {
      wx.showToast({
        title: '请先选择或导入文件',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      isAnalyzing: true
    })

    wx.request({
      url: `${getApp().globalData.baseUrl}/api/ai/class-summary`,
      method: 'POST',
      data: {
        fileId: fileInfo.id
      },
      success: (res) => {
        this.setData({
          isAnalyzing: false
        })

        if (res.data.code === 0) {
          this.setData({
            showClassSummary: true,
            classSummary: res.data.data
          })
        } else {
          wx.showToast({
            title: res.data?.detail || '分析失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: () => {
        this.setData({
          isAnalyzing: false
        })

        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab
    })
  },

  // 生成摘要图
  generateSummaryImage() {
    wx.showLoading({
      title: '生成摘要图中...'
    })
    
    console.log('classSummary数据:', this.data.classSummary)
    
    // 调用后端API生成摘要图
    wx.request({
      url: `${getApp().globalData.baseUrl}/api/ai/generate-summary-image`,
      method: 'POST',
      data: {
        classSummary: this.data.classSummary
      },
      success: (res) => {
        wx.hideLoading()
        
        console.log('生成摘要图响应:', res)
        
        if (res.data.code === 0) {
          // 显示生成的摘要图
          this.setData({
            showSummaryImage: true,
            summaryImageUrl: res.data.data.imageUrl
          })
        } else {
          wx.showToast({
            title: '生成失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.log('生成摘要图失败:', err)
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      }
    })
  },
  
  // 保存摘要图到相册
  saveSummaryImage() {
    const { summaryImageUrl } = this.data
    
    // 检查是否有摘要图
    if (!summaryImageUrl) {
      wx.showToast({
        title: '请先生成摘要图',
        icon: 'none'
      })
      return
    }
    
    // 保存到相册
    wx.downloadFile({
      url: summaryImageUrl,
      success: (downloadRes) => {
        if (downloadRes.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: downloadRes.tempFilePath,
            success: () => {
              wx.showToast({
                title: '摘要图已保存到相册',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.log('保存失败:', err)
              // 检查是否是权限问题
              if (err.errMsg.includes('auth deny')) {
                wx.showToast({
                  title: '请在设置中开启相册权限',
                  icon: 'none'
                })
              } else {
                wx.showToast({
                  title: '保存失败，请重试',
                  icon: 'none'
                })
              }
            }
          })
        } else {
          wx.showToast({
            title: '下载图片失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.log('下载失败:', err)
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      }
    })
  },
  
  // 分享摘要图给朋友
  shareSummaryImage() {
    const { summaryImageUrl, fileInfo } = this.data
    
    // 检查是否有摘要图
    if (!summaryImageUrl) {
      wx.showToast({
        title: '请先生成摘要图',
        icon: 'none'
      })
      return
    }
    
    // 显示分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    // 模拟分享操作，实际分享需要用户手动触发
    wx.showActionSheet({
      itemList: ['分享给微信好友', '分享到朋友圈'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 分享给微信好友
          console.log('分享给微信好友')
        } else if (res.tapIndex === 1) {
          // 分享到朋友圈
          console.log('分享到朋友圈')
        }
      },
      fail: (res) => {
        console.log('分享操作取消')
      }
    })
  },
  
  // 页面分享配置
  onShareAppMessage() {
    const { summaryImageUrl, fileInfo } = this.data
    return {
      title: 'AI课堂总结',
      path: `/pages/analysis/analysis?file=${fileInfo?.name || ''}&category=${fileInfo?.category || ''}`,
      imageUrl: summaryImageUrl
    }
  },

  // 考点识别
  goExamPoints() {
    const { fileInfo, showExamPoints } = this.data
    
    if (showExamPoints) {
      return
    }
    
    if (!fileInfo) {
      wx.showToast({
        title: '请先选择或导入文件',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      isExtractingExamPoints: true
    })
    
    wx.request({
      url: `${getApp().globalData.baseUrl}/api/ai/extract-exam-points`,
      method: 'POST',
      data: {
        fileId: fileInfo.id || 1
      },
      success: (res) => {
        this.setData({
          isExtractingExamPoints: false
        })

        console.log('[考点识别] 后端返回:', res.data)

        if (res.data && res.data.code === 0) {
          const examPoints = res.data.data.examPoints || []
          console.log('[考点识别] 考点数组:', examPoints)
          if (examPoints.length > 0) {
            console.log('[考点识别] 第一条数据:', examPoints[0])
          }
          // 从本地存储恢复已掌握状态
          const masteredMap = wx.getStorageSync('examMasteredMap') || {}
          const fileKey = this.data.fileInfo ? String(this.data.fileInfo.id) : 'default'
          const fileMastered = masteredMap[fileKey] || {}
          const restoredExamPoints = examPoints.map(point => ({
            ...point,
            isMastered: !!fileMastered[point.name]
          }))
          this.setData({
            showExamPoints: true,
            examPoints: restoredExamPoints,
            expandedRowIndex: -1
          })
        } else {
          wx.showToast({
            title: res.data?.detail || '分析失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.log('考点识别失败:', err)
        this.setData({
          isExtractingExamPoints: false
        })
        
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      }
    })
  },
  
  // 切换行操作按钮展开/收起
  toggleRowActions(e) {
    const index = e.currentTarget.dataset.index
    const currentExpanded = this.data.expandedRowIndex
    const isExpanding = currentExpanded !== index
    this.setData({
      expandedRowIndex: isExpanding ? index : -1,
      tableScrollLeft: isExpanding ? 9999 : 0
    })
  },

  // 加入复习计划
  addToReviewPlan(e) {
    const index = e.currentTarget.dataset.index
    const point = this.data.examPoints[index]

    if (point.isMastered) {
      wx.showToast({
        title: '该考点已掌握，无需加入',
        icon: 'none'
      })
      this.setData({ expandedRowIndex: -1 })
      return
    }

    wx.request({
      url: `${getApp().globalData.baseUrl}/api/ai/add-to-review-plan`,
      method: 'POST',
      data: {
        examPoint: point
      },
      success: (res) => {
        if (res.data && res.data.code === 0) {
          const msg = res.data.data?.message || '已加入复习计划'
          wx.showToast({
            title: msg,
            icon: res.data.data?.success ? 'success' : 'none'
          })
          this.setData({ expandedRowIndex: -1 })
        } else {
          wx.showToast({
            title: res.data?.detail || '加入失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 标记为已掌握
  markAsMastered(e) {
    const index = e.currentTarget.dataset.index
    const examPoints = this.data.examPoints
    const point = examPoints[index]
    const wasMastered = point.isMastered
    point.isMastered = !point.isMastered

    // 保存到本地存储
    const masteredMap = wx.getStorageSync('examMasteredMap') || {}
    const fileKey = this.data.fileInfo ? String(this.data.fileInfo.id) : 'default'
    if (!masteredMap[fileKey]) {
      masteredMap[fileKey] = {}
    }
    if (point.isMastered) {
      masteredMap[fileKey][point.name] = true
    } else {
      delete masteredMap[fileKey][point.name]
    }
    wx.setStorageSync('examMasteredMap', masteredMap)

    this.setData({
      examPoints: examPoints,
      expandedRowIndex: -1
    })

    wx.showToast({
      title: point.isMastered ? '已标记为已掌握' : '已取消掌握',
      icon: 'success'
    })

    // 如果取消掌握（从未掌握变为...不，是已掌握变为未掌握），自动加入当日学习计划
    if (wasMastered && !point.isMastered) {
      console.log('[考点识别] 取消掌握，自动加入复习计划')
      this.addToReviewPlan({ currentTarget: { dataset: { index } } })
    }
  },

  // 内容压缩
  goContentCompress() {
    const { fileInfo, showContentCompress } = this.data
    
    if (showContentCompress) {
      // 如果已经显示了压缩结果，直接返回
      return
    }
    
    if (!fileInfo) {
      wx.showToast({
        title: '请先选择或导入文件',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      isCompressing: true
    })

    console.log('开始调用内容压缩API，fileId:', fileInfo.id || 1)
    wx.request({
      url: `${getApp().globalData.baseUrl}/api/ai/content-compress`,
      method: 'POST',
      data: {
        fileId: fileInfo.id || 1
      },
      success: (res) => {
        console.log('内容压缩响应:', res)

        if (res.data && res.data.code === 0) {
          let compressedContent = res.data.data && res.data.data.compressedContent
          console.log('压缩内容:', compressedContent)

          if (!compressedContent) {
            wx.showToast({
              title: '压缩结果为空',
              icon: 'none'
            })
            this.setData({
              isCompressing: false
            })
            return
          }

          if (!Array.isArray(compressedContent.sections)) {
            compressedContent.sections = [{
              title: '核心内容',
              points: ['正在生成压缩内容...']
            }]
          }

          compressedContent.sections.forEach(section => {
            if (!section.points || !Array.isArray(section.points)) {
              section.points = ['正在生成压缩内容...']
            }
          })

          this.setData({
            isCompressing: false,
            showContentCompress: true,
            compressedContent: compressedContent,
            originalContent: res.data.data && res.data.data.originalContent || '原文内容'
          })
        } else {
          console.log('压缩失败，错误信息:', res.data && res.data.detail)
          wx.showToast({
            title: res.data?.detail || '压缩失败，请重试',
            icon: 'none'
          })
          this.setData({
            isCompressing: false
          })
        }
      },
      fail: (err) => {
        console.log('内容压缩失败:', err)
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
        this.setData({
          isCompressing: false
        })
      }
    })
  },
  
  // 保存压缩版本
  saveCompressedVersion() {
    const { compressedContent } = this.data
    
    // 调用后端API保存压缩版本
    wx.request({
      url: `${getApp().globalData.baseUrl}/api/ai/save-compressed-version`,
      method: 'POST',
      data: {
        title: compressedContent.title,
        content: compressedContent
      },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      }
    })
  },
  
  // 对比原版
  compareWithOriginal() {
    this.setData({
      isComparing: true
    })
  },
  
  // 退出对比模式
  exitCompareMode() {
    this.setData({
      isComparing: false
    })
  },

  // 知识点提取
  goKnowledgeExtract() {
    const { fileInfo, showKnowledgeExtract } = this.data
    
    if (showKnowledgeExtract) {
      // 如果已经显示了提取结果，直接返回
      return
    }
    
    if (!fileInfo) {
      wx.showToast({
        title: '请先选择或导入文件',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      isExtracting: true
    })

    wx.request({
      url: `${getApp().globalData.baseUrl}/api/ai/extract-knowledge`,
      method: 'POST',
      data: {
        fileId: fileInfo.id
      },
      success: (res) => {
        this.setData({
          isExtracting: false
        })

        if (res.data.code === 0) {
          const data = res.data.data
          this.setData({
            showKnowledgeExtract: true,
            knowledgeList: data.knowledgeList,
            filteredKnowledge: data.knowledgeList,
            chapters: ['全部章节', ...data.chapters],
            selectedChapterIndex: 0
          })

          this.initKeywordCloud(data.keywords)
        } else {
          wx.showToast({
            title: res.data?.detail || '提取失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: () => {
        this.setData({
          isExtracting: false
        })

        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 初始化关键词云
  initKeywordCloud(keywords) {
    // 等待页面渲染完成后初始化ECharts
    setTimeout(() => {
      const ecCanvasComponent = this.selectComponent('#keywordCloud');
      if (ecCanvasComponent && ecCanvasComponent.chart) {
        const chart = ecCanvasComponent.chart;
        const option = {
          series: [{
            type: 'wordCloud',
            shape: 'circle',
            left: 'center',
            top: 'center',
            width: '100%',
            height: '100%',
            right: null,
            bottom: null,
            sizeRange: [12, 60],
            rotationRange: [-90, 90],
            rotationStep: 45,
            gridSize: 8,
            drawOutOfBound: false,
            textStyle: {
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              color: function () {
                return 'rgb(' + [
                  Math.round(Math.random() * 160),
                  Math.round(Math.random() * 160),
                  Math.round(Math.random() * 255)
                ].join(',') + ')';
              }
            },
            emphasis: {
              focus: 'self',
              textStyle: {
                shadowBlur: 10,
                shadowColor: '#333'
              }
            },
            data: keywords.map(item => ({
              name: item.word,
              value: item.weight
            }))
          }]
        };
        chart.setOption(option);
      }
    }, 100);
  },

  // 按章节筛选
  onChapterChange(e) {
    const index = e.detail.value
    const { knowledgeList } = this.data
    
    let filteredKnowledge = knowledgeList
    if (index > 0) {
      const chapter = this.data.chapters[index]
      filteredKnowledge = knowledgeList.filter(item => item.chapter === chapter)
    }
    
    this.setData({
      selectedChapterIndex: index,
      filteredKnowledge: filteredKnowledge,
      selectedKnowledgeIndex: -1,
      selectedKnowledge: null
    })
  },

  // 选择知识点
  selectKnowledge(e) {
    const index = e.currentTarget.dataset.index
    const knowledge = this.data.filteredKnowledge[index]
    
    this.setData({
      selectedKnowledgeIndex: index,
      selectedKnowledge: knowledge
    })
  },

  // 添加知识点到知识库
  addKnowledgeToLibrary(e) {
    e.stopPropagation() // 阻止事件冒泡
    const index = e.currentTarget.dataset.index
    const knowledge = this.data.filteredKnowledge[index]
    
    // 调用后端API添加到知识库
    wx.request({
      url: `${getApp().globalData.baseUrl}/api/library/add-knowledge`,
      method: 'POST',
      data: {
        knowledge: knowledge
      },
      success: (res) => {
        if (res.data.code === 0) {
          wx.showToast({
            title: '已添加到知识库',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '添加失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      }
    })
  }
})