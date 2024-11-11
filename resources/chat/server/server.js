import * as alt from 'alt-server';
import { initPlayerMoney } from './money.js';
import vehicleHandler from './vehicleHandler.js';
import spawnHandler from './spawnHandler.js';

let loadedResources = new Set();
const totalResources = ['chat', 'freeroam'];
const SERVER_VERSION = 'V0.0.1开发版';
const SERVER_NAME = '风启市';

// 玩家连接事件
alt.on('playerConnect', (player) => {
    alt.log(`[连接] 玩家 ${player.name} 已连接到服务器`);
    
    // 设置默认角色模型和外观
    player.model = 'mp_m_freemode_01';
    player.setClothes(0, 0, 0, 0);
    player.setClothes(2, 0, 0, 0);
    player.setClothes(3, 0, 0, 0);
    player.setClothes(4, 0, 0, 0);
    player.setClothes(6, 0, 0, 0);
    
    // 设置出生点
    spawnHandler.spawnPlayer(player);
    
    // 初始化玩家金钱
    initPlayerMoney(player);
    
    // 发送欢迎消息
    alt.emitClient(player, 'addMessage', '===============', 'system');
    alt.emitClient(player, 'addMessage', `欢迎来到${SERVER_NAME}！`, 'system');
    alt.emitClient(player, 'addMessage', `服务器版本: ${SERVER_VERSION}`, 'system');
    alt.emitClient(player, 'addMessage', `服务器端口: ${alt.getServerConfig().port}`, 'system');
    alt.emitClient(player, 'addMessage', `在线人数: ${alt.Player.all.length}/${alt.getServerConfig().players}`, 'system');
    alt.emitClient(player, 'addMessage', `游戏模式: ${alt.getServerConfig().gamemode}`, 'system');
    alt.emitClient(player, 'addMessage', '按 T 键开始聊天, 输入 /help 查看可用命令', 'system');
    alt.emitClient(player, 'addMessage', '================', 'system');
    
    alt.emitClient(player, 'playerLogin', player.name);
    alt.emitAllClients('addMessage', `${player.name} 加入了服务器`, 'system');
    alt.log(`[系统] ${player.name} 加入了服务器`);
});

// 玩家断开连接时清理
alt.on('playerDisconnect', (player) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    alt.log(`[${timeStr}][断开] 玩家 ${player.name} 断开连接`);
    alt.emitAllClients('addMessage', `${player.name} 离开了服务器`, 'system');
    alt.log(`[${timeStr}][系统] ${player.name} 离开了服务器`);
    
    // 清理玩家的车辆
    vehicleHandler.cleanupPlayerVehicles(player);
});