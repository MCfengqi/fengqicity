import * as alt from 'alt-client';
import './chat.js';
import './money.js';

// 初始化UI
alt.on('load', () => {
    alt.log('UI system initialized');
});

// 导出UI API
export const UI = {
    chat: {
        show: () => document.getElementById('chat-container').style.display = 'block',
        hide: () => document.getElementById('chat-container').style.display = 'none'
    },
    money: {
        show: () => document.getElementById('money-container').style.display = 'block',
        hide: () => document.getElementById('money-container').style.display = 'none'
    }
}; 