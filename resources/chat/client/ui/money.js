import * as alt from 'alt-client';

const cashElement = document.getElementById('cash');
const bankElement = document.getElementById('bank');

// 更新金钱显示
export function updateMoney(cash, bank) {
    cashElement.textContent = `现金: $${cash.toLocaleString()}`;
    bankElement.textContent = `银行: $${bank.toLocaleString()}`;
}

// 注册服务器事件
alt.onServer('updateMoney', updateMoney); 