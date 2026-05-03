import * as echarts from '../ec-canvas/echarts';
import { setDarkMode, checkDarkMode } from '../../utils/theme';

let heatChart = null;
let trendChart = null;
let radarChart = null;
let chapterChart = null;
let categoryChart = null;
let focusChart = null;
let wordCloudChart = null;

// 当前选中的分类
let selectedCategory = 'all';

// 存储后端返回的原始数据，供图表初始化后使用
let reportDataCache = null;

// 初始化考点热度分析图表
function initHeatChart(canvas, width, height, dpr) {
  heatChart = echarts.init(canvas, null, {
    width, height, devicePixelRatio: dpr
  });
  canvas.setChart(heatChart);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '出现次数'
    },
    yAxis: {
      type: 'category',
      data: [],
      axisLabel: { interval: 0 }
    },
    series: [{
      data: [],
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ])
      },
      label: {
        show: true,
        position: 'right',
        formatter: '{c}'
      }
    }]
  };
  
  heatChart.setOption(option);
  // 如果数据已缓存，立即更新
  if (reportDataCache && reportDataCache.heatData) {
    updateHeatChart(reportDataCache.heatData);
  }
  return heatChart;
}

function updateHeatChart(heatData) {
  if (!heatChart || !heatData || heatData.length === 0) return;
  const names = heatData.map(item => item.name);
  const values = heatData.map(item => item.value);
  heatChart.setOption({
    yAxis: { data: names },
    series: [{ data: values }]
  });
}

// 初始化学习趋势图表
function initTrendChart(canvas, width, height, dpr) {
  trendChart = echarts.init(canvas, null, {
    width, height, devicePixelRatio: dpr
  });
  canvas.setChart(trendChart);
  
  // 生成过去30天的日期标签
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}<br/>学习时长: ${params[0].value}分钟`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: { rotate: 45, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: '学习时长(分钟)'
    },
    series: [{
      data: Array(30).fill(0),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#667eea', width: 2 },
      itemStyle: { color: '#667eea' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
          { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
        ])
      }
    }]
  };
  
  trendChart.setOption(option);
  if (reportDataCache) {
    updateTrendChart(reportDataCache);
  }
  return trendChart;
}

function updateTrendChart(data) {
  if (!trendChart || !data) return;
  const dates = (data.trendDates || []).map(d => {
    const parts = d.split('-');
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  });
  trendChart.setOption({
    xAxis: { data: dates },
    series: [{ data: data.trendValues || [] }]
  });
}

// 初始化知识点掌握度雷达图
function initRadarChart(canvas, width, height, dpr) {
  radarChart = echarts.init(canvas, null, {
    width, height, devicePixelRatio: dpr
  });
  canvas.setChart(radarChart);
  
  const option = {
    tooltip: { trigger: 'item' },
    radar: {
      indicator: [{ name: '暂无数据', max: 100 }],
      radius: '70%'
    },
    series: [{
      name: '知识领域掌握度',
      type: 'radar',
      data: [{
        value: [0],
        name: '掌握度',
        areaStyle: { color: 'rgba(102, 126, 234, 0.2)' },
        lineStyle: { color: '#667eea' },
        itemStyle: { color: '#667eea' }
      }]
    }]
  };
  
  radarChart.setOption(option);
  if (reportDataCache) {
    updateRadarChart(reportDataCache);
  }
  return radarChart;
}

function updateRadarChart(data) {
  if (!radarChart || !data) return;
  const indicators = data.radarIndicators || [];
  const values = data.radarValues || [];
  if (indicators.length === 0) return;
  radarChart.setOption({
    radar: { indicator: indicators },
    series: [{ data: [{ value: values, name: '掌握度', areaStyle: { color: 'rgba(102, 126, 234, 0.2)' }, lineStyle: { color: '#667eea' }, itemStyle: { color: '#667eea' } }] }]
  });
}

// 初始化章节学习时间分布柱状图
function initChapterChart(canvas, width, height, dpr) {
  chapterChart = echarts.init(canvas, null, {
    width, height, devicePixelRatio: dpr
  });
  canvas.setChart(chapterChart);
  
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: { rotate: 45, fontSize: 10 }
    },
    yAxis: { type: 'value', name: '学习时间(分钟)' },
    series: [{
      data: [],
      type: 'bar',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ])
      }
    }]
  };
  
  chapterChart.setOption(option);
  if (reportDataCache) {
    updateChapterChart(reportDataCache);
  }
  return chapterChart;
}

function updateChapterChart(data) {
  if (!chapterChart || !data) return;
  chapterChart.setOption({
    xAxis: { data: data.chapterCategories || [] },
    series: [{ data: data.chapterValues || [] }]
  });
}

// 初始化笔记内容分类占比饼图
function initCategoryChart(canvas, width, height, dpr) {
  categoryChart = echarts.init(canvas, null, {
    width, height, devicePixelRatio: dpr
  });
  canvas.setChart(categoryChart);
  
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: []
    },
    series: [{
      name: '笔记分类',
      type: 'pie',
      radius: '60%',
      center: ['50%', '50%'],
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2
      }
    }]
  };
  
  categoryChart.setOption(option);
  categoryChart.on('click', function(params) {
    selectedCategory = params.name;
  });
  if (reportDataCache) {
    updateCategoryChart(reportDataCache);
  }
  return categoryChart;
}

function updateCategoryChart(data) {
  if (!categoryChart || !data) return;
  const catData = data.categoryData || [];
  categoryChart.setOption({
    legend: { data: catData.map(item => item.name) },
    series: [{ data: catData }]
  });
}

// 初始化每周平均专注度折线图
function initFocusChart(canvas, width, height, dpr) {
  focusChart = echarts.init(canvas, null, {
    width, height, devicePixelRatio: dpr
  });
  canvas.setChart(focusChart);
  
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: []
    },
    yAxis: {
      type: 'value',
      name: '专注度(%)',
      min: 0,
      max: 100
    },
    series: [{
      data: [],
      type: 'line',
      smooth: true,
      itemStyle: { color: '#52c41a' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
          { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
        ])
      }
    }]
  };
  
  focusChart.setOption(option);
  if (reportDataCache) {
    updateFocusChart(reportDataCache);
  }
  return focusChart;
}

function updateFocusChart(data) {
  if (!focusChart || !data) return;
  focusChart.setOption({
    xAxis: { data: data.focusWeeks || [] },
    series: [{ data: data.focusValues || [] }]
  });
}

// 初始化高频关键词云
function initWordCloudChart(canvas, width, height, dpr) {
  wordCloudChart = echarts.init(canvas, null, {
    width, height, devicePixelRatio: dpr
  });
  canvas.setChart(wordCloudChart);
  
  const option = {
    tooltip: {},
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '90%',
      height: '90%',
      right: null,
      bottom: null,
      sizeRange: [12, 60],
      rotationRange: [-45, 45],
      rotationStep: 45,
      gridSize: 8,
      drawOutOfBound: false,
      textStyle: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        color: function() {
          return 'rgb(' + [
            Math.round(Math.random() * 160),
            Math.round(Math.random() * 160),
            Math.round(Math.random() * 255)
          ].join(',') + ')';
        }
      },
      emphasis: {
        focus: 'self',
        textStyle: { shadowBlur: 10, shadowColor: '#333' }
      },
      data: []
    }]
  };
  
  wordCloudChart.setOption(option);
  if (reportDataCache) {
    updateWordCloudChart(reportDataCache);
  }
  return wordCloudChart;
}

function updateWordCloudChart(data) {
  if (!wordCloudChart || !data) return;
  const wcData = data.wordCloudData || [];
  if (wcData.length > 0) {
    wordCloudChart.setOption({
      series: [{ data: wcData }]
    });
  }
}

Page({
  data: {
    activeTab: 'curve',
    // 四大核心统计
    totalStudyHours: '0',
    totalNotes: 0,
    totalReviews: 0,
    masteryPercent: '0%',
    // 学习记录
    recordHours: '0',
    recordNotes: 0,
    recordReviews: 0,
    // 图表初始化选项
    heatChartOption: { onInit: initHeatChart },
    trendChartOption: { onInit: initTrendChart },
    radarChartOption: { onInit: initRadarChart },
    chapterChartOption: { onInit: initChapterChart },
    categoryChartOption: { onInit: initCategoryChart },
    focusChartOption: { onInit: initFocusChart },
    wordCloudChartOption: { onInit: initWordCloudChart },
    showSharePanel: false,
    pageData: {
      title: '学习报告',
      sharePath: '/pages/report/report'
    }
  },

  onLoad() {
    const darkMode = checkDarkMode()
    setDarkMode(darkMode)
    this.fetchReportData()
  },

  onShow() {
    this.fetchReportData()
  },

  // 获取学习报告数据
  fetchReportData() {
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/api/report/summary`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          const data = res.data.data
          // 缓存数据，供图表初始化后使用
          reportDataCache = data
          // 更新统计卡片
          this.setData({
            totalStudyHours: String(data.totalStudyHours),
            totalNotes: data.totalNotes,
            totalReviews: data.totalReviews,
            masteryPercent: data.masteryPercent + '%',
            recordHours: String(data.totalStudyHours),
            recordNotes: data.totalNotes,
            recordReviews: data.totalReviews
          })
          // 更新所有已初始化的图表
          this.updateAllCharts(data)
        }
      },
      fail: () => {
        wx.showToast({ title: '获取学习报告失败', icon: 'none' })
      }
    })
  },
  
  // 更新所有图表
  updateAllCharts(data) {
    updateHeatChart(data.heatData)
    updateTrendChart(data)
    updateRadarChart(data)
    updateChapterChart(data)
    updateCategoryChart(data)
    updateFocusChart(data)
    updateWordCloudChart(data)
  },
  
  // 切换图表标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    setTimeout(() => {
      if (tab === 'curve' && trendChart) trendChart.resize();
      if (tab === 'radar' && radarChart) radarChart.resize();
    }, 100);
  },
  
  // 显示分享面板
  showSharePanel() {
    this.setData({ showSharePanel: true })
  },
  
  // 关闭分享面板
  closeSharePanel() {
    this.setData({ showSharePanel: false })
  },

  // 跳转到时间线详情页
  goTimelineDetail(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/timeline/timeline?type=${type}`
    });
  },

  // 导出报告
  exportReport() {
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/api/report/export`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          const report = res.data.data.report
          const filename = res.data.data.filename
          // 保存到本地文件
          const fs = wx.getFileSystemManager()
          const filePath = `${wx.env.USER_DATA_PATH}/${filename}`
          fs.writeFile({
            filePath: filePath,
            data: report,
            encoding: 'utf8',
            success: () => {
              wx.shareFileMessage({
                filePath: filePath,
                fileName: filename,
                success: () => {},
                fail: () => {
                  wx.showToast({ title: '导出成功，请到聊天中查看', icon: 'none' })
                }
              })
            },
            fail: () => {
              // 降级：复制到剪贴板
              wx.setClipboardData({
                data: report,
                success: () => {
                  wx.showToast({ title: '报告已复制到剪贴板', icon: 'none' })
                }
              })
            }
          })
        }
      },
      fail: () => {
        wx.showToast({ title: '导出失败', icon: 'none' })
      }
    })
  },

  onReady() {
    setTimeout(() => {
      if (heatChart) heatChart.resize();
      if (trendChart) trendChart.resize();
      if (radarChart) radarChart.resize();
      if (chapterChart) chapterChart.resize();
      if (categoryChart) categoryChart.resize();
      if (focusChart) focusChart.resize();
      if (wordCloudChart) wordCloudChart.resize();
    }, 500);
  }
})