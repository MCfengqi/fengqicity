let chatInput;
let chatContainer;
let messagesContainer;
let isInputActive = false;

const COMMANDS = {
    '/help': '显示所有可用命令',
    '/clear': '清除聊天记录',
    '/me': '发送动作消息',
    '/do': '发送描述消息',
    '/pos': '显示当前位置坐标',
    '/male': '切换为男性角色',
    '/female': '切换为女性角色',
    '/tp': '传送到地图标记点',
    '/tpto': '传送到指定玩家位置',
    '/players': '显示在线玩家列表',
    '/kill': '结束自己的生命',
    '/heal': '恢复生命值和护甲',
    '/time': '显示服务器时间',
    '/spawn': '回到出生点',
    '/car': '生成一个载具 (/car [载具名称])',
    '/dv': '删除最近的载具',
    '/weather': '设置天气 (/weather [0-14])',
    '/fix': '修复当前或最近的载具',
    '/money': '添加金钱 (/money [cash/bank] [金额])'
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    chatInput = document.getElementById('chat-input');
    chatContainer = document.getElementById('chat-container');
    messagesContainer = document.getElementById('chat-messages');

    setupEventListeners();
});

// 设置事件监听
function setupEventListeners() {
    let inputTimeout;

    // 输入框事件
    chatInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        
        // 清除之前的超时
        if (inputTimeout) {
            clearTimeout(inputTimeout);
        }
        
        if (e.key === 'Enter') {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (message) {
                // 使用超时来延迟消息处理，避免卡顿
                inputTimeout = setTimeout(() => {
                    handleMessage(message);
                    closeChat();
                }, 10);
            } else {
                closeChat();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeChat();
        }
    });

    // 防止输入时触发游戏控制
    chatInput.addEventListener('input', (e) => {
        e.stopPropagation();
    });

    // 接收来自游戏的消息
    if ('alt' in window) {
        alt.on('addMessage', addMessage);
        alt.on('playerLogin', showWelcomeMessage);
        alt.on('openChat', openChat);
        alt.on('openChatWithSlash', openChatWithSlash);
        alt.on('closeChat', closeChat);
        alt.on('submitMessage', () => {
            const message = chatInput.value.trim();
            if (message) {
                handleMessage(message);
            }
            closeChat();
        });
        alt.on('clearInput', clearInput);
    }
}

// 打开聊天输入
function openChat() {
    chatInput.style.display = 'block';
    chatInput.value = '';
    chatInput.focus();
    isInputActive = true;
    if ('alt' in window) {
        alt.emit('chatInputActive', true);
    }
}

// 打开聊天输入并自动输入斜杠
function openChatWithSlash() {
    chatInput.style.display = 'block';
    chatInput.value = '/';
    chatInput.focus();
    const len = chatInput.value.length;
    chatInput.setSelectionRange(len, len);
    isInputActive = true;
    if ('alt' in window) {
        alt.emit('chatInputActive', true);
    }
}

// 关闭聊天输入
function closeChat() {
    chatInput.style.display = 'none';
    chatInput.blur();
    chatInput.value = '';
    isInputActive = false;
    if ('alt' in window) {
        alt.emit('chatInputActive', false);
    }
}

// 添加消息到聊天窗口
function addMessage(text, type = '') {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    
    // 创建时间戳
    const now = new Date();
    const timeStr = `[${now.getFullYear()}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    
    // 创建时间戳元素
    const timeSpan = document.createElement('span');
    timeSpan.className = 'timestamp';
    timeSpan.textContent = timeStr;
    
    // 创建消息内容元素
    const contentSpan = document.createElement('span');
    contentSpan.className = 'content';
    contentSpan.textContent = ` ${text}`; // 添加空格分隔时间戳和内容
    
    // 组合时间戳和消息内容
    messageElement.appendChild(timeSpan);
    messageElement.appendChild(contentSpan);
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // 自动清理旧消息
    while (messagesContainer.children.length > 100) {
        messagesContainer.removeChild(messagesContainer.firstChild);
    }

    // 如果消息超出视图，自动滚动到底部
    if (messagesContainer.scrollHeight > messagesContainer.clientHeight) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// 显示欢迎消息
function showWelcomeMessage(playerName) {
    addMessage('=================================', 'system');
    addMessage(`欢迎来到风启市��`, 'system');
    addMessage(`欢迎您，${playerName}！`, 'system');
    addMessage('按 T 键开始聊天', 'system');
    addMessage('输入 /help 查看可用命令', 'system');
    addMessage('=================================', 'system');
}

// 处理消息
function handleMessage(message) {
    if (message.startsWith('/')) {
        // 命令处理
        handleCommand(message);
    } else {
        // 普通聊天消息直接发送
        sendMessage(message);
    }
}

// 修改处理命令函数
function handleCommand(command) {
    if ('alt' in window) {
        // 如果是车辆命令，显示处理中提示
        if (command.toLowerCase().startsWith('/car')) {
            const vehicleName = command.split(' ')[1];
            if (vehicleName) {
                addMessage(`正在生成载具: ${vehicleName}...`, 'system');
                // 设置3秒超时
                setTimeout(() => {
                    // 如果3秒内没有收到成功消息，显示失败提示
                    const messages = document.querySelectorAll('.message');
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage && lastMessage.textContent.includes('正在生成载具')) {
                        addMessage(`❌ 生成载具失败: ${vehicleName}`, 'error');
                        addMessage('请检查车辆名称是否正确', 'info');
                    }
                }, 3000);
            }
        }
        
        // 发送命令到服务器
        alt.emit('chatMessage', command);
    }
}

// 显示帮助信息
function showHelp() {
    addMessage('可用命令：', 'help');
    Object.entries(COMMANDS).forEach(([cmd, desc]) => {
        addMessage(`${cmd} - ${desc}`, 'help');
    });
}

// 清除聊天记录
function clearChat() {
    messagesContainer.innerHTML = '';
    addMessage('聊天记录已清除', 'system');
}

// 发送消息
function sendMessage(message, type = '') {
    if ('alt' in window && message.trim()) {
        alt.emit('chatMessage', message);
        chatInput.value = '';
    }
}

// 添加清除输入框内容的函数
function clearInput() {
    if (chatInput) {
        chatInput.value = '';
    }
}
