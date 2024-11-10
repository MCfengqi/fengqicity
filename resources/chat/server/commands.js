import * as alt from 'alt-server';
import { addCash, addBank } from './money.js';
import { vehicles, isValidVehicle, getVehicleCategories } from './vehicles.js';

// 存储玩家的标记点
const playerMarkers = new Map();

// 处理命令
export function handleCommand(player, command) {
    try {
        if (command === '/' || command.trim().length <= 1) {
            alt.emitClient(player, 'addMessage', '请输入完整的命令，输入 /help 查看可用命令', 'error');
            return;
        }

        const [cmd, ...args] = command.split(' ');

        switch(cmd.toLowerCase()) {
            case '/female':
                setPlayerModel(player, 'mp_f_freemode_01', {
                    0: [0, 0, 0],
                    2: [0, 0, 0],
                    3: [14, 0, 0],
                    4: [14, 0, 0],
                    6: [1, 0, 0],
                    8: [15, 0, 0]
                });
                break;

            case '/male':
                setPlayerModel(player, 'mp_m_freemode_01', {
                    0: [0, 0, 0],
                    2: [0, 0, 0],
                    3: [0, 0, 0],
                    4: [0, 0, 0],
                    6: [1, 0, 0],
                    8: [15, 0, 0]
                });
                break;

            case '/car':
                spawnVehicle(player, args);
                break;

            case '/dv':
                deleteVehicle(player);
                break;

            case '/heal':
                player.health = 200;
                player.armour = 100;
                alt.emitClient(player, 'addMessage', '已恢复生命值和护甲', 'success');
                break;

            case '/kill':
                player.health = 0;
                alt.emitClient(player, 'addMessage', '你结束了自己的生命', 'system');
                break;

            case '/weather':
                setWeather(player, args);
                break;

            case '/tp':
                teleportToMarker(player);
                break;

            case '/fix':
                fixVehicle(player);
                break;

            case '/money':
                handleMoneyCommand(player, args);
                break;

            case '/pos':
                // 获取玩家位置和朝向
                const pos = player.pos;
                const rot = player.rot;
                // 格式化坐标信息
                const posStr = `位置: X: ${pos.x.toFixed(4)}, Y: ${pos.y.toFixed(4)}, Z: ${pos.z.toFixed(4)}`;
                const rotStr = `朝向: ${rot.z.toFixed(2)}°`;
                // 发送给玩家
                alt.emitClient(player, 'addMessage', posStr, 'info');
                alt.emitClient(player, 'addMessage', rotStr, 'info');
                // 记录到日志
                alt.log(`玩家 ${player.name} 的${posStr}`);
                alt.log(`玩家 ${player.name} 的${rotStr}`);
                break;

            default:
                alt.emitClient(player, 'addMessage', `未知命令: ${cmd}`, 'error');
                break;
        }
    } catch (error) {
        alt.log(`命令处理错误: ${error}`);
        alt.emitClient(player, 'addMessage', '命令执行失败', 'error');
    }
}

// 生成载具
function spawnVehicle(player, args) {
    alt.log(`[载具] 开始处理生成载具命令，参数:`, args);

    if (args.length === 0) {
        alt.emitClient(player, 'addMessage', '=== 可用车辆列表 ===', 'system');
        const categories = getVehicleCategories();
        for (const [category, vehicles] of Object.entries(categories)) {
            alt.emitClient(player, 'addMessage', `${category}:`, 'info');
            alt.emitClient(player, 'addMessage', vehicles, 'info');
        }
        alt.emitClient(player, 'addMessage', '用法: /car [车辆名称]', 'info');
        return;
    }

    const vehicleName = args[0].toLowerCase();
    alt.log(`[载具] 尝试生成载具: ${vehicleName}`);

    if (!isValidVehicle(vehicleName)) {
        alt.emitClient(player, 'addMessage', `❌ 无效的车辆名称: ${vehicleName}`, 'error');
        alt.emitClient(player, 'addMessage', '请使用 /car 查看可用车辆列表', 'info');
        return;
    }

    try {
        const pos = player.pos;
        const rot = player.rot;

        const spawnPos = {
            x: pos.x,
            y: pos.y + 2.0,
            z: pos.z
        };

        const vehicle = new alt.Vehicle(
            vehicleName,
            spawnPos.x,
            spawnPos.y,
            spawnPos.z,
            0,
            0,
            rot.z
        );

        if (!vehicle || !vehicle.valid) {
            alt.emitClient(player, 'addMessage', `❌ 生成载具失败: ${vehicleName}`, 'error');
            return;
        }

        vehicle.engineOn = true;
        vehicle.numberPlateText = "风启市";
        vehicle.primaryColor = Math.floor(Math.random() * 160);
        vehicle.secondaryColor = Math.floor(Math.random() * 160);
        vehicle.engineHealth = 1000;
        vehicle.repair();

        alt.emitClient(player, 'addMessage', `✅ 已生成载具: ${vehicleName}`, 'success');

        alt.setTimeout(() => {
            if (vehicle && vehicle.valid) {
                player.setIntoVehicle(vehicle, -1);
                alt.emitClient(player, 'addMessage', '已自动进入载具', 'info');
            }
        }, 100);

    } catch (error) {
        alt.log(`[载具] 生成载具错误: ${error}`);
        alt.emitClient(player, 'addMessage', '❌ 生成载具失败', 'error');
    }
}

// 删除载具
function deleteVehicle(player) {
    try {
        if (player.vehicle) {
            const vehicle = player.vehicle;
            player.vehicle = null;
            vehicle.destroy();
            alt.emitClient(player, 'addMessage', '已删除当前载具', 'success');
            return;
        }

        const nearestVehicle = getNearestVehicle(player.pos, 5);
        if (nearestVehicle && nearestVehicle.valid) {
            nearestVehicle.destroy();
            alt.emitClient(player, 'addMessage', '已删除最近的载具', 'success');
        } else {
            alt.emitClient(player, 'addMessage', '附近没有找到载具', 'error');
        }
    } catch (error) {
        alt.log(`删除载具错误: ${error}`);
        alt.emitClient(player, 'addMessage', '删除载具失败', 'error');
    }
}

// 设置天气
function setWeather(player, args) {
    if (args.length > 0) {
        const weather = parseInt(args[0]);
        if (!isNaN(weather) && weather >= 0 && weather <= 14) {
            alt.emitAllClients('setWeather', weather);
            alt.emitAllClients('addMessage', `天气已更改为: ${weather}`, 'success');
        } else {
            alt.emitClient(player, 'addMessage', '无效的天气ID (0-14)', 'error');
        }
    } else {
        alt.emitClient(player, 'addMessage', '用法: /weather [0-14]', 'error');
    }
}

// 传送到标记点
function teleportToMarker(player) {
    try {
        const markerPos = playerMarkers.get(player);
        if (markerPos) {
            player.pos = {
                x: markerPos.x,
                y: markerPos.y,
                z: markerPos.z + 1.0
            };
            alt.emitClient(player, 'addMessage', '已传送到标记点', 'success');
            playerMarkers.delete(player);
        } else {
            alt.emitClient(player, 'addMessage', '请先在地图上标记一个点', 'error');
        }
    } catch (error) {
        alt.log(`传送错误: ${error}`);
        alt.emitClient(player, 'addMessage', '传送失败', 'error');
    }
}

// 修复载具
function fixVehicle(player) {
    const veh = player.vehicle || getNearestVehicle(player.pos);
    if (veh && veh.valid) {
        veh.repair();
        alt.emitClient(player, 'addMessage', '载具已修复', 'success');
    } else {
        alt.emitClient(player, 'addMessage', '你不在载具中或附近没有载具', 'error');
    }
}

// 处理金钱命令
function handleMoneyCommand(player, args) {
    if (args.length >= 2) {
        const type = args[0].toLowerCase();
        const amount = parseInt(args[1]);

        if (isNaN(amount)) {
            alt.emitClient(player, 'addMessage', '请输入有效的金额', 'error');
            return;
        }

        if (type === 'cash') {
            addCash(player, amount);
            alt.emitClient(player, 'addMessage', `已添加现金: $${amount}`, 'success');
        } else if (type === 'bank') {
            addBank(player, amount);
            alt.emitClient(player, 'addMessage', `已添加银行余额: $${amount}`, 'success');
        } else {
            alt.emitClient(player, 'addMessage', '用法: /money [cash/bank] [金额]', 'error');
        }
    } else {
        alt.emitClient(player, 'addMessage', '用法: /money [cash/bank] [金额]', 'error');
    }
}

// 设置玩家模型和外观
function setPlayerModel(player, model, clothes) {
    try {
        player.model = model;

        alt.setTimeout(() => {
            for (const [component, [drawable, texture, palette]] of Object.entries(clothes)) {
                player.setClothes(parseInt(component), drawable, texture, palette);
            }

            const modelType = model.includes('female') ? '女性' : '男性';
            alt.emitClient(player, 'addMessage', `已切换为${modelType}角色`, 'success');
        }, 100);
    } catch (error) {
        alt.log(`设置玩家模型错误: ${error}`);
        alt.emitClient(player, 'addMessage', '切换角色失败', 'error');
    }
}

// 获取前方向量
function getForwardVector(heading) {
    const headingRad = heading * Math.PI / 180;
    return {
        x: Math.sin(-headingRad),
        y: Math.cos(-headingRad)
    };
}

// 获取最近的载具
function getNearestVehicle(pos, radius = 5) {
    let nearestVehicle = null;
    let minDistance = radius;

    alt.Vehicle.all.forEach(vehicle => {
        if (vehicle && vehicle.valid) {
            const distance = getDistance(pos, vehicle.pos);
            if (distance < minDistance) {
                minDistance = distance;
                nearestVehicle = vehicle;
            }
        }
    });

    return nearestVehicle;
}

// 计算距离
function getDistance(pos1, pos2) {
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) +
        Math.pow(pos1.y - pos2.y, 2) +
        Math.pow(pos1.z - pos2.z, 2)
    );
} 