import * as alt from 'alt-server';
import { addCash, addBank } from './money.js';
import vehicleHandler from './vehicleHandler.js';

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

            case '/money':
                handleMoneyCommand(player, args);
                break;

            case '/pos':
                const pos = player.pos;
                const rot = player.rot;
                const posStr = `位置: X: ${pos.x.toFixed(4)}, Y: ${pos.y.toFixed(4)}, Z: ${pos.z.toFixed(4)}`;
                const rotStr = `朝向: ${rot.z.toFixed(2)}°`;
                alt.emitClient(player, 'addMessage', posStr, 'info');
                alt.emitClient(player, 'addMessage', rotStr, 'info');
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