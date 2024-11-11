import * as alt from 'alt-server';
import { isValidVehicle } from './vehicles.js';

class VehicleHandler {
    constructor() {
        this.vehicles = new Map(); // 存储所有玩家的车辆
    }

    // 生成载具
    spawnVehicle(player, vehicleName) {
        alt.log(`[载具] 玩家 ${player.name} 正在生成载具: ${vehicleName}`);

        try {
            // 获取玩家当前的车辆列表
            let playerVehicles = this.vehicles.get(player) || [];
            
            // 限制车辆数量
            if (playerVehicles.length >= 3) {
                let toDestroy = playerVehicles.pop();
                if (toDestroy && toDestroy.valid) {
                    toDestroy.destroy();
                }
            }

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

            // 添加到玩家的车辆列表
            playerVehicles.unshift(vehicle);
            this.vehicles.set(player, playerVehicles);
            player.setMeta("vehicles", playerVehicles);

            // 设置车辆属性
            this.setupVehicle(vehicle);

            alt.log(`[载具] 玩家 ${player.name} 成功生成载具: ${vehicleName}`);
            alt.emitClient(player, 'addMessage', `✅ 已生成载具: ${vehicleName}`, 'success');

            // 让玩家进入车辆
            alt.setTimeout(() => {
                if (vehicle && vehicle.valid) {
                    player.setIntoVehicle(vehicle, 0);
                    alt.emitClient(player, 'addMessage', '已自动进入载具', 'info');
                }
            }, 100);

        } catch (error) {
            alt.log(`[载具] 玩家 ${player.name} 生成载具失败: ${error}`);
            alt.emitClient(player, 'addMessage', '❌ 生成载具失败', 'error');
        }
    }

    // 设置车辆属性
    setupVehicle(vehicle) {
        vehicle.engineOn = true;
        vehicle.numberPlateText = "风启市";
        vehicle.primaryColor = Math.floor(Math.random() * 160);
        vehicle.secondaryColor = Math.floor(Math.random() * 160);
        vehicle.engineHealth = 1000;
        vehicle.repair();
    }

    // 删除车辆
    deleteVehicle(player) {
        try {
            if (player.vehicle) {
                const vehicle = player.vehicle;
                player.vehicle = null;
                vehicle.destroy();
                
                // 从列表中移除
                let playerVehicles = this.vehicles.get(player) || [];
                playerVehicles = playerVehicles.filter(v => v !== vehicle);
                this.vehicles.set(player, playerVehicles);
                player.setMeta("vehicles", playerVehicles);
                
                alt.emitClient(player, 'addMessage', '已删除当前载具', 'success');
                return;
            }

            const nearestVehicle = this.getNearestVehicle(player.pos, 5);
            if (nearestVehicle && nearestVehicle.valid) {
                nearestVehicle.destroy();
                alt.emitClient(player, 'addMessage', '已删除最近的载具', 'success');
            } else {
                alt.emitClient(player, 'addMessage', '附近没有找到载具', 'error');
            }
        } catch (error) {
            alt.log(`[载具] 删除载具错误: ${error}`);
            alt.emitClient(player, 'addMessage', '删除载具失败', 'error');
        }
    }

    // 获取最近的载具
    getNearestVehicle(pos, radius = 5) {
        let nearestVehicle = null;
        let minDistance = radius;

        alt.Vehicle.all.forEach(vehicle => {
            if (vehicle && vehicle.valid) {
                const distance = this.getDistance(pos, vehicle.pos);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestVehicle = vehicle;
                }
            }
        });

        return nearestVehicle;
    }

    // 计算距离
    getDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2) +
            Math.pow(pos1.z - pos2.z, 2)
        );
    }

    // 清理玩家的车辆
    cleanupPlayerVehicles(player) {
        const vehicles = this.vehicles.get(player) || [];
        vehicles.forEach(vehicle => {
            if (vehicle && vehicle.valid) {
                vehicle.destroy();
            }
        });
        this.vehicles.delete(player);
        player.setMeta("vehicles", undefined);
    }
}

// 创建单例实例
const vehicleHandler = new VehicleHandler();
export default vehicleHandler; 