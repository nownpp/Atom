// العناصر الرئيسية
const container = document.getElementById('atom-container');
const nucleus = document.getElementById('nucleus');
const orbits = Array.from(document.querySelectorAll('.orbit-path'));
const electrons = Array.from(document.querySelectorAll('.electron'));
const infoDiv = document.getElementById('info');
const energyIndicator = document.getElementById('energy-indicator');

// أحجام المدارات
const orbitRadii = [100, 150, 200, 250];
let center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let activeTouch = null;
let energyTransferInterval;
let currentEnergy = 0;

// تهيئة المواقع
function initPositions() {
    nucleus.style.left = `${center.x}px`;
    nucleus.style.top = `${center.y}px`;

    orbits.forEach(orbit => {
        orbit.style.left = `${center.x}px`;
        orbit.style.top = `${center.y}px`;
    });

    updateElectrons();
}

// حركة الإلكترونات
function updateElectrons() {
    electrons.forEach((electron) => {
        const level = parseInt(electron.getAttribute('data-level'));
        const speed = 0.0015 * (level + 0.5);
        let angle = parseFloat(electron.getAttribute('data-angle'));
        angle += speed;
        electron.setAttribute('data-angle', angle);

        const radius = orbitRadii[level - 1];
        const x = center.x + radius * Math.cos(angle);
        const y = center.y + radius * Math.sin(angle);

        electron.style.left = `${x}px`;
        electron.style.top = `${y}px`;
    });

    requestAnimationFrame(updateElectrons);
}

function createEnergyParticles(touchX, touchY, targetElectron) {
    const targetRect = targetElectron.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    for (let i = 0; i < 2; i++) {
        const particle = document.createElement('div');
        particle.className = 'energy-particle';

        const startX = touchX + (Math.random() * 30 - 15);
        const startY = touchY + (Math.random() * 30 - 15);

        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;

        const anim = particle.animate([
            { left: `${startX}px`, top: `${startY}px` },
            { left: `${targetX}px`, top: `${targetY}px` }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });

        container.appendChild(particle);

        anim.onfinish = () => {
            particle.remove();
            if (i === 0) {
                targetElectron.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    targetElectron.style.transform = 'scale(1)';
                }, 100);
            }
        };
    }
}

function startEnergyTransfer(x, y) {
    const closest = findClosestElectron(x, y);
    if (!closest) return;

    const { electron } = closest;
    if (parseInt(electron.getAttribute('data-level')) >= 4) {
        infoDiv.textContent = "هذا الإلكترون في أعلى مستوى طاقة!";
        return;
    }

    activeTouch = { x, y, electron };
    currentEnergy = 0;
    updateEnergyIndicator();

    energyTransferInterval = setInterval(() => {
        if (!activeTouch) return;

        createEnergyParticles(activeTouch.x, activeTouch.y, activeTouch.electron);
        currentEnergy += 3;
        updateEnergyIndicator();

        if (currentEnergy >= 100) {
            exciteElectron(activeTouch.electron);
            stopEnergyTransfer();
        }
    }, 100);
}

function exciteElectron(electron) {
    const currentLevel = parseInt(electron.getAttribute('data-level'));
    const newLevel = currentLevel + 1;

    electron.classList.add('excited');
    electron.setAttribute('data-level', newLevel);
    infoDiv.textContent = `تم إثارة الإلكترون إلى المستوى ${newLevel}!`;

    setTimeout(() => {
        returnElectronToOriginalLevel(electron, currentLevel);
    }, 3000);
}

function returnElectronToOriginalLevel(electron, originalLevel) {
    electron.classList.remove('excited');
    electron.setAttribute('data-level', originalLevel);
    createPhotonBeam(electron);
    infoDiv.textContent = `عاد الإلكترون إلى المستوى ${originalLevel}!`;
}

function createPhotonBeam(electron) {
    const rect = electron.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const angle = Math.random() * Math.PI * 2;
    const endX = startX + Math.cos(angle) * 60;
    const endY = startY + Math.sin(angle) * 60;

    const beam = document.createElement('div');
    beam.className = 'photon-beam';
    beam.style.left = `${startX}px`;
    beam.style.top = `${startY}px`;
    beam.style.transform = `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`;

    container.appendChild(beam);

    setTimeout(() => {
        beam.remove();
    }, 1200);
}

function findClosestElectron(x, y) {
    let closest = null;
    let minDistance = Infinity;

    electrons.forEach(electron => {
        const rect = electron.getBoundingClientRect();
        const elX = rect.left + rect.width / 2;
        const elY = rect.top + rect.height / 2;

        const distance = Math.sqrt(Math.pow(x - elX, 2) + Math.pow(y - elY, 2));
        const level = parseInt(electron.getAttribute('data-level'));
        const orbitRadius = orbitRadii[level - 1];

        if (distance < orbitRadius + 50 && distance > orbitRadius - 50) {
            if (distance < minDistance) {
                minDistance = distance;
                closest = { electron, distance };
            }
        }
    });

    return closest;
}

function updateEnergyIndicator() {
    energyIndicator.textContent = `الطاقة: ${Math.min(currentEnergy, 100)}%`;
}

function stopEnergyTransfer() {
    clearInterval(energyTransferInterval);
    activeTouch = null;
    currentEnergy = 0;
    updateEnergyIndicator();
}

container.addEventListener('mousedown', (e) => {
    startEnergyTransfer(e.clientX, e.clientY);
});

container.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        startEnergyTransfer(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false });

container.addEventListener('mouseup', stopEnergyTransfer);
container.addEventListener('mouseleave', stopEnergyTransfer);
container.addEventListener('touchend', stopEnergyTransfer);

window.onload = initPositions;
window.onresize = () => {
    center.x = window.innerWidth / 2;
    center.y = window.innerHeight / 2;
    initPositions();
};
