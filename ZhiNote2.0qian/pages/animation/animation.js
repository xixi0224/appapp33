Page({
  onReady() {
    this.drawBase()
  },

  drawBase() {
    const ctx = wx.createCanvasContext('stackCanvas', this)
    ctx.setFillStyle('#f5f7fa')
    ctx.fillRect(0, 0, 360, 420)
    ctx.setStrokeStyle('#1677ff')
    ctx.strokeRect(80, 60, 200, 260)
    ctx.setFillStyle('#1f1f1f')
    ctx.fillText('Stack', 160, 40)
    ctx.draw()
  },

  play() {
    const ctx = wx.createCanvasContext('stackCanvas', this)
    ctx.setFillStyle('#f5f7fa')
    ctx.fillRect(0, 0, 360, 420)
    ctx.setStrokeStyle('#1677ff')
    ctx.strokeRect(80, 60, 200, 260)
    ctx.setFillStyle('#1677ff')
    ctx.fillRect(110, 250, 140, 40)
    ctx.fillRect(110, 200, 140, 40)
    ctx.fillRect(110, 150, 140, 40)
    ctx.setFillStyle('#fff')
    ctx.fillText('A', 175, 177)
    ctx.fillText('B', 175, 227)
    ctx.fillText('C', 175, 277)
    ctx.draw()
  }
})