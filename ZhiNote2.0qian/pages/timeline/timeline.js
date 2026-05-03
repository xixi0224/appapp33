import * as echarts from '../ec-canvas/echarts';
import { setDarkMode, checkDarkMode } from '../../utils/theme';

let heatmapChart = null;

// 初始化日历热力图
function initHeatmapChart(canvas, width, height, dpr) {
  heatmapChart = echarts.init(canvas, null, {
    width, height, devicePixelRatio: dpr
  });
  canvas.setChart(heatmapChart);
  
  const option = {
    title: {
      text: '学习热力图',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      position: 'top',
      formatter: function(params) {
        return `${params.data[0]}<br/>学习时长: ${params.data[2]}小时`;
      }
    },
    visualMap: {
      min: 0,
      max: 8,
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      bottom: '10%',
      pieces: [
        { min: 6, color: '#ff4d4f' },
        { min: 4, max: 6, color: '#fa8c16' },
        { min: 2, max: 4, color: '#faad14' },
        { min: 0.5, max: 2, color: '#52c41a' },
        { max: 0.5, color: '#e6f7ff' }
      ],
      show: true
    },
    calendar: {
      range: [new Date().getFullYear(), new Date().getFullYear() + 1],
      cellSize: ['auto', 13],
      top: 50,
      left: 30,
      right: 30,
      cellPadding: 3
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: [],  // 清空模拟数据，等待后端接入
      label: {
        show: false
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };
  
  heatmapChart.setOption(option);
  return heatmapChart;
}

Page({
  data: {
    title: '学习时间线',
    heatmapChartOption: {
      onInit: initHeatmapChart
    }
  },

  onLoad(options) {
    // 检查深色模式状态并更新样式
    const darkMode = checkDarkMode()
    setDarkMode(darkMode)
    
    // 获取类型参数
    const type = options.type || 'studyTime';
    
    // 根据类型设置标题
    let title = '学习时间线';
    switch (type) {
      case 'studyTime':
        title = '学习时长时间线';
        break;
      case 'noteCount':
        title = '笔记数量时间线';
        break;
      case 'reviewCount':
        title = '复习次数时间线';
        break;
    }
    
    this.setData({ title });
    
    // 获取时间线数据
    this.fetchTimelineData(type);
  },
  
  // 获取时间线数据
  fetchTimelineData(type) {
    // 这里应该调用后端API获取数据
    // 暂时为空，等待后端接入
  },
  
  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  onReady() {
    // 图表初始化完成后调用 resize 确保正确显示
    setTimeout(() => {
      if (heatmapChart) heatmapChart.resize();
    }, 500);
  }
})