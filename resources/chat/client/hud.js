import * as alt from 'alt-client';

let hudView = null;

// 创建HUD
function createHUD() {
    if (!hudView) {
        try {
            hudView = new alt.WebView('http://resource/client/html/hud.html', true);
            alt.log('HUD created successfully');
            
            hudView.focus();
            hudView.isVisible = true;

            alt.setTimeout(() => {
                updateMoney(0, 0);
            }, 100);

        } catch (error) {
            alt.log('Error creating HUD:', error);
        }
    }
}

// 更新金钱显示
export function updateMoney(cash, bank) {
    if (hudView) {
        try {
            hudView.emit('updateMoney', cash, bank);
            alt.log(`Money updated: cash=${cash}, bank=${bank}`);
        } catch (error) {
            alt.log('Error updating money:', error);
        }
    }
}

// 初始化
alt.on('connectionComplete', () => {
    alt.setTimeout(() => {
        createHUD();
    }, 1000);
});

// 监听服务器发来的金钱更新
alt.onServer('updateMoney', (cash, bank) => {
    alt.log('Received money update from server:', cash, bank);
    updateMoney(cash, bank);
});

// 资源停止时清理
alt.on('resourceStop', () => {
    if (hudView) {
        hudView.destroy();
        hudView = null;
    }
});

// 导出 HUD 视图
export function getHudView() {
    return hudView;
}

// 添加重新创建HUD的函数
export function recreateHUD() {
    if (hudView) {
        hudView.destroy();
        hudView = null;
    }
    createHUD();
}

// 监听玩家生成事件
alt.on('gameEntityCreate', (entity) => {
    if (entity instanceof alt.Player && entity === alt.Player.local) {
        recreateHUD();
    }
});
