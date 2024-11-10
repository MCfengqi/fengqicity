import * as alt from 'alt-server';
import './server.js';
import './commands.js';
import './money.js';
import './vehicles.js';

// 添加命令注册功能
const registeredCommands = new Map();

export function registerCmd(cmdName, callback) {
    if (typeof cmdName !== 'string' || typeof callback !== 'function') {
        alt.log(`Invalid command registration: ${cmdName}`);
        return;
    }
    
    registeredCommands.set(cmdName.toLowerCase(), callback);
    alt.log(`Registered command: ${cmdName}`);
}

// 处理命令
alt.onClient('chatMessage', (player, message) => {
    if (!message.startsWith('/')) return;

    const args = message.slice(1).split(' ');
    const cmd = args.shift().toLowerCase();
    
    if (registeredCommands.has(cmd)) {
        try {
            registeredCommands.get(cmd)(player, args);
        } catch (error) {
            alt.log(`Error executing command ${cmd}: ${error}`);
        }
    }
});

alt.log('Server resources loaded successfully');
