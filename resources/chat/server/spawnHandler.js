import * as alt from 'alt-server';

// 定义出生点
export const SPAWN_POINT = {
    x: 444.4747314453125,    // 洛圣都警察局
    y: -983.88134765625,
    z: 30.6783447265625,
    heading: 0,
    description: '洛圣都警察局'
};

class SpawnHandler {
    constructor() {
        this.setupEventHandlers();
        alt.log('[系统] 出生点系统初始化完成');
    }

    setupEventHandlers() {
        // 玩家死亡事件处理
        alt.on('playerDeath', (player, killer, weapon) => {
            this.handlePlayerDeath(player, killer);
        });
    }

    // 处理玩家死亡
    handlePlayerDeath(player, killer) {
        // 发送死亡通知
        if (killer) {
            alt.log(`${killer.name} 击杀了 ${player.name}`);
            alt.emitAllClients('addMessage', `${killer.name} 击杀了 ${player.name}`, 'system');
        } else {
            alt.log(`${player.name} 自杀了`);
            alt.emitAllClients('addMessage', `${player.name} 自杀了`, 'system');
        }

        // 3秒后重生
        alt.setTimeout(() => {
            if (player && player.valid) {
                this.spawnPlayer(player);
                alt.emitClient(player, 'addMessage', `你已在${SPAWN_POINT.description}重生`, 'info');
            }
        }, 3000);
    }

    // 在警局生成玩家
    spawnPlayer(player) {
        if (player && player.valid) {
            player.spawn(SPAWN_POINT.x, SPAWN_POINT.y, SPAWN_POINT.z, 0);
            player.rot = { x: 0, y: 0, z: SPAWN_POINT.heading };
            player.health = 200;
            player.armour = 100;
            alt.log(`[出生点] 玩家 ${player.name} 在 ${SPAWN_POINT.description} 出生`);
        }
    }
}

const spawnHandler = new SpawnHandler();
export default spawnHandler; 