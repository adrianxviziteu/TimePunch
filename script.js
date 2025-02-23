// Simulăm o bază de date simplă pentru utilizatori
const users = [
    { email: 'john@example.com', password: 'password123', name: 'John Doe' },
    { email: 'jane@example.com', password: 'password123', name: 'Jane Smith' }
];

// Starea aplicației
let currentUser = null;
let currentPunch = null;

// Adăugăm variabilele noi pentru timer
let workTimer = null;
let workStartTime = null;
let totalWorkTime = 0;
let isPunchedIn = false;

// Adăugăm weekDays în scopul global
const weekDays = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

// Elemente DOM
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const loginForm = document.getElementById('loginForm');
const userNameSpan = document.getElementById('userName');
const currentTimeSpan = document.getElementById('currentTime');
const mainPunchBtn = document.getElementById('mainPunchBtn');
const historyBody = document.getElementById('historyBody');
const logoutBtn = document.getElementById('logoutBtn');

// Adăugăm referința pentru noul buton și timer display
const pauseBtn = document.getElementById('pauseBtn');

// Adăugăm referințele pentru elementele de înregistrare
const registerContainer = document.getElementById('registerContainer');
const registerBtn = document.getElementById('registerBtn');
const registerForm = document.getElementById('registerForm');

// Adăugăm variabile pentru timerul de pauză
let pauseTimer = null;
let pauseStartTime = null;
let totalPauseTime = 0;
let isPaused = false;

// Adăugăm funcționalitatea de navigare
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

// Adăugăm variabile pentru timerul de pauză
let pauseTimeDisplay = '00:00:00';

// Funcții pentru gestionarea cache-ului concediilor
const LEAVES_CACHE_KEY = 'leaves_cache';
const LEAVES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore

function switchPage(pageId) {
    // Actualizăm butoanele de navigare
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    });

    // Actualizăm paginile
    pages.forEach(page => {
        page.classList.toggle('active', page.id === `${pageId}Page`);
    });

    // Reîncărcăm datele specifice paginii
    if (pageId === 'history') {
        loadUserHistory();
    } else if (pageId === 'leaves') {
        loadLeaveHistory();
    } else if (pageId === 'reports') {
        updateStatsDisplay();
    }
}

// Event listeners pentru navigare
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchPage(btn.dataset.page);
    });
});

// Funcții utilitare
function formatTime(date) {
    return date.toLocaleTimeString('ro-RO', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDate(date) {
    const weekDay = weekDays[date.getDay()];
    return `${weekDay}, ${date.toLocaleDateString('ro-RO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}`;
}

function calculateHours(startTime, endTime) {
    const diff = endTime - startTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

// Funcție pentru formatarea timpului în format HH:MM:SS
function formatTimer(milliseconds) {
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Funcție pentru actualizarea timerului
function updateWorkTimer() {
    if (!isPunchedIn || isPaused) return;
    
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - workStartTime - totalPauseTime;
    currentTimeSpan.textContent = formatTimer(elapsedTime);
}

// Funcție pentru a salva utilizatorii în localStorage
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

// Încărcăm utilizatorii existenți din localStorage
const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
users.push(...savedUsers);

// Adăugăm utilizatorul Adrian
if (!users.find(u => u.email === 'adriannviziteu@icloud.com')) {
    users.push({
        email: 'adriannviziteu@icloud.com',
        password: 'Basarabia9',
        name: 'Adrian'
    });
    saveUsers();
}

// Adăugăm funcții pentru gestionarea sesiunii
function saveSession(user) {
    localStorage.setItem('currentSession', JSON.stringify({
        user: user,
        timestamp: new Date().getTime()
    }));
}

function loadSession() {
    const session = localStorage.getItem('currentSession');
    if (session) {
        const { user, timestamp } = JSON.parse(session);
        // Verificăm dacă sesiunea nu este mai veche de 30 de zile
        if (new Date().getTime() - timestamp < 30 * 24 * 60 * 60 * 1000) {
            return user;
        } else {
            localStorage.removeItem('currentSession');
        }
    }
    return null;
}

function clearSession() {
    localStorage.removeItem('currentSession');
}

// Modificăm HTML-ul pentru a adăuga afișajul timpului de pauză
function addPauseTimeDisplay() {
    const timeDisplay = document.querySelector('.time-display');
    if (!document.getElementById('pauseTime')) {
        const pauseDisplay = document.createElement('div');
        pauseDisplay.className = 'pause-time';
        pauseDisplay.innerHTML = `
            <span class="pause-label">Timp pauză:</span>
            <span id="pauseTime">00:00:00</span>
        `;
        timeDisplay.appendChild(pauseDisplay);
    }
}

// Adăugăm funcția pentru actualizarea timerului de pauză
function updatePauseTimer() {
    console.log('updatePauseTimer called', { isPaused, pauseStartTime, totalPauseTime }); // Debug
    
    if (!isPaused || !pauseStartTime) return;
    
    const currentTime = new Date().getTime();
    const currentPauseDuration = currentTime - pauseStartTime;
    const totalPauseDisplay = formatTimer(totalPauseTime + currentPauseDuration);
    
    const pauseTimeElement = document.getElementById('pauseTime');
    if (pauseTimeElement) {
        pauseTimeElement.textContent = totalPauseDisplay;
    }
}

// Adăugăm funcționalitatea butonului de pauză
pauseBtn.addEventListener('click', () => {
    console.log('Pause button clicked', { isPunchedIn, isPaused }); // Debug
    
    if (!isPunchedIn) return;
    
    if (!isPaused) {
        // Începem pauza
        isPaused = true;
        pauseStartTime = new Date().getTime();
        
        // Oprim timerul de lucru
        if (workTimer) {
            clearInterval(workTimer);
            workTimer = null;
        }
        
        // Pornim timerul de pauză
        if (!pauseTimer) {
            pauseTimer = setInterval(updatePauseTimer, 1000);
        }
        
        // Actualizăm UI
        pauseBtn.textContent = 'Continuă Lucrul';
        pauseBtn.classList.add('active');
        
        console.log('Started pause', { pauseStartTime, totalPauseTime }); // Debug
    } else {
        // Terminăm pauza
        isPaused = false;
        const pauseEndTime = new Date().getTime();
        const pauseDuration = pauseEndTime - pauseStartTime;
        totalPauseTime += pauseDuration;
        pauseStartTime = null;
        
        // Oprim timerul de pauză
        if (pauseTimer) {
            clearInterval(pauseTimer);
            pauseTimer = null;
        }
        
        // Pornim timerul de lucru
        if (!workTimer) {
            workTimer = setInterval(updateWorkTimer, 1000);
        }
        
        // Actualizăm UI
        pauseBtn.textContent = 'Pauză';
        pauseBtn.classList.remove('active');
        document.getElementById('pauseTime').textContent = formatTimer(totalPauseTime);
        
        console.log('Ended pause', { totalPauseTime }); // Debug
    }
    
    // Actualizăm starea în currentPunch
    if (currentPunch) {
        if (!currentPunch.pauses) {
            currentPunch.pauses = [];
        }
        
        if (isPaused) {
            currentPunch.pauses.push({
                startTime: new Date().toISOString(),
                endTime: null
            });
        } else if (currentPunch.pauses.length > 0) {
            currentPunch.pauses[currentPunch.pauses.length - 1].endTime = new Date().toISOString();
            currentPunch.totalPauseTime = totalPauseTime;
        }
    }
    
    // Salvăm starea
    saveTimerState();
});

// Adăugăm funcții pentru salvarea și restaurarea stării
function saveTimerState() {
    if (currentUser && isPunchedIn) {
        const timerState = {
            isPunchedIn,
            workStartTime,
            totalPauseTime,
            isPaused,
            pauseStartTime,
            currentPunch
        };
        localStorage.setItem(`timerState_${currentUser.email}`, JSON.stringify(timerState));
    }
}

function restoreTimerState() {
    if (currentUser) {
        const savedState = localStorage.getItem(`timerState_${currentUser.email}`);
        if (savedState) {
            const state = JSON.parse(savedState);
            isPunchedIn = state.isPunchedIn;
            workStartTime = state.workStartTime;
            totalPauseTime = state.totalPauseTime || 0;
            isPaused = state.isPaused;
            pauseStartTime = state.pauseStartTime;
            currentPunch = state.currentPunch;

            if (isPunchedIn) {
                // Restaurăm UI-ul
                mainPunchBtn.textContent = 'Încheie ziua de lucru';
                mainPunchBtn.classList.remove('start');
                mainPunchBtn.classList.add('end');
                pauseBtn.disabled = false;

                // Restaurăm timerul
                if (!isPaused) {
                    workTimer = setInterval(updateWorkTimer, 1000);
                } else {
                    pauseBtn.textContent = 'Continuă Lucrul';
                    pauseBtn.classList.add('active');
                    pauseTimer = setInterval(updatePauseTimer, 1000);
                }

                // Adăugăm afișajul de pauză
                addPauseTimeDisplay();
                document.getElementById('pauseTime').textContent = formatTimer(totalPauseTime);
            }
        }
    }
}

// Funcție pentru a obține inițialele
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Modificăm funcția handleLogin pentru a adăuga avatarul
function handleLogin(user) {
    currentUser = user;
    saveSession(user);
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    
    // Creăm și adăugăm avatarul
    const userInfo = document.querySelector('.user-info');
    const existingAvatar = userInfo.querySelector('.user-avatar');
    if (!existingAvatar) {
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.textContent = getInitials(user.name);
        userInfo.insertBefore(avatar, userInfo.firstChild);
    } else {
        existingAvatar.textContent = getInitials(user.name);
    }
    
    userNameSpan.textContent = user.name;
    
    addPauseTimeDisplay();
    pauseBtn.disabled = true;
    
    loadUserHistory();
    loadLeaveHistory();
    switchPage('timesheet');
    
    // Restaurăm starea timerului
    restoreTimerState();
}

// Actualizăm event listener-ul pentru login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const currentUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const user = [...users, ...currentUsers].find(u => u.email === email && u.password === password);
    
    if (user) {
        handleLogin(user);
    } else {
        alert('Email sau parolă incorectă!');
    }
});

// Actualizăm verificarea sesiunii la încărcarea paginii
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = loadSession();
    if (savedUser) {
        handleLogin(savedUser);
    }
    mainPunchBtn.classList.add('start');
});

// Event listener pentru butonul de înregistrare
registerBtn.addEventListener('click', () => {
    loginContainer.classList.add('hidden');
    registerContainer.classList.remove('hidden');
});

// Modificăm funcția de înregistrare cu validări suplimentare
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('registerFirstName').value.trim();
    const lastName = document.getElementById('registerLastName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validări
    if (!firstName || !lastName) {
        alert('Vă rugăm să completați numele și prenumele!');
        return;
    }

    if (!validateEmail(email)) {
        alert('Vă rugăm să introduceți o adresă de email validă!');
        return;
    }

    if (!validatePhone(phone)) {
        alert('Vă rugăm să introduceți un număr de telefon valid!');
        return;
    }

    if (password.length < 6) {
        alert('Parola trebuie să conțină cel puțin 6 caractere!');
        return;
    }

    if (password !== confirmPassword) {
        alert('Parolele nu coincid!');
        return;
    }

    if (users.find(u => u.email === email)) {
        alert('Există deja un cont cu acest email!');
        return;
    }

    const newUser = {
        email,
        password,
        name: `${firstName} ${lastName}`,
        phone,
        firstName,  // Salvăm și individual pentru utilizare ulterioară
        lastName
    };

    users.push(newUser);
    saveUsers();
    
    // Autologin după înregistrare
    handleLogin(newUser);
    registerContainer.classList.add('hidden');
    registerForm.reset();
});

// Funcții helper pentru validare
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    // Acceptă formate: +40123456789, 0123456789, etc.
    const re = /^(\+4|0)?[0-9]{9,10}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Adăugăm validare în timp real pentru câmpuri
document.getElementById('registerPhone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, ''); // Păstrăm doar cifrele
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    e.target.value = value;
});

document.getElementById('registerEmail').addEventListener('blur', function(e) {
    if (!validateEmail(e.target.value.trim())) {
        e.target.style.borderColor = 'var(--danger)';
    } else {
        e.target.style.borderColor = 'var(--primary)';
    }
});

// Adăugăm validare pentru parola în timp real
document.getElementById('registerPassword').addEventListener('input', function(e) {
    const strengthIndicator = this.nextElementSibling;
    if (!strengthIndicator) {
        const indicator = document.createElement('div');
        indicator.className = 'password-strength';
        this.parentNode.appendChild(indicator);
    }
    
    if (e.target.value.length < 6) {
        strengthIndicator.style.color = 'var(--danger)';
        strengthIndicator.textContent = 'Parola trebuie să aibă minim 6 caractere';
    } else {
        strengthIndicator.style.color = 'var(--success)';
        strengthIndicator.textContent = 'Parola este suficient de puternică';
    }
});

// Adăugăm butonul de înapoi la login
document.getElementById('backToLoginBtn').addEventListener('click', () => {
    registerContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
});

// Modificăm funcția de start pontaj
mainPunchBtn.addEventListener('click', () => {
    if (!isPunchedIn) {
        // Start pontare
        isPunchedIn = true;
        workStartTime = new Date().getTime();
        totalPauseTime = 0;
        isPaused = false;
        pauseStartTime = null;
        
        // Inițializăm pontarea curentă
        currentPunch = {
            date: new Date().toISOString().split('T')[0],
            startTime: new Date().toISOString(),
            endTime: null,
            pauses: [],
            totalPauseTime: 0
        };
        
        // Curățăm orice timer existent
        if (workTimer) clearInterval(workTimer);
        if (pauseTimer) clearInterval(pauseTimer);
        
        // Pornim timerul de lucru
        workTimer = setInterval(updateWorkTimer, 1000);
        
        // Actualizăm UI-ul
        mainPunchBtn.textContent = 'Încheie ziua de lucru';
        mainPunchBtn.classList.remove('start');
        mainPunchBtn.classList.add('end');
        
        // Activăm butonul de pauză
        pauseBtn.disabled = false;
        pauseBtn.textContent = 'Pauză';
        pauseBtn.classList.remove('active');
        
        // Salvăm în localStorage
        const userPunches = JSON.parse(localStorage.getItem(`punches_${currentUser.email}`) || '[]');
        userPunches.push(currentPunch);
        localStorage.setItem(`punches_${currentUser.email}`, JSON.stringify(userPunches));
        
        // Actualizăm istoricul și salvăm starea
        loadUserHistory();
        saveTimerState();
    } else {
        // End pontare
        isPunchedIn = false;
        
        // Oprim ambele timere
        if (workTimer) {
            clearInterval(workTimer);
            workTimer = null;
        }
        if (pauseTimer) {
            clearInterval(pauseTimer);
            pauseTimer = null;
        }
        
        // Calculăm timpul total
        const endTime = new Date();
        currentPunch.endTime = endTime.toISOString();
        currentPunch.totalWorkTime = endTime.getTime() - workStartTime - totalPauseTime;
        
        // Actualizăm UI-ul
        mainPunchBtn.textContent = 'Începe ziua de lucru';
        mainPunchBtn.classList.remove('end');
        mainPunchBtn.classList.add('start');
        currentTimeSpan.textContent = '00:00:00';
        document.getElementById('pauseTime').textContent = '00:00:00';
        
        // Dezactivăm butonul de pauză
        pauseBtn.disabled = true;
        pauseBtn.textContent = 'Pauză';
        pauseBtn.classList.remove('active');
        
        // Resetăm toate variabilele
        workStartTime = null;
        totalPauseTime = 0;
        isPaused = false;
        pauseStartTime = null;
        
        // Salvăm în localStorage
        const userPunches = JSON.parse(localStorage.getItem(`punches_${currentUser.email}`) || '[]');
        if (userPunches.length > 0) {
            userPunches[userPunches.length - 1] = currentPunch;
            localStorage.setItem(`punches_${currentUser.email}`, JSON.stringify(userPunches));
        }
        
        // Resetăm pontarea curentă și actualizăm istoricul
        currentPunch = null;
        loadUserHistory();
        
        // Ștergem starea salvată
        localStorage.removeItem(`timerState_${currentUser.email}`);
    }
});

// Funcții pentru filtrarea datelor după perioadă
function filterDataByDateRange(data, startDate, endDate) {
    if (!startDate && !endDate) return data;
    
    return data.filter(item => {
        const itemDate = new Date(item.date);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        // Setăm ora la 00:00:00 pentru o comparație corectă
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        itemDate.setHours(0, 0, 0, 0);
        
        return itemDate >= start && itemDate <= end;
    });
}

// Modificăm funcția loadUserHistory pentru a include filtrarea
function loadUserHistory(startDate = null, endDate = null) {
    const userPunches = JSON.parse(localStorage.getItem(`punches_${currentUser.email}`) || '[]');
    const filteredPunches = filterDataByDateRange(userPunches, startDate, endDate);
    
    historyBody.innerHTML = '';
    
    filteredPunches.reverse().forEach(punch => {
        try {
            const punchDate = new Date(punch.date);
            const startTime = new Date(punch.startTime);
            const endTime = punch.endTime ? new Date(punch.endTime) : null;
            const totalPauseDisplay = punch.totalPauseTime ? formatTimer(punch.totalPauseTime) : '00:00:00';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="date-cell">
                        <span class="weekday">${weekDays[punchDate.getDay()]}</span>
                        <span class="full-date">${punchDate.toLocaleDateString('ro-RO', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</span>
                    </div>
                </td>
                <td>${formatTime(startTime)}</td>
                <td>${endTime ? formatTime(endTime) : '-'}</td>
                <td>${punch.totalWorkTime ? formatTimer(punch.totalWorkTime) : '-'}</td>
                <td class="pause-column">${totalPauseDisplay}</td>
            `;
            historyBody.appendChild(row);
        } catch (error) {
            console.error('Eroare la procesarea pontării:', error);
        }
    });
}

// Modificăm funcția de logout pentru a curăța și timerul de pauză
logoutBtn.addEventListener('click', () => {
    clearInterval(workTimer);
    clearInterval(pauseTimer);
    workTimer = null;
    pauseTimer = null;
    workStartTime = null;
    currentUser = null;
    currentPunch = null;
    isPunchedIn = false;
    clearSession();
    
    mainPunchBtn.textContent = 'Începe ziua de lucru';
    mainPunchBtn.classList.remove('end');
    mainPunchBtn.classList.add('start');
    
    loginContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    loginForm.reset();
    currentTimeSpan.textContent = '00:00:00';
    
    // Ștergem starea salvată
    if (currentUser) {
        localStorage.removeItem(`timerState_${currentUser.email}`);
    }
    
    // Curățăm cache-ul de concedii
    localStorage.removeItem(`${LEAVES_CACHE_KEY}_${currentUser.email}`);
});

// Adăugăm funcții pentru gestionarea concediilor
function saveLeavesRequest(request) {
    // Salvăm în localStorage
    const leaves = JSON.parse(localStorage.getItem(`leaves_${currentUser.email}`) || '[]');
    leaves.push(request);
    localStorage.setItem(`leaves_${currentUser.email}`, JSON.stringify(leaves));

    // Actualizăm cache-ul
    const cache = {
        timestamp: new Date().getTime(),
        data: leaves
    };
    localStorage.setItem(`${LEAVES_CACHE_KEY}_${currentUser.email}`, JSON.stringify(cache));
}

function getLeaves() {
    // Verificăm mai întâi cache-ul
    const cachedData = localStorage.getItem(`${LEAVES_CACHE_KEY}_${currentUser.email}`);
    if (cachedData) {
        const cache = JSON.parse(cachedData);
        const now = new Date().getTime();
        
        // Verificăm dacă cache-ul este încă valid
        if (now - cache.timestamp < LEAVES_CACHE_DURATION) {
            return cache.data;
        }
    }
    
    // Dacă nu avem cache valid, luăm datele din localStorage
    const leaves = JSON.parse(localStorage.getItem(`leaves_${currentUser.email}`) || '[]');
    
    // Actualizăm cache-ul
    const cache = {
        timestamp: new Date().getTime(),
        data: leaves
    };
    localStorage.setItem(`${LEAVES_CACHE_KEY}_${currentUser.email}`, JSON.stringify(cache));
    
    return leaves;
}

function calculateDays(start, end) {
    const oneDay = 24 * 60 * 60 * 1000;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffDays = Math.round(Math.abs((startDate - endDate) / oneDay)) + 1;
    return diffDays;
}

// Event listener pentru formularul de concediu
const leaveRequestForm = document.getElementById('leaveRequestForm');
const leaveHistoryBody = document.getElementById('leaveHistoryBody');

// Adăugăm logica pentru afișarea/ascunderea câmpului de motiv
document.getElementById('leaveType').addEventListener('change', function() {
    const reasonGroup = document.getElementById('reasonGroup');
    reasonGroup.style.display = this.value === 'other' ? 'block' : 'none';
});

// Modificăm event listener-ul pentru formularul de concediu
leaveRequestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const leaveType = document.getElementById('leaveType').value;
    const leaveRequest = {
        id: Date.now(),
        type: leaveType,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        reason: leaveType === 'other' ? document.getElementById('leaveReason').value : '',
        status: 'pending',
        submitDate: new Date().toISOString()
    };
    
    const errors = validateLeaveRequest(leaveRequest);
    if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
    }
    
    saveLeavesRequest(leaveRequest);
    loadLeaveHistory();
    leaveRequestForm.reset();
    document.getElementById('reasonGroup').style.display = 'none';
});

// Modificăm funcția loadLeaveHistory pentru a folosi cache-ul
function loadLeaveHistory() {
    const leaves = getLeaves();
    leaveHistoryBody.innerHTML = '';
    
    leaves.reverse().forEach(leave => {
        const days = calculateDays(leave.startDate, leave.endDate);
        const row = document.createElement('tr');
        
        const leaveTypes = {
            holiday: 'Concediu de Odihnă',
            medical: 'Concediu Medical',
            unpaid: 'Concediu fără Plată',
            other: `Alt tip${leave.reason ? ': ' + leave.reason : ''}`
        };
        
        row.innerHTML = `
            <td>${leaveTypes[leave.type]}</td>
            <td>
                <div class="date-range">
                    <div>${new Date(leave.startDate).toLocaleDateString('ro-RO')}</div>
                    <div>${new Date(leave.endDate).toLocaleDateString('ro-RO')}</div>
                </div>
            </td>
            <td>${days} zile</td>
            <td><span class="status-badge status-${leave.status}">${
                leave.status === 'pending' ? 'În așteptare' :
                leave.status === 'approved' ? 'Aprobat' :
                'Respins'
            }</span></td>
            <td>
                <div class="leave-actions">
                    ${leave.status === 'pending' ? `
                        <button class="action-btn" onclick="cancelLeave(${leave.id})">Anulează</button>
                    ` : ''}
                </div>
            </td>
        `;
        
        leaveHistoryBody.appendChild(row);
    });
}

function cancelLeave(leaveId) {
    const leaves = getLeaves().filter(leave => leave.id !== leaveId);
    
    // Actualizăm localStorage
    localStorage.setItem(`leaves_${currentUser.email}`, JSON.stringify(leaves));
    
    // Actualizăm cache-ul
    const cache = {
        timestamp: new Date().getTime(),
        data: leaves
    };
    localStorage.setItem(`${LEAVES_CACHE_KEY}_${currentUser.email}`, JSON.stringify(cache));
    
    loadLeaveHistory();
}

// Adăugăm stiluri pentru afișajul timpului de pauză
const style = document.createElement('style');
style.textContent = `
    .pause-time {
        font-size: 1.5rem;
        color: var(--warning);
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    
    .pause-label {
        font-size: 1rem;
        color: var(--secondary);
    }
    
    #pauseTime {
        font-weight: 600;
    }

    .pause-column {
        color: var(--warning);
        font-weight: 500;
        font-family: 'SF Mono', monospace;
    }
`;
document.head.appendChild(style);

// Adăugăm un event listener pentru beforeunload pentru a salva starea
window.addEventListener('beforeunload', () => {
    if (currentUser && isPunchedIn) {
        saveTimerState();
    }
});

// Funcție pentru descărcarea Excel-ului
function downloadExcel() {
    const userPunches = JSON.parse(localStorage.getItem(`punches_${currentUser.email}`) || '[]');
    
    // Creăm datele pentru Excel
    let excelData = [
        ['Data', 'Zi', 'Ora Început', 'Ora Sfârșit', 'Timp Total', 'Timp Pauză']
    ];
    
    userPunches.forEach(punch => {
        const punchDate = new Date(punch.date);
        const startTime = new Date(punch.startTime);
        const endTime = punch.endTime ? new Date(punch.endTime) : null;
        
        excelData.push([
            punchDate.toLocaleDateString('ro-RO'),
            weekDays[punchDate.getDay()],
            formatTime(startTime),
            endTime ? formatTime(endTime) : '-',
            punch.totalWorkTime ? formatTimer(punch.totalWorkTime) : '-',
            punch.totalPauseTime ? formatTimer(punch.totalPauseTime) : '00:00:00'
        ]);
    });
    
    // Convertim datele în format CSV
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    excelData.forEach(row => {
        csvContent += row.join(';') + '\n';
    });
    
    // Creăm link-ul de download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pontaj_${currentUser.name}_${new Date().toLocaleDateString('ro-RO')}.csv`);
    document.body.appendChild(link);
    
    // Simulăm click-ul
    link.click();
    
    // Curățăm DOM-ul
    document.body.removeChild(link);
}

// Adăugăm event listener pentru butonul de download
document.getElementById('downloadExcel').addEventListener('click', downloadExcel);

function generateWorkStats() {
    const userPunches = JSON.parse(localStorage.getItem(`punches_${currentUser.email}`) || '[]');
    
    const stats = {
        totalWorkDays: 0,
        totalWorkHours: 0,
        averageWorkHours: 0,
        totalPauseTime: 0,
        averagePauseTime: 0,
        mostFrequentStartTime: '',
        mostFrequentEndTime: ''
    };
    
    // Calculăm statisticile
    userPunches.forEach(punch => {
        if (punch.endTime) {
            stats.totalWorkDays++;
            stats.totalWorkHours += punch.totalWorkTime || 0;
            stats.totalPauseTime += punch.totalPauseTime || 0;
        }
    });
    
    stats.averageWorkHours = stats.totalWorkHours / (stats.totalWorkDays || 1);
    stats.averagePauseTime = stats.totalPauseTime / (stats.totalWorkDays || 1);
    
    return stats;
}

function setupNotifications() {
    // Verificăm dacă browserul suportă notificări
    if (!("Notification" in window)) return;
    
    Notification.requestPermission();
    
    // Notificare pentru pauză după 4 ore de lucru
    setInterval(() => {
        if (isPunchedIn && !isPaused) {
            const currentTime = new Date().getTime();
            const workTime = currentTime - workStartTime - totalPauseTime;
            
            if (workTime > 4 * 60 * 60 * 1000) { // 4 ore
                new Notification("TimePunch", {
                    body: "Ai lucrat 4 ore. Este timpul pentru o pauză!",
                    icon: "/icon.png"
                });
            }
        }
    }, 5 * 60 * 1000); // Verifică la fiecare 5 minute
}

function syncWithServer() {
    const data = {
        punches: localStorage.getItem(`punches_${currentUser.email}`),
        leaves: localStorage.getItem(`leaves_${currentUser.email}`),
        timerState: localStorage.getItem(`timerState_${currentUser.email}`)
    };
    
    // Aici ar veni codul pentru sincronizare cu un server
    console.log('Sincronizare cu serverul...', data);
}

function exportData(format = 'csv') {
    const userPunches = JSON.parse(localStorage.getItem(`punches_${currentUser.email}`) || '[]');
    
    switch(format) {
        case 'csv':
            return exportToCSV(userPunches);
        case 'pdf':
            return exportToPDF(userPunches);
        case 'json':
            return exportToJSON(userPunches);
    }
}

function exportToPDF(data) {
    // Aici ar veni logica pentru generare PDF
    console.log('Generare PDF...', data);
}

function autoBackup() {
    const backupData = {
        timestamp: new Date().getTime(),
        punches: localStorage.getItem(`punches_${currentUser.email}`),
        leaves: localStorage.getItem(`leaves_${currentUser.email}`),
        settings: localStorage.getItem(`settings_${currentUser.email}`)
    };
    
    localStorage.setItem(`backup_${currentUser.email}`, JSON.stringify(backupData));
}

// Rulăm backup-ul o dată pe zi
setInterval(autoBackup, 24 * 60 * 60 * 1000);

const defaultSettings = {
    notificationsEnabled: true,
    autoBackupEnabled: true,
    theme: 'dark',
    language: 'ro',
    workHoursPerDay: 8,
    minimumBreakTime: 30, // minute
    maximumWorkTime: 12 // ore
};

function saveSettings(settings) {
    localStorage.setItem(`settings_${currentUser.email}`, JSON.stringify({
        ...defaultSettings,
        ...settings
    }));
}

function loadSettings() {
    return JSON.parse(localStorage.getItem(`settings_${currentUser.email}`) || JSON.stringify(defaultSettings));
}

function validateLeaveRequest(request) {
    const errors = [];
    const settings = loadSettings();
    
    // Verificăm dacă există suprapuneri cu alte concedii
    const existingLeaves = getLeaves();
    const hasOverlap = existingLeaves.some(leave => {
        const existingStart = new Date(leave.startDate);
        const existingEnd = new Date(leave.endDate);
        const newStart = new Date(request.startDate);
        const newEnd = new Date(request.endDate);
        
        return (newStart <= existingEnd && newEnd >= existingStart);
    });
    
    if (hasOverlap) {
        errors.push('Există deja un concediu programat în această perioadă');
    }
    
    // Alte validări...
    
    return errors;
}

// Modificăm funcția updateStatsDisplay pentru a include filtrarea
function updateStatsDisplay(startDate = null, endDate = null) {
    const userPunches = JSON.parse(localStorage.getItem(`punches_${currentUser.email}`) || '[]');
    const filteredPunches = filterDataByDateRange(userPunches, startDate, endDate);
    
    const stats = {
        totalWorkDays: 0,
        totalWorkHours: 0,
        totalPauseTime: 0
    };
    
    filteredPunches.forEach(punch => {
        if (punch.endTime) {
            stats.totalWorkDays++;
            stats.totalWorkHours += punch.totalWorkTime || 0;
            stats.totalPauseTime += punch.totalPauseTime || 0;
        }
    });
    
    stats.averageWorkHours = stats.totalWorkDays > 0 ? 
        stats.totalWorkHours / stats.totalWorkDays : 0;
    
    document.getElementById('totalWorkDays').textContent = stats.totalWorkDays;
    document.getElementById('totalWorkHours').textContent = formatTimer(stats.totalWorkHours);
    document.getElementById('averageWorkHours').textContent = formatTimer(stats.averageWorkHours);
    document.getElementById('totalPauseTime').textContent = formatTimer(stats.totalPauseTime);
}

// Adăugăm event listeners pentru filtre
document.getElementById('applyHistoryFilter').addEventListener('click', () => {
    const startDate = document.getElementById('historyStartDate').value;
    const endDate = document.getElementById('historyEndDate').value;
    loadUserHistory(startDate, endDate);
});

document.getElementById('applyReportsFilter').addEventListener('click', () => {
    const startDate = document.getElementById('reportsStartDate').value;
    const endDate = document.getElementById('reportsEndDate').value;
    updateStatsDisplay(startDate, endDate);
});

// Inițializăm datele cu luna curentă
function setCurrentMonthDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const formatDate = date => date.toISOString().split('T')[0];
    
    ['history', 'reports'].forEach(section => {
        document.getElementById(`${section}StartDate`).value = formatDate(firstDay);
        document.getElementById(`${section}EndDate`).value = formatDate(lastDay);
    });
}

// Apelăm funcția la încărcarea paginii
setCurrentMonthDates(); 