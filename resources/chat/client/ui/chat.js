import * as alt from 'alt-client';

const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatInputContainer = document.getElementById('chat-input-container');

let chatVisible = false;
const maxMessages = 50;

// 处理按键事件
alt.on('keyup', (key) => {
    if (key === 84 && !chatVisible) { // T键
        showChat();
    } else if (key === 27 && chatVisible) { // ESC键
        hideChat();
    }
});

// 添加全局键盘事件监听
document.addEventListener('keydown', (e) => {
    // 检查是否按下了 Ctrl+A
    if (e.ctrlKey && e.key === 'a') {
        e.preventDefault(); // 阻止默认行为
        
        // 获取当前焦点元素
        const activeElement = document.activeElement;
        
        // 如果是在输入框中
        if (activeElement === chatInput) {
            activeElement.select();
        } else {
            // 如果是在消息区域
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(chatMessages);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
});

// 添加鼠标事件监听
chatMessages.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // 左键点击
        e.stopPropagation();
        alt.emit('chat:selecting');
        
        // 启用文字选择
        document.body.style.userSelect = 'text';
        document.body.style.webkitUserSelect = 'text';
    }
});

document.addEventListener('mouseup', () => {
    alt.emit('chat:selectionEnd');
});

// 显示聊天框
function showChat() {
    chatVisible = true;
    chatInputContainer.style.display = 'block';
    chatInput.focus();
    alt.emit('chat:opened');
    alt.showCursor(true);
}

// 隐藏聊天框
function hideChat() {
    chatVisible = false;
    chatInputContainer.style.display = 'none';
    chatInput.value = '';
    alt.emit('chat:closed');
    alt.showCursor(false);
}

// 添加消息
export function addMessage(text, type = 'normal') {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);

    // 限制消息数量
    while (chatMessages.children.length > maxMessages) {
        chatMessages.removeChild(chatMessages.firstChild);
    }

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 处理聊天输入
chatInput.addEventListener('keypress', (e) => {
    if (e.keyCode === 13) {
        const msg = chatInput.value.trim();
        if (msg.length > 0) {
            alt.emit('chatMessage', msg);
        }
        hideChat();
    }
});

// 注册服务器事件
alt.onServer('addMessage', addMessage);

// 添加复制支持
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(chatMessages);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}); 