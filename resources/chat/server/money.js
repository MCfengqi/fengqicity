import * as alt from 'alt-server';

// 玩家金钱数据
const playerMoney = new Map();

// 初始化玩家金钱
export function initPlayerMoney(player) {
    try {
        playerMoney.set(player, {
            cash: 5000, // 初始现金
            bank: 10000 // 初始银行余额
        });

        alt.setTimeout(() => {
            updatePlayerMoney(player);
        }, 1000);

        alt.log(`Money initialized for player ${player.name}`);

        alt.emitClient(player, 'addMessage', '初始资金已设置', 'success');
    } catch (error) {
        alt.log('Error initializing money:', error);
    }
}

// 更新玩家金钱显示
export function updatePlayerMoney(player) {
    try {
        const money = playerMoney.get(player);
        if (money) {
            alt.emitClient(player, 'updateMoney', money.cash, money.bank);
            alt.log(`Money updated for player ${player.name}: cash=${money.cash}, bank=${money.bank}`);

            alt.emitClient(player, 'addMessage', `当前余额: 现金$${money.cash}, 银行$${money.bank}`, 'system');
        }
    } catch (error) {
        alt.log('Error updating player money:', error);
    }
}

// 添加现金
export function addCash(player, amount) {
    try {
        const money = playerMoney.get(player);
        if (money) {
            money.cash += amount;
            updatePlayerMoney(player);
            alt.log(`Added cash for player ${player.name}: ${amount}`);
            return true;
        }
        return false;
    } catch (error) {
        alt.log('Error adding cash:', error);
        return false;
    }
}

// 添加银行余额
export function addBank(player, amount) {
    try {
        const money = playerMoney.get(player);
        if (money) {
            money.bank += amount;
            updatePlayerMoney(player);
            alt.log(`Added bank money for player ${player.name}: ${amount}`);
            return true;
        }
        return false;
    } catch (error) {
        alt.log('Error adding bank money:', error);
        return false;
    }
}

// 清理断开连接的玩家数据
alt.on('playerDisconnect', (player) => {
    playerMoney.delete(player);
    alt.log(`Money data cleared for disconnected player ${player.name}`);
}); 