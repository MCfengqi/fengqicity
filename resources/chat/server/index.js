import * as alt from 'alt-server';
import commandHandler from './commandHandler.js';

// 添加加载标记
let isInitialized = false;

// 初始化函数
function initialize() {
    if (isInitialized) {
        alt.log('[警告] 聊天系统已经初始化过了');
        return;
    }

    // 处理聊天消息
    alt.onClient('chatMessage', (player, message) => {
        if (!message || !message.trim()) return;

        const now = new Date();
        const timeStr = `${now.getFullYear()}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        try {
            if (message.startsWith('/')) {
                // 命令消息
                alt.log(`[${timeStr}][命令] 玩家 ${player.name} 执行命令: ${message}`);
                if (!commandHandler.handleCommand(player, message)) {
                    alt.emitClient(player, 'addMessage', '未知命令', 'error');
                }
            } else {
                // 普通聊天消息
                const formattedMessage = `${player.name}: ${message}`;
                alt.emitAllClients('addMessage', formattedMessage);
                alt.log(`[${timeStr}][聊天] ${formattedMessage}`);
            }
        } catch (error) {
            alt.log(`[${timeStr}][错误] 执行命令失败: ${error}`);
            alt.emitClient(player, 'addMessage', '命令执行失败', 'error');
        }
    });

    isInitialized = true;
    alt.log('[系统] 聊天系统初始化完成');
}

// 添加广播函数
export function broadcast(message) {
    alt.emitAllClients('chat:message', message);
}

// 添加发送消息给单个玩家的函数
export function send(player, message) {
    if(player && player.valid) {
        alt.emitClient(player, 'chat:message', message);
    }
}

// 初始化
initialize();
