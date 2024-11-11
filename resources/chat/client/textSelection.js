import * as alt from 'alt-client';
import * as native from 'natives';

let chatVisible = false;

alt.on('keyup', (key) => {
    if (key === 84 && !chatVisible) { // 84 是 T 键的键码
        chatVisible = true;
        // 启用文字选择
        native.setMouseCursorActiveThisFrame();
        native.disableAllControlActions(0);
        native.enableControlAction(0, 1, true); // 鼠标移动
        native.enableControlAction(0, 2, true); // 鼠标点击
    }
});

alt.on('chat:closed', () => {
    chatVisible = false;
    // 禁用文字选择，恢复游戏控制
    native.enableAllControlActions(0);
}); 