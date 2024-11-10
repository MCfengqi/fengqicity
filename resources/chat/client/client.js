import * as alt from 'alt-client';

alt.on('connectionComplete', () => {
    // 获取玩家名称并触发欢迎消息
    const playerName = alt.Player.local.name;
    const view = new alt.WebView('http://resource/client/html/index.html');
    view.emit('playerLogin', playerName);
}); 