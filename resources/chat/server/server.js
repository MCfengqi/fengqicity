import * as alt from 'alt-server';
import { initPlayerMoney } from './money.js';
import { handleCommand } from './commands.js';

let loadedResources = new Set();
const totalResources = ['chat', 'freeroam'];
const SERVER_VERSION = '1.0.0';
const SERVER_NAME = '风启市';

// 定义默认出生点
const DEFAULT_SPAWN = {
    x: 444.4747314453125,
    y: -983.88134765625,
    z: 30.6783447265625,
    heading: 0 // 朝向角度
};

// 玩家连接事件
alt.on('playerConnect', (player) => {
    alt.log(`[连接] 玩家 ${player.name} 已连接到服务器`);
    
    // 设置默认角色模型
    player.model = 'mp_m_freemode_01';
    
    // 设置默认外观
    player.setClothes(0, 0, 0, 0);
    player.setClothes(2, 0, 0, 0);
    player.setClothes(3, 0, 0, 0);
    player.setClothes(4, 0, 0, 0);
    player.setClothes(6, 0, 0, 0);
    
    // 设置出生点
    player.spawn(DEFAULT_SPAWN.x, DEFAULT_SPAWN.y, DEFAULT_SPAWN.z, 0);
    player.rot = { x: 0, y: 0, z: DEFAULT_SPAWN.heading };
    
    // 初始化玩家金钱
    initPlayerMoney(player);
    
    // 发送欢迎消息和服务器信息
    alt.emitClient(player, 'addMessage', '=================================', 'system');
    alt.emitClient(player, 'addMessage', `欢迎来到${SERVER_NAME}！`, 'system');
    alt.emitClient(player, 'addMessage', `服务器版本: ${SERVER_VERSION}`, 'system');
    alt.emitClient(player, 'addMessage', `服务器端口: ${alt.getServerConfig().port}`, 'system');
    alt.emitClient(player, 'addMessage', `在线人数: ${alt.Player.all.length}/${alt.getServerConfig().players}`, 'system');
    alt.emitClient(player, 'addMessage', `游戏模式: ${alt.getServerConfig().gamemode}`, 'system');
    alt.emitClient(player, 'addMessage', '按 T 键开始聊天, 输入 /help 查看可用命令', 'system');
    alt.emitClient(player, 'addMessage', '=================================', 'system');
    
    // 发送玩家登录事件
    alt.emitClient(player, 'playerLogin', player.name);

    // 广播玩家加入消息
    alt.emitAllClients('addMessage', `${player.name} 加入了服务器`, 'system');
    alt.log(`[系统] ${player.name} 加入了服务器`);
});

// 玩家死亡事件 - 在同一位置重生
alt.on('playerDeath', (player) => {
    alt.setTimeout(() => {
        player.spawn(DEFAULT_SPAWN.x, DEFAULT_SPAWN.y, DEFAULT_SPAWN.z, 0);
        player.rot = { x: 0, y: 0, z: DEFAULT_SPAWN.heading };
        player.health = 200;
        player.armour = 100;
    }, 3000); // 3秒后重生
});

// 修改聊天消息处理
alt.onClient('chatMessage', (player, message) => {
    if (!message || !message.trim()) return;

    // 获取当前时间
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    try {
        if (message.startsWith('/')) {
            // 命令消息
            alt.log(`[${timeStr}][命令] 玩家 ${player.name} 执行命令: ${message}`);
            const [cmd, ...args] = message.split(' ');
            alt.log(`[${timeStr}][命令] 解析结果 - 命令: ${cmd}, 参数:`, args);
            
            // 记录开始时间
            const startTime = Date.now();
            
            // 处理命令
            handleCommand(player, message);
            
            // 记录命令执行时间
            const executionTime = Date.now() - startTime;
            alt.log(`[${timeStr}][命令] 执行时间: ${executionTime}ms`);
        } else {
            // 普通聊天消息
            const formattedMessage = `${player.name}: ${message}`;
            alt.emitAllClients('addMessage', formattedMessage);
            
            // 记录到服务器日志
            alt.log(`[${timeStr}][聊天] ${formattedMessage}`);
            
            // 记录玩家位置
            const pos = player.pos;
            alt.log(`[${timeStr}][位置] 玩家 ${player.name} 的位置: X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}`);
        }
    } catch (error) {
        alt.log(`[${timeStr}][错误] 消息处理错误: ${error}`);
        alt.emitClient(player, 'addMessage', '消息发送失败', 'error');
    }
});

// 玩家断开连接时清理
alt.on('playerDisconnect', (player) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    alt.log(`[${timeStr}][断开] 玩家 ${player.name} 断开连接`);
    // 广播玩家离开消息
    alt.emitAllClients('addMessage', `${player.name} 离开了服务器`, 'system');
    alt.log(`[${timeStr}][系统] ${player.name} 离开了服务器`);
});