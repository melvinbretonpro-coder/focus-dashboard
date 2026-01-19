/* ========================================
   FOCUS DASHBOARD - Application Logic
   ======================================== */

// ========== METHODS DATA ==========
const METHODS = {
    'deep-work': {
        id: 'deep-work',
        name: 'Deep Work',
        icon: '🧠',
        objective: 'Concentration maximale sur une tâche complexe',
        rules: [
            'Aucune interruption tolérée',
            'Téléphone éteint ou en mode avion',
            'Notifications désactivées',
            'Une seule tâche à la fois',
            'Sessions de 2 à 4 heures recommandées'
        ],
        defaultFocus: 120, // 2 heures par défaut
        defaultPause: 0,
        taskType: 'single',
        cycles: 1,
        tip: '🧠 Aucune interruption • Téléphone éteint',
        hasPause: false
    },
    'pomodoro': {
        id: 'pomodoro',
        name: 'Pomodoro',
        icon: '🍅',
        objective: 'Avancer par sprints courts et réguliers',
        rules: [
            '25 minutes de focus intense',
            '5 minutes de pause',
            'Grande pause de 15-20 min après 4 cycles',
            'Découpez vos tâches en petits morceaux'
        ],
        defaultFocus: 25,
        defaultPause: 5,
        longPause: 15,
        taskType: 'checklist',
        cycles: 4,
        tip: '🍅 Sprint court • Restez dans le flow',
        hasPause: true
    },
    '90-20': {
        id: '90-20',
        name: '90 / 20',
        icon: '⚡',
        objective: 'Suivre le rythme naturel du cerveau (ultradien)',
        rules: [
            '90 minutes de travail profond',
            '20 minutes de récupération vraie',
            'Maximum 1-2 tâches par session',
            'Éloignez-vous de l\'écran pendant la pause'
        ],
        defaultFocus: 90,
        defaultPause: 20,
        taskType: 'single',
        cycles: -1,
        tip: '⚡ Rythme ultradien • Récupération vraie',
        hasPause: true
    },
    'timer-libre': {
        id: 'timer-libre',
        name: 'Timer Libre',
        icon: '⏱️',
        objective: 'Un simple timer sans contraintes',
        rules: [],
        defaultFocus: 30,
        defaultPause: 0,
        taskType: 'none',
        cycles: 1,
        tip: '',
        hasPause: false
    }
};

// ========== APP STATE ==========
let state = {
    currentView: 'dashboard',
    selectedMethod: null,
    focusDuration: 0,
    pauseDuration: 0,
    currentTask: '',
    tasks: [],
    currentCycle: 1,
    totalCycles: 1,
    timerState: 'stopped',
    timerMode: 'focus',
    timeRemaining: 0,
    totalTime: 0,
    timerInterval: null,
    totalFocusTime: 0,
    timerEndTime: null,      // Timestamp de fin du timer
    pausedTimeRemaining: 0   // Temps restant quand mis en pause
};

// ========== DOM ELEMENTS ==========
const views = {
    dashboard: document.getElementById('view-dashboard'),
    config: document.getElementById('view-config'),
    session: document.getElementById('view-session'),
    pause: document.getElementById('view-pause'),
    end: document.getElementById('view-end')
};

// ========== AUDIO & BROWSER NOTIFICATION ==========
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;

// Demander la permission pour les notifications au chargement
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function playNotificationSound() {
    try {
        if (!audioContext) {
            audioContext = new AudioContext();
        }

        // Resume audio context if suspended (required for background playback)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Pleasant chime sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
    } catch (e) {
        console.log('Audio notification not available');
    }
}

function showBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: '🎯',
            tag: 'focus-dashboard-timer',
            requireInteraction: true
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10000);
    }
}

function showVisualNotification() {
    const flash = document.createElement('div');
    flash.className = 'notification-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
}

// ========== TIME FORMATTING ==========
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
}

function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
        return `${hours}h${String(minutes).padStart(2, '0')}`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${minutes} min`;
    }
}

// ========== VIEW MANAGEMENT ==========
function showView(viewName) {
    Object.values(views).forEach(view => view.classList.remove('active'));
    views[viewName].classList.add('active');
    state.currentView = viewName;
    saveState();
}

// ========== LOCAL STORAGE ==========
const STORAGE_KEY = 'focus-dashboard-session';

function saveState() {
    const saveData = {
        ...state,
        timerInterval: null
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timerState !== 'stopped' && parsed.timeRemaining > 0) {
            return parsed;
        }
    }
    return null;
}

function clearSavedState() {
    localStorage.removeItem(STORAGE_KEY);
}

// ========== DASHBOARD ==========
function initDashboard() {
    const methodCards = document.querySelectorAll('.method-card');

    methodCards.forEach(card => {
        card.addEventListener('click', () => {
            const methodId = card.dataset.method;
            selectMethod(methodId);
        });

        const selectBtn = card.querySelector('.btn-select');
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const methodId = card.dataset.method;
            selectMethod(methodId);
        });
    });
}

function selectMethod(methodId) {
    state.selectedMethod = METHODS[methodId];
    state.focusDuration = state.selectedMethod.defaultFocus;
    state.pauseDuration = state.selectedMethod.defaultPause;
    state.tasks = [];
    state.currentTask = '';

    setupConfigView();
    showView('config');
}

// ========== CONFIGURATION VIEW ==========
function setupConfigView() {
    const method = state.selectedMethod;

    document.getElementById('config-method-icon').textContent = method.icon;
    document.getElementById('config-method-title').textContent = method.name;

    // Show/hide rules section
    const rulesContainer = document.getElementById('config-rules-container');
    if (method.rules.length === 0) {
        rulesContainer.style.display = 'none';
    } else {
        rulesContainer.style.display = 'block';
        const rulesList = document.getElementById('config-rules-list');
        rulesList.innerHTML = method.rules.map(rule => `<li>${rule}</li>`).join('');
    }

    // Show/hide pause duration
    const pauseGroup = document.getElementById('pause-duration-group');
    if (method.hasPause) {
        pauseGroup.style.display = 'block';
    } else {
        pauseGroup.style.display = 'none';
    }

    // Set durations (convert minutes to hours + minutes)
    const focusHours = Math.floor(method.defaultFocus / 60);
    const focusMinutes = method.defaultFocus % 60;
    document.getElementById('focus-hours').value = focusHours;
    document.getElementById('focus-minutes').value = focusMinutes;

    const pauseHours = Math.floor(method.defaultPause / 60);
    const pauseMinutes = method.defaultPause % 60;
    document.getElementById('pause-hours').value = pauseHours;
    document.getElementById('pause-minutes').value = pauseMinutes;

    // Show correct task input
    const singleTaskDiv = document.getElementById('config-task-single');
    const listTaskDiv = document.getElementById('config-task-list');

    if (method.taskType === 'checklist') {
        singleTaskDiv.style.display = 'none';
        listTaskDiv.style.display = 'block';
    } else if (method.taskType === 'single') {
        singleTaskDiv.style.display = 'block';
        listTaskDiv.style.display = 'none';
    } else {
        // No task input for timer-libre
        singleTaskDiv.style.display = 'none';
        listTaskDiv.style.display = 'none';
    }

    // Clear inputs
    document.getElementById('task-input').value = '';
    document.getElementById('new-task-input').value = '';
    document.getElementById('tasks-list').innerHTML = '';
    state.tasks = [];
}

function initConfigView() {
    document.getElementById('btn-back-config').addEventListener('click', () => {
        showView('dashboard');
    });

    document.querySelectorAll('.stepper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const currentValue = parseInt(input.value) || 0;
            const min = parseInt(input.min);
            const max = parseInt(input.max);

            // Determine step based on input type
            let step = 1;
            if (targetId.includes('hours')) {
                step = 1;
            } else if (targetId.includes('minutes')) {
                step = 5;
            }

            if (btn.classList.contains('plus') && currentValue < max) {
                input.value = Math.min(max, currentValue + step);
            } else if (btn.classList.contains('minus') && currentValue > min) {
                input.value = Math.max(min, currentValue - step);
            }
        });
    });

    document.getElementById('btn-add-task').addEventListener('click', addTask);
    document.getElementById('new-task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    document.getElementById('btn-start-session').addEventListener('click', startSession);
}

function addTask() {
    const input = document.getElementById('new-task-input');
    const text = input.value.trim();

    if (text) {
        state.tasks.push({ text, completed: false });
        renderTasksList();
        input.value = '';
        input.focus();
    }
}

function renderTasksList() {
    const pendingList = document.getElementById('tasks-list');
    const completedList = document.getElementById('completed-tasks-list');
    const completedSection = document.getElementById('completed-section');

    // Tâches à faire (non complétées)
    const pendingTasks = state.tasks.filter(t => !t.completed);
    pendingList.innerHTML = pendingTasks.map((task) => {
        const originalIndex = state.tasks.indexOf(task);
        return `
        <li draggable="true" data-index="${originalIndex}">
            <span class="drag-handle">⋮⋮</span>
            <input type="checkbox" onchange="toggleTask(${originalIndex})">
            <span class="task-text">${task.text}</span>
            <button class="btn-remove-task" onclick="removeTask(${originalIndex})">×</button>
        </li>
    `;
    }).join('');

    // Tâches terminées
    const completedTasks = state.tasks.filter(t => t.completed);
    if (completedTasks.length > 0) {
        completedSection.style.display = 'block';
        completedList.innerHTML = completedTasks.map((task) => {
            const originalIndex = state.tasks.indexOf(task);
            return `
            <li data-index="${originalIndex}">
                <input type="checkbox" checked onchange="toggleTask(${originalIndex})">
                <span class="task-text">${task.text}</span>
                <button class="btn-remove-task" onclick="removeTask(${originalIndex})">×</button>
            </li>
        `;
        }).join('');
    } else {
        completedSection.style.display = 'none';
    }

    // Initialiser le drag-and-drop
    initDragAndDrop();
}

function initDragAndDrop() {
    const list = document.getElementById('tasks-list');
    const items = list.querySelectorAll('li');

    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragleave', handleDragLeave);
    });
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.tasks-list li').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (draggedItem !== this) {
        const fromIndex = parseInt(draggedItem.dataset.index);
        const toIndex = parseInt(this.dataset.index);

        // Réorganiser les tâches
        const [movedTask] = state.tasks.splice(fromIndex, 1);
        state.tasks.splice(toIndex, 0, movedTask);

        renderTasksList();
        saveState();
    }
}

function toggleTask(index) {
    state.tasks[index].completed = !state.tasks[index].completed;
    renderTasksList();
    renderSessionTasksList();
    saveState();
}

function removeTask(index) {
    state.tasks.splice(index, 1);
    renderTasksList();
    renderSessionTasksList();
    saveState();
}

// ========== SESSION ==========
function startSession() {
    const method = state.selectedMethod;

    if (method.taskType === 'single') {
        state.currentTask = document.getElementById('task-input').value.trim() || 'Tâche non définie';
    }

    // Get focus duration from hours and minutes
    const focusHours = parseInt(document.getElementById('focus-hours').value) || 0;
    const focusMinutes = parseInt(document.getElementById('focus-minutes').value) || 0;
    state.focusDuration = (focusHours * 60) + focusMinutes;

    // Get pause duration from hours and minutes
    const pauseHours = parseInt(document.getElementById('pause-hours').value) || 0;
    const pauseMinutes = parseInt(document.getElementById('pause-minutes').value) || 0;
    state.pauseDuration = (pauseHours * 60) + pauseMinutes;

    // Ensure at least 1 minute for focus
    if (state.focusDuration < 1) {
        state.focusDuration = 1;
    }

    state.currentCycle = 1;
    state.totalCycles = method.cycles === -1 ? '∞' : method.cycles;
    state.timerMode = 'focus';
    state.timeRemaining = state.focusDuration * 60;
    state.totalTime = state.focusDuration * 60;
    state.totalFocusTime = 0;
    state.timerEndTime = null; // Reset pour le nouveau timer

    setupSessionView();
    showView('session');
    startTimer();
}

function setupSessionView() {
    const method = state.selectedMethod;

    document.getElementById('session-method-name').textContent = method.name;
    updateCycleDisplay();

    // Show correct task display
    const singleTaskDisplay = document.getElementById('session-task-display');
    const checklistDisplay = document.getElementById('session-checklist');
    const rulesContainer = document.getElementById('session-rules-container');

    if (method.taskType === 'checklist') {
        singleTaskDisplay.style.display = 'none';
        checklistDisplay.style.display = 'block';
        renderSessionTasksList();
    } else if (method.taskType === 'single') {
        singleTaskDisplay.style.display = 'block';
        checklistDisplay.style.display = 'none';
        document.getElementById('current-task-text').textContent = state.currentTask;
    } else {
        // Timer libre - no tasks
        singleTaskDisplay.style.display = 'none';
        checklistDisplay.style.display = 'none';
    }

    // Show/hide rules tip
    if (method.tip) {
        rulesContainer.style.display = 'block';
        document.getElementById('session-current-rule').textContent = method.tip;
    } else {
        rulesContainer.style.display = 'none';
    }

    updateTimerDisplay();
}

function renderSessionTasksList() {
    const list = document.getElementById('session-tasks-list');
    list.innerHTML = state.tasks.map((task, index) => `
        <li>
            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${index})">
            <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
        </li>
    `).join('');
}

function updateCycleDisplay() {
    const cycleDisplay = document.getElementById('session-cycle');
    const method = state.selectedMethod;

    // Hide cycle display for timer libre or single cycle methods
    if (method.id === 'timer-libre' || (method.cycles === 1 && method.id !== 'pomodoro')) {
        cycleDisplay.style.display = 'none';
    } else {
        cycleDisplay.style.display = 'inline';
        if (state.totalCycles === '∞') {
            cycleDisplay.textContent = `Cycle ${state.currentCycle}`;
        } else {
            cycleDisplay.textContent = `Cycle ${state.currentCycle}/${state.totalCycles}`;
        }
    }
}

function initSessionView() {
    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-stop').addEventListener('click', stopSession);
}

function togglePause() {
    const pauseIcon = document.querySelector('#btn-pause .icon-pause');
    const playIcon = document.querySelector('#btn-pause .icon-play');

    if (state.timerState === 'running') {
        state.timerState = 'paused';
        clearInterval(state.timerInterval);
        state.timerEndTime = null; // Reset pour recalculer à la reprise
        pauseIcon.style.display = 'none';
        playIcon.style.display = 'inline';
    } else if (state.timerState === 'paused') {
        state.timerState = 'running';
        startTimer();
        pauseIcon.style.display = 'inline';
        playIcon.style.display = 'none';
    }
    saveState();
}

function stopSession() {
    clearInterval(state.timerInterval);
    state.timerState = 'stopped';
    state.timerEndTime = null;
    showEndView();
}

// ========== TIMER ==========
function startTimer() {
    state.timerState = 'running';

    // Calculer le timestamp de fin basé sur le temps restant actuel
    if (!state.timerEndTime) {
        state.timerEndTime = Date.now() + (state.timeRemaining * 1000);
    }

    saveState();

    state.timerInterval = setInterval(() => {
        // Calculer le temps restant basé sur le timestamp de fin
        const now = Date.now();
        const remaining = Math.max(0, Math.round((state.timerEndTime - now) / 1000));

        // Calculer le temps de focus écoulé depuis le dernier tick
        if (state.timerMode === 'focus' && remaining < state.timeRemaining) {
            state.totalFocusTime += (state.timeRemaining - remaining);
        }

        state.timeRemaining = remaining;

        if (state.timeRemaining > 0) {
            updateTimerDisplay();
            saveState();
        } else {
            clearInterval(state.timerInterval);
            state.timerEndTime = null;
            timerComplete();
        }
    }, 1000);
}

// Recalculer le temps quand l'onglet redevient visible
function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && state.timerState === 'running' && state.timerEndTime) {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((state.timerEndTime - now) / 1000));

        // Si le timer aurait dû se terminer pendant qu'on était en arrière-plan
        if (remaining <= 0) {
            clearInterval(state.timerInterval);
            state.timeRemaining = 0;
            state.timerEndTime = null;
            timerComplete();
        } else {
            state.timeRemaining = remaining;
            updateTimerDisplay();
        }
    }
}

// Vérifier périodiquement si le timer est terminé (même en arrière-plan)
function setupBackgroundCheck() {
    // Vérifier toutes les 5 secondes si le timer est terminé
    setInterval(() => {
        if (state.timerState === 'running' && state.timerEndTime) {
            const now = Date.now();
            const remaining = Math.round((state.timerEndTime - now) / 1000);

            if (remaining <= 0) {
                clearInterval(state.timerInterval);
                state.timeRemaining = 0;
                state.timerEndTime = null;
                timerComplete();
            }
        }
    }, 5000);
}

function updateTimerDisplay() {
    const timeString = formatTime(state.timeRemaining);

    if (state.currentView === 'session') {
        document.getElementById('timer-time').textContent = timeString;
        document.getElementById('timer-label').textContent = state.timerMode === 'focus' ? 'Focus' : 'Pause';
        updateTimerRing('timer-progress');
    } else if (state.currentView === 'pause') {
        document.getElementById('pause-timer-time').textContent = timeString;
        updateTimerRing('pause-timer-progress');
    }
}

function updateTimerRing(elementId) {
    const progress = document.getElementById(elementId);
    const circumference = 2 * Math.PI * 90;
    const offset = circumference * (1 - state.timeRemaining / state.totalTime);
    progress.style.strokeDashoffset = offset;
}

function timerComplete() {
    playNotificationSound();
    showVisualNotification();

    // Notification navigateur pour alerter même en arrière-plan
    const method = state.selectedMethod;
    if (state.timerMode === 'focus') {
        showBrowserNotification(
            `${method.icon} Focus terminé !`,
            method.hasPause ? 'C\'est l\'heure de la pause !' : 'Session terminée !'
        );
        handleFocusComplete();
    } else {
        showBrowserNotification(
            `${method.icon} Pause terminée !`,
            'C\'est reparti pour un cycle de focus !'
        );
        handlePauseComplete();
    }
}

function handleFocusComplete() {
    const method = state.selectedMethod;

    // If method has no pause or it's timer libre, end session
    if (!method.hasPause || method.id === 'timer-libre') {
        showEndView();
        return;
    }

    // Check if we've completed all cycles
    if (method.cycles !== -1 && state.currentCycle >= method.cycles) {
        showEndView();
        return;
    }

    // Determine pause duration
    let pauseDuration = state.pauseDuration;
    if (method.id === 'pomodoro' && state.currentCycle % 4 === 0) {
        pauseDuration = method.longPause || 15;
    }

    state.timerMode = 'pause';
    state.timeRemaining = pauseDuration * 60;
    state.totalTime = pauseDuration * 60;
    state.timerEndTime = null; // Reset pour le nouveau timer

    setupPauseView();
    showView('pause');
    startTimer();
}

function handlePauseComplete() {
    playNotificationSound();
    showVisualNotification();

    state.currentCycle++;
    state.timerMode = 'focus';
    state.timeRemaining = state.focusDuration * 60;
    state.totalTime = state.focusDuration * 60;
    state.timerEndTime = null; // Reset pour le nouveau timer

    setupSessionView();
    showView('session');
    startTimer();
}

// ========== PAUSE VIEW ==========
function setupPauseView() {
    updateTimerDisplay();
    // Reset pause icons state
    const pauseIcon = document.querySelector('#btn-pause-break .icon-pause');
    const playIcon = document.querySelector('#btn-pause-break .icon-play');
    if (pauseIcon && playIcon) {
        pauseIcon.style.display = 'inline';
        playIcon.style.display = 'none';
    }
}

function togglePauseBreak() {
    const pauseIcon = document.querySelector('#btn-pause-break .icon-pause');
    const playIcon = document.querySelector('#btn-pause-break .icon-play');

    if (state.timerState === 'running') {
        state.timerState = 'paused';
        clearInterval(state.timerInterval);
        state.timerEndTime = null; // Reset pour recalculer à la reprise
        pauseIcon.style.display = 'none';
        playIcon.style.display = 'inline';
    } else if (state.timerState === 'paused') {
        state.timerState = 'running';
        startTimer();
        pauseIcon.style.display = 'inline';
        playIcon.style.display = 'none';
    }
    saveState();
}

function initPauseView() {
    document.getElementById('btn-skip-pause').addEventListener('click', () => {
        clearInterval(state.timerInterval);
        handlePauseComplete();
    });

    document.getElementById('btn-pause-break').addEventListener('click', togglePauseBreak);
    document.getElementById('btn-stop-break').addEventListener('click', stopSession);
}

// ========== END VIEW ==========
function showEndView() {
    state.timerState = 'stopped';
    clearInterval(state.timerInterval);

    const focusTimeFormatted = formatDuration(state.totalFocusTime);
    document.getElementById('stat-focus-time').textContent = focusTimeFormatted;
    document.getElementById('stat-cycles').textContent = state.currentCycle;

    const method = state.selectedMethod;
    const taskRecap = document.getElementById('end-task-recap');

    if (method.taskType === 'checklist') {
        taskRecap.style.display = 'block';
        const completedTasks = state.tasks.filter(t => t.completed).length;
        document.getElementById('end-task-text').textContent =
            `${completedTasks}/${state.tasks.length} tâches complétées`;
    } else if (method.taskType === 'single') {
        taskRecap.style.display = 'block';
        document.getElementById('end-task-text').textContent = state.currentTask;
    } else {
        taskRecap.style.display = 'none';
    }

    clearSavedState();
    showView('end');
}

function initEndView() {
    document.getElementById('btn-new-session').addEventListener('click', () => {
        resetState();
        showView('dashboard');
    });

    document.getElementById('btn-same-method').addEventListener('click', () => {
        const methodId = state.selectedMethod.id;
        resetState();
        selectMethod(methodId);
    });
}

function resetState() {
    state = {
        currentView: 'dashboard',
        selectedMethod: null,
        focusDuration: 0,
        pauseDuration: 0,
        currentTask: '',
        tasks: [],
        currentCycle: 1,
        totalCycles: 1,
        timerState: 'stopped',
        timerMode: 'focus',
        timeRemaining: 0,
        totalTime: 0,
        timerInterval: null,
        totalFocusTime: 0
    };
    clearSavedState();
}

// ========== RESTORE SESSION ==========
function restoreSession() {
    const saved = loadState();
    if (saved) {
        state = { ...state, ...saved };
        state.selectedMethod = METHODS[saved.selectedMethod.id];

        if (state.timerMode === 'focus') {
            setupSessionView();
            showView('session');
        } else {
            setupPauseView();
            showView('pause');
        }

        if (state.timerState === 'running') {
            startTimer();
        } else if (state.timerState === 'paused') {
            // Mettre à jour les icônes selon la vue active
            if (state.timerMode === 'focus') {
                const pauseIcon = document.querySelector('#btn-pause .icon-pause');
                const playIcon = document.querySelector('#btn-pause .icon-play');
                if (pauseIcon && playIcon) {
                    pauseIcon.style.display = 'none';
                    playIcon.style.display = 'inline';
                }
            } else {
                const pauseIcon = document.querySelector('#btn-pause-break .icon-pause');
                const playIcon = document.querySelector('#btn-pause-break .icon-play');
                if (pauseIcon && playIcon) {
                    pauseIcon.style.display = 'none';
                    playIcon.style.display = 'inline';
                }
            }
        }

        updateTimerDisplay();
        return true;
    }
    return false;
}

// ========== INITIALIZATION ==========
function init() {
    // Demander la permission pour les notifications
    requestNotificationPermission();

    // Écouter les changements de visibilité de l'onglet
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Configurer la vérification en arrière-plan
    setupBackgroundCheck();

    initDashboard();
    initConfigView();
    initSessionView();
    initPauseView();
    initEndView();

    if (!restoreSession()) {
        showView('dashboard');
    }
}

document.addEventListener('DOMContentLoaded', init);
