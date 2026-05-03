Page({
  data: {
    expression: '',
    result: '0',
    currentNumber: '',
    operator: '',
    previousNumber: '',
    waitingForOperand: false
  },

  // 输入数字
  inputNumber(e) {
    const value = e.currentTarget.dataset.value
    let currentNumber = this.data.currentNumber
    
    if (this.data.waitingForOperand) {
      currentNumber = value
      this.setData({
        waitingForOperand: false
      })
    } else {
      currentNumber = currentNumber === '0' ? value : currentNumber + value
    }
    
    this.setData({
      currentNumber: currentNumber,
      expression: this.data.expression + value
    })
  },

  // 输入运算符
  inputOperator(e) {
    const operator = e.currentTarget.dataset.value
    const previousNumber = this.data.currentNumber
    
    if (previousNumber && this.data.operator && !this.data.waitingForOperand) {
      this.calculate()
    }
    
    this.setData({
      expression: this.data.expression + ' ' + operator + ' ',
      operator: operator,
      previousNumber: previousNumber,
      waitingForOperand: true
    })
  },

  // 计算结果
  calculate() {
    const previousNumber = parseFloat(this.data.previousNumber)
    const currentNumber = parseFloat(this.data.currentNumber)
    const operator = this.data.operator
    let result = 0
    
    switch (operator) {
      case '+':
        result = previousNumber + currentNumber
        break
      case '-':
        result = previousNumber - currentNumber
        break
      case '*':
        result = previousNumber * currentNumber
        break
      case '/':
        result = previousNumber / currentNumber
        break
      case '%':
        result = previousNumber % currentNumber
        break
      case '^':
        result = Math.pow(previousNumber, currentNumber)
        break
    }
    
    this.setData({
      result: this.formatNumber(result),
      currentNumber: this.formatNumber(result),
      expression: this.data.expression + ' = ' + this.formatNumber(result),
      operator: '',
      waitingForOperand: true
    })
  },

  // 科学函数
  inputScientific(e) {
    const func = e.currentTarget.dataset.value
    const currentNumber = parseFloat(this.data.currentNumber)
    let result = 0
    
    switch (func) {
      case 'sin':
        result = Math.sin(currentNumber)
        break
      case 'cos':
        result = Math.cos(currentNumber)
        break
      case 'tan':
        result = Math.tan(currentNumber)
        break
      case 'log':
        result = Math.log10(currentNumber)
        break
      case 'ln':
        result = Math.log(currentNumber)
        break
      case 'sqrt':
        result = Math.sqrt(currentNumber)
        break
      case 'π':
        result = Math.PI
        break
    }
    
    this.setData({
      result: this.formatNumber(result),
      currentNumber: this.formatNumber(result),
      expression: func + '(' + currentNumber + ') = ' + this.formatNumber(result)
    })
  },

  // 清除
  clear() {
    this.setData({
      expression: '',
      result: '0',
      currentNumber: '',
      operator: '',
      previousNumber: '',
      waitingForOperand: false
    })
  },

  // 删除
  delete() {
    let currentNumber = this.data.currentNumber
    if (currentNumber.length > 1) {
      currentNumber = currentNumber.slice(0, -1)
    } else {
      currentNumber = '0'
    }
    
    this.setData({
      currentNumber: currentNumber,
      expression: this.data.expression.slice(0, -1)
    })
  },

  // 切换正负号
  toggleSign() {
    let currentNumber = this.data.currentNumber
    if (currentNumber !== '0') {
      if (currentNumber.startsWith('-')) {
        currentNumber = currentNumber.slice(1)
      } else {
        currentNumber = '-' + currentNumber
      }
      
      this.setData({
        currentNumber: currentNumber
      })
    }
  },

  // 格式化数字
  formatNumber(num) {
    if (Number.isInteger(num)) {
      return num.toString()
    } else {
      return num.toFixed(8).replace(/\.?0+$/, '')
    }
  },

  // 等于
  equals() {
    if (this.data.operator && this.data.previousNumber) {
      this.calculate()
    }
  }
})