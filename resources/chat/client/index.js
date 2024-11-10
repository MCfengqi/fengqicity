import * as alt from 'alt-client';
import * as native from 'natives';
import { updateMoney } from './hud.js';

let chatView = null;
let isInputActive = false;
let lastKeyTime = 0;
let waypoint = null;

// 创建WebView
function createChatView() {
    if (!chatView) {
        try {
            chatView = new alt.WebView('http://resource/client/html/index.html');
            chatView.focus();
            chatView.isVisible = true;
            setupChatEvents();
            setupMinimap();
            setupWaypointMonitor();
            alt.log('Chat view created successfully');
        } catch (error) {
            alt.log('Error creating chat view:', error);
        }
    }
}

// 设置标记点监听
function setupWaypointMonitor() {
    alt.everyTick(() => {
        try {
            const currentWaypoint = native.getFirstBlipInfoId(8);
            
            if (currentWaypoint !== 0 && !waypoint) {
                const coords = native.getBlipInfoIdCoord(currentWaypoint);
                if (coords) {
                    // 获取地面高度
                    let groundZ = coords.z;
                    const [success, _groundZ] = native.getGroundZFor3dCoord(
                        coords.x, 
                        coords.y, 
                        coords.z + 100, 
                        groundZ, 
                        true
                    );
                    
                    if (success) {
                        groundZ = _groundZ;
                    }
                    
                    waypoint = {
                        x: coords.x,
                        y: coords.y,
                        z: groundZ + 1.0 // 确保不会卡在地下
                    };
                    
                    alt.emitServer('setWaypoint', waypoint.x, waypoint.y, waypoint.z);
                    if (chatView) {
                        chatView.emit('addMessage', '已记录标记点位置，输入 /tp 传送', 'system');
                    }
                }
            } else if (currentWaypoint === 0 && waypoint) {
                waypoint = null;
            }
        } catch (error) {
            alt.log('Waypoint monitor error:', error);
        }
    });
}

// 设置聊天事件
function setupChatEvents() {
    // 监听按键
    alt.on('keydown', (key) => {
        const now = Date.now();
        if (now - lastKeyTime < 50) return;
        lastKeyTime = now;

        if (!chatView) return;

        switch(key) {
            case 84: // T键
                if (!isInputActive) {
                    openChat();
                    // 阻止T键输入
                    alt.setTimeout(() => {
                        if (chatView) {
                            chatView.emit('clearInput');
                        }
                    }, 50);
                }
                break;
            case 191: // 斜杠键
                if (!isInputActive) {
                    openChatWithSlash();
                }
                break;
            case 27: // ESC键
                if (isInputActive) {
                    closeChat();
                }
                break;
            case 13: // Enter键
                if (isInputActive) {
                    chatView.emit('submitMessage');
                    closeChat();
                }
                break;
        }
    });

    // 处理聊天消息
    chatView.on('chatMessage', (message) => {
        if (message?.trim()) {
            // 如果是命令，不在本地显示
            if (!message.startsWith('/')) {
                chatView.emit('addMessage', `${alt.Player.local.name}: ${message}`);
            }
            // 发送到服务器
            alt.emitServer('chatMessage', message);
        }
    });

    // 修改传送功能
    chatView.on('tpCommand', () => {
        try {
            const waypoint = native.getFirstBlipInfoId(8);
            if (waypoint !== 0) {
                const coords = native.getBlipInfoIdCoord(waypoint);
                if (coords) {
                    // 直接传送
                    alt.emitServer('tpToWaypoint', {
                        x: coords.x,
                        y: coords.y,
                        z: coords.z
                    });
                }
            } else {
                chatView.emit('addMessage', '请先在地图上标记一个点', 'error');
            }
        } catch (error) {
            alt.log('Teleport error:', error);
            chatView.emit('addMessage', '传送失败', 'error');
        }
    });

    // 处理天气变化
    alt.onServer('setWeather', (weatherId) => {
        try {
            native.setWeatherTypeNow(getWeatherName(weatherId));
            native.setWeatherTypeNowPersist(getWeatherName(weatherId));
        } catch (error) {
            alt.log('Error setting weather:', error);
        }
    });
}

// 添加天气ID到名称的转换函数
function getWeatherName(weatherId) {
    const weatherTypes = {
        0: 'EXTRASUNNY',
        1: 'CLEAR',
        2: 'CLOUDS',
        3: 'SMOG',
        4: 'FOGGY',
        5: 'OVERCAST',
        6: 'RAIN',
        7: 'THUNDER',
        8: 'CLEARING',
        9: 'NEUTRAL',
        10: 'SNOW',
        11: 'BLIZZARD',
        12: 'SNOWLIGHT',
        13: 'XMAS',
        14: 'HALLOWEEN'
    };
    return weatherTypes[weatherId] || 'CLEAR';
}

// 打开聊天
function openChat() {
    try {
        isInputActive = true;
        chatView.focus();
        chatView.emit('openChat');
        alt.toggleGameControls(false);
        alt.showCursor(true);
    } catch (error) {
        alt.log('Error opening chat:', error);
    }
}

// 打开聊天并输入斜杠
function openChatWithSlash() {
    try {
        isInputActive = true;
        chatView.focus();
        chatView.emit('openChatWithSlash');
        alt.toggleGameControls(false);
        alt.showCursor(true);
    } catch (error) {
        alt.log('Error opening chat with slash:', error);
    }
}

// 关闭聊天
function closeChat() {
    try {
        if (!isInputActive) return;
        
        isInputActive = false;
        if (chatView) {
            chatView.emit('closeChat');
        }
        alt.toggleGameControls(true);
        alt.showCursor(false);
    } catch (error) {
        alt.log('Error closing chat:', error);
    }
}

// 设置小地图
function setupMinimap() {
    try {
        // 显示小地图
        native.displayRadar(true);
        
        // 设置小地图样式
        native.setRadarBigmapEnabled(false, false);
        native.setRadarZoom(1.0);
        
        // 设置小地图位置和大小
        const minimapWidth = 0.15;
        const minimapHeight = 0.25;
        const offsetX = 0.01;
        const offsetY = -0.01;

        // 设置小地图组件位置
        native.setMinimapComponentPosition('minimap', 'L', 'B', offsetX, offsetY, minimapWidth, minimapHeight);
        native.setMinimapComponentPosition('minimap_mask', 'L', 'B', offsetX, offsetY, minimapWidth, minimapHeight);
        native.setMinimapComponentPosition('minimap_blur', 'L', 'B', offsetX, offsetY, minimapWidth, minimapHeight);

        // 移除小地图边框
        native.setMinimapBorderUsingRawMaterial(false);
        
        // 设置小地图样式
        native.setRadarAsExteriorThisFrame();
        native.setRadarAsInteriorThisFrame();
        
        // 设置小地图缩放
        native.setRadarZoomLevelThisFrame(0);
    } catch (error) {
        alt.log('Error setting up minimap:', error);
    }
}

// 修改地图标记函数
function setupMapBlips() {
    // 主要地标
    createBlip("风启市中心", new alt.Vector3(-149.0, -968.0, 29.0), 198, 5);
    createBlip("机场", new alt.Vector3(-1037.0, -2968.0, 13.9), 90, 3);
    createBlip("中心", new alt.Vector3(-624.0, -283.0, 35.0), 93, 4);
    createBlip("沙滩", new alt.Vector3(-1645.0, -1095.0, 13.0), 304, 5);
    createBlip("高尔夫俱乐部", new alt.Vector3(-1380.0, 56.0, 53.0), 109, 2);
    createBlip("游艇码头", new alt.Vector3(-800.0, -1513.0, 1.0), 404, 4);

    // 服务设施
    createBlip("加油站", new alt.Vector3(265.0, -1261.0, 29.0), 361, 1);
    createBlip("医院", new alt.Vector3(295.0, -1447.0, 29.0), 61, 1);
    createBlip("警察局", new alt.Vector3(441.0, -982.0, 30.0), 60, 3);
    createBlip("银行", new alt.Vector3(150.0, -1040.0, 29.0), 108, 2);
    createBlip("汽车修理店", new alt.Vector3(-359.0, -133.0, 38.0), 446, 5);
    createBlip("服装店", new alt.Vector3(-718.0, -158.0, 37.0), 73, 3);
    createBlip("理发店", new alt.Vector3(-815.0, -184.0, 37.0), 71, 7);

    // 娱乐场所
    createBlip("赌场", new alt.Vector3(930.0, 43.0, 81.0), 679, 4);
    createBlip("夜总会", new alt.Vector3(-1389.0, -585.0, 30.0), 121, 48);
    createBlip("电影院", new alt.Vector3(300.0, 200.0, 104.0), 135, 7);
    createBlip("保龄球馆", new alt.Vector3(-145.0, -243.0, 44.0), 103, 7);
    createBlip("网球场", new alt.Vector3(-1345.0, 147.0, 57.0), 122, 3);

    // 商业区域
    createBlip("购物广场", new alt.Vector3(-507.0, -705.0, 33.0), 93, 4);
    createBlip("超市", new alt.Vector3(25.0, -1347.0, 29.0), 52, 2);
    createBlip("武器店", new alt.Vector3(252.0, -50.0, 69.0), 110, 1);
    createBlip("纹身店", new alt.Vector3(-1153.0, -1425.0, 4.0), 75, 1);

    // 交通枢纽
    createBlip("地铁站", new alt.Vector3(-539.0, -1281.0, 26.0), 513, 2);
    createBlip("出租车站", new alt.Vector3(894.0, -179.0, 74.0), 198, 5);
    createBlip("停车场", new alt.Vector3(215.0, -809.0, 31.0), 357, 3);
    createBlip("直升机停机坪", new alt.Vector3(-735.0, -1456.0, 5.0), 360, 1);

    // 自然景观
    createBlip("山顶观台", new alt.Vector3(450.0, 5566.0, 783.0), 162, 2);
    createBlip("公园", new alt.Vector3(-1642.0, -445.0, 39.0), 197, 25);
    createBlip("海滩俱乐部", new alt.Vector3(-1513.0, -1218.0, 2.0), 304, 3);
    createBlip("野生动物保护区", new alt.Vector3(-1705.0, 2158.0, 58.0), 442, 2);
}

// 改进创建地图标记函数
function createBlip(name, position, sprite, color) {
    try {
        const blip = native.addBlipForCoord(position.x, position.y, position.z);
        native.setBlipSprite(blip, sprite);
        native.setBlipColour(blip, color);
        native.setBlipAsShortRange(blip, true);
        native.setBlipScale(blip, 0.9); // 将基础大小改为0.9
        native.setBlipDisplay(blip, 2); // 确保在小地图上显示
        native.setBlipCategory(blip, 1); // 设置图标类别
        native.beginTextCommandSetBlipName("STRING");
        native.addTextComponentSubstringPlayerName(name);
        native.endTextCommandSetBlipName(blip);

        // 为某些特定类型的地点添加路径点
        if ([60, 61, 361, 108].includes(sprite)) { // 警察局、医院、加油站、银行
            native.setBlipRouteColour(blip, color);
            native.setBlipAsFriendly(blip, true);
            native.setBlipScale(blip, 1.0); // 重要地点稍微大一点
        }

        // 为某些特殊地点设置更大的图标
        if ([198, 90, 93].includes(sprite)) { // 市中心、机场、购物中心等主要地标
            native.setBlipScale(blip, 1.1); // 主要地标最大
        }

        return blip;
    } catch (error) {
        alt.log('Error creating blip:', error);
    }
}

// 初始化
alt.on('connectionComplete', () => {
    alt.setTimeout(() => {
        try {
            createChatView();
            setupMapBlips(); // 添加地图标记
            if (chatView) {
                chatView.emit('playerLogin', alt.Player.local.name);
            }
        } catch (error) {
            alt.log('Error during initialization:', error);
        }
    }, 1000);
});

// 处理从服务器接收的消息
alt.onServer('addMessage', (message) => {
    if (chatView && message) {
        chatView.emit('addMessage', message);
    }
});

// 资源停止时清理
alt.on('resourceStop', () => {
    if (chatView) {
        chatView.destroy();
        chatView = null;
    }
});

// 添加金钱更新监听
alt.onServer('updateMoney', (cash, bank) => {
    updateMoney(cash, bank);
});
