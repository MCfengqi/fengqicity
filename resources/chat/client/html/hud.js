let cash = 0;
let bank = 0;

// 格式化金额
function formatMoney(amount) {
    return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// 更新显示
function updateDisplay() {
    document.getElementById('cash').textContent = formatMoney(cash);
    document.getElementById('bank').textContent = formatMoney(bank);
}

// 添加金额变化动画
function animateMoneyChange(elementId) {
    const element = document.getElementById(elementId);
    element.classList.add('money-change');
    setTimeout(() => {
        element.classList.remove('money-change');
    }, 300);
}

// 监听来自游戏的更新
if ('alt' in window) {
    alt.on('updateMoney', (newCash, newBank) => {
        if (newCash !== cash) {
            animateMoneyChange('cash');
        }
        if (newBank !== bank) {
            animateMoneyChange('bank');
        }
        cash = newCash;
        bank = newBank;
        updateDisplay();
    });
} 