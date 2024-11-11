import * as alt from 'alt-server';
import { getVehicleCategories, isValidVehicle } from './vehicles.js';
import { addCash, addBank } from './money.js';
import { send, broadcast } from './index.js';
import vehicleHandler from './vehicleHandler.js';

// 存储玩家的标记点
const playerMarkers = new Map();

// 统一的命令处理器
class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.initializeCommands();
    }

    // 注册命令
    registerCommand(name, handler, description = '') {
        this.commands.set(name.toLowerCase(), {
            handler,
            description
        });
        alt.log(`[命令] 注册命令: ${name}`);
    }

    // 处理命令
    handleCommand(player, message) {
        if (!message.startsWith('/')) return false;

        const args = message.slice(1).split(' ');
        const cmd = args.shift().toLowerCase();

        const command = this.commands.get(cmd);
        if (command) {
            try {
                alt.log(`[命令] 玩家 ${player.name} 执行命令: ${message}`);
                command.handler(player, args);
                return true;
            } catch (error) {
                alt.log(`[错误] 执行命令失败: ${error}`);
                alt.emitClient(player, 'addMessage', '命令执行失败', 'error');
            }
        }
        return false;
    }

    // 获取命令列表
    getCommandList() {
        const list = [];
        this.commands.forEach((value, key) => {
            list.push({
                name: key,
                description: value.description
            });
        });
        return list;
    }

    // 初始化所有命令
    initializeCommands() {
        // 帮助命令
        this.registerCommand('help', (player) => {
            send(player, "{ff0000}========== {eb4034}HELP {ff0000} ==========");
            send(player, "{ff0000}= {34abeb}/car {40eb34}(model)   {ffffff} Spawn a Vehicle");
            send(player, "{ff0000}= {34abeb}/tp {40eb34}(targetPlayer)   {ffffff} Teleport to Player");
            send(player, "{ff0000}= {34abeb}/model {40eb34}(modelName)   {ffffff} Change Player Model");
            send(player, "{ff0000}= {34abeb}/weapon {40eb34}(weaponName)   {ffffff} Get specified weapon");
            send(player, "{ff0000}= {34abeb}/weapons    {ffffff} Get all weapons");
            send(player, "{ff0000} ========================");
        }, '显示帮助信息');

        // 车辆命令
        this.registerCommand('car', (player, args) => {
            if (args.length === 0) {
                alt.emitClient(player, 'addMessage', '用法: /car [车辆名称]', 'info');
                return;
            }
            const vehicleName = args[0].toLowerCase();
            if (!isValidVehicle(vehicleName)) {
                alt.emitClient(player, 'addMessage', `❌ 无效的车辆名称: ${vehicleName}`, 'error');
                return;
            }
            vehicleHandler.spawnVehicle(player, vehicleName);
        }, '生成一辆车');

        this.registerCommand('veh', (player, args) => {
            if (args.length === 0) {
                alt.emitClient(player, 'addMessage', '用法: /veh [车辆名称]', 'info');
                return;
            }
            const vehicleName = args[0].toLowerCase();
            if (!isValidVehicle(vehicleName)) {
                alt.emitClient(player, 'addMessage', `❌ 无效的车辆名称: ${vehicleName}`, 'error');
                return;
            }
            vehicleHandler.spawnVehicle(player, vehicleName);
        }, '生成一辆车（car的别名）');

        this.registerCommand('dv', (player) => {
            vehicleHandler.deleteVehicle(player);
        }, '删除当前或最近的车辆');

        // 传送命令
        this.registerCommand('tp', (player, args) => {
            if (!args || args.length === 0) {
                send(player, "Usage: /tp (target player)");
                return;
            }
            const foundPlayers = alt.Player.all.filter((p) => p.name === args[0]);
            if (foundPlayers && foundPlayers.length > 0) {
                player.pos = foundPlayers[0].pos;
                send(player, `You got teleported to {1cacd4}${foundPlayers[0].name}{ffffff}`);
            } else {
                send(player, `{ff0000} Player {ff9500}${args[0]} {ff0000}not found..`);
            }
        }, '传送到其他玩家位置');

        // 模型命令
        this.registerCommand('model', (player, args) => {
            if (args.length === 0) {
                send(player, "Usage: /model (modelName)");
                return;
            }
            player.model = args[0];
        }, '更改玩家模型');

        // 武器命令
        this.registerCommand('weapon', (player, args) => {
            if (args.length === 0) {
                send(player, "Usage: /weapon (modelName)");
                return;
            }
            player.giveWeapon(alt.hash("weapon_" + args[0]), 500, true);
        }, '获取指定武器');

        this.registerCommand('weapons', (player) => {
            const weapons = [
                "dagger", "bat", "bottle", "crowbar", "flashlight", "golfclub", "hammer",
                "hatchet", "knuckle", "knife", "machete", "switchblade", "nightstick",
                // ... 其他武器 ...
            ];
            for (let weapon of weapons) {
                player.giveWeapon(alt.hash("weapon_" + weapon), 500, true);
            }
        }, '获取所有武器');

        // 位置命令
        this.registerCommand('pos', (player) => {
            const pos = player.pos;
            alt.log(`Position: ${pos.x}, ${pos.y}, ${pos.z}`);
            send(player, `Position: ${pos.x}, ${pos.y}, ${pos.z}`);
        }, '显示当前位置');

        // 可以继续添加其他命令 ...
    }

    // 删除车辆的具体实现
    deleteVehicle(player) {
        // ... 删除车辆的代码 ...
    }

    // 其他命令处理方法...
}

// 创建单例实例
const commandHandler = new CommandHandler();
export default commandHandler; 