const root = document.getElementById('root');
const stage = document.getElementById('stage');
const card = document.getElementById('instruction');
const toast = document.getElementById('toast');
const hint = document.getElementById('hint');
const sound = document.getElementById('sound');

let scene = 0;
let pass = '';
let audio = false;
let advancing = false;

const name = 'YOU';
const birthdayCode = '30072008';
const acceptedCodes = new Set([birthdayCode, '300708', '3007']);
const copy = [
  'Slowly pull the drifting crate into the glowing shore circle.',
  'Tap the brass latch.',
  'Drag to rotate and inspect the chest, then tap it open.',
  'Enter 30-07-2008 as 30072008. Use delete if you mistype.',
  'Peel the wax seal from the velvet envelope.',
  'Drag downward to unfold the handwritten letter.',
  'Tap the paper crane and follow its flight.',
  'Tap the boy until he leaves the panel.',
  `Watch the stars gather into HAPPY BIRTHDAY, ${name}.`,
];

function say(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toast.hideTimer);
  toast.hideTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function make(tag, cls, html = '') {
  const node = document.createElement(tag);
  node.className = cls;
  node.innerHTML = html;
  root.appendChild(node);
  return node;
}

function clearScene() {
  root.innerHTML = '';
  root.className = '';
  stage.className = 'stage';
  stage.style.background = '';
  advancing = false;
}

function next(delay = 0) {
  if (advancing) return;
  advancing = true;
  setTimeout(() => {
    scene += 1;
    render();
  }, delay);
}

function render() {
  clearScene();
  card.textContent = copy[scene];
  [ocean, latch, inspect, safe, seal, letter, crane, duo, stars][scene]();
}

function getPoint(event) {
  return { x: event.clientX, y: event.clientY };
}

function ocean() {
  const target = make('div', 'drop-target', 'shore');
  const crate = make('div', 'obj crate');
  make('button', 'egg pen').dataset.msg = 'A forgotten pen has already written the ending.';

  const state = { x: 0, y: 0, startX: 0, startY: 0, pointerX: 0, pointerY: 0, settled: false };

  function place() {
    crate.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${8 + state.x / 35}deg)`;
    const closeness = Math.min(1, Math.hypot(state.x + 118, state.y - 62) / 190);
    target.style.setProperty('--pulse', String(1 - closeness));
  }

  function settleIntoShore() {
    state.settled = true;
    crate.classList.add('settling');
    crate.style.transform = 'translate3d(-118px, 62px, 0) rotate(-3deg)';
    target.classList.add('complete');
    say('The tide lets go.');
    next(1200);
  }

  crate.addEventListener('pointerdown', (event) => {
    if (state.settled) return;
    crate.setPointerCapture(event.pointerId);
    crate.classList.add('dragging');
    const point = getPoint(event);
    state.pointerX = point.x;
    state.pointerY = point.y;
    state.startX = state.x;
    state.startY = state.y;
  });

  crate.addEventListener('pointermove', (event) => {
    if (!crate.hasPointerCapture(event.pointerId) || state.settled) return;
    const point = getPoint(event);
    const dx = point.x - state.pointerX;
    const dy = point.y - state.pointerY;
    state.x = state.startX + dx * 0.82;
    state.y = state.startY + dy * 0.82;
    place();
    if (state.x < -86 && state.y > 34) settleIntoShore();
  });

  crate.addEventListener('pointerup', (event) => {
    if (crate.hasPointerCapture(event.pointerId)) crate.releasePointerCapture(event.pointerId);
    crate.classList.remove('dragging');
    if (!state.settled) {
      state.x *= 0.82;
      state.y *= 0.82;
      crate.classList.add('settling');
      place();
      setTimeout(() => crate.classList.remove('settling'), 500);
    }
  });
}

function latch() {
  const chest = make('div', 'obj chest', '<div class="latch"></div>');
  make('button', 'egg ticket').dataset.msg = 'An old bus ticket: one way to a better year.';
  chest.onclick = () => {
    chest.classList.add('open');
    flash();
    next(900);
  };
}

function inspect() {
  let rotation = 0;
  let opened = false;
  const chest = make('div', 'obj chest', '<div class="latch"></div>');
  chest.addEventListener('pointerdown', (event) => {
    chest.setPointerCapture(event.pointerId);
    const start = event.clientX;
    chest.onpointermove = (moveEvent) => {
      rotation = Math.max(-28, Math.min(28, (moveEvent.clientX - start) / 3));
      chest.style.transform = `translateX(-50%) rotateY(${rotation}deg) rotate(${rotation / 8}deg)`;
    };
  });
  chest.addEventListener('pointerup', (event) => {
    if (chest.hasPointerCapture(event.pointerId)) chest.releasePointerCapture(event.pointerId);
    chest.onpointermove = null;
  });
  chest.onclick = () => {
    if (Math.abs(rotation) > 8 && !opened) {
      opened = true;
      chest.classList.add('open');
      next(800);
    } else {
      say('Let the chest catch the moonlight first.');
    }
  };
}

function safe() {
  pass = '';
  const safeBox = make('div', 'obj safe', '<div class="dial"></div><div class="display">30-07-2008</div><div class="typed" aria-live="polite">________</div><div class="keypad"></div>');
  const pad = safeBox.querySelector('.keypad');
  const typed = safeBox.querySelector('.typed');

  function update() {
    typed.textContent = pass.padEnd(8, '_');
    typed.classList.toggle('error', pass.length === 8 && !acceptedCodes.has(pass));
  }

  function submitIfReady() {
    if (acceptedCodes.has(pass)) {
      typed.textContent = 'OPEN';
      typed.classList.remove('error');
      flash();
      say('The old lock remembers the date.');
      next(850);
    } else if (pass.length >= 8) {
      say('Use 30072008 for 30-07-2008. Tap delete to fix it.');
    }
  }

  ['1','2','3','4','5','6','7','8','9','del','0','ok'].forEach((key) => {
    const button = document.createElement('button');
    button.textContent = key === 'del' ? '⌫' : key.toUpperCase();
    button.className = key === 'del' ? 'wide-action' : '';
    button.onclick = () => {
      if (key === 'del') {
        pass = pass.slice(0, -1);
      } else if (key === 'ok') {
        submitIfReady();
        return;
      } else if (pass.length < 8) {
        pass += key;
      }
      tone();
      update();
      submitIfReady();
    };
    pad.appendChild(button);
  });
  update();
}

function seal() {
  const envelope = make('div', 'obj envelope', '<div class="seal"></div>');
  const sealNode = envelope.querySelector('.seal');
  let sx = 0;
  let sy = 0;
  sealNode.addEventListener('pointerdown', (event) => {
    sealNode.setPointerCapture(event.pointerId);
    sx = event.clientX;
    sy = event.clientY;
  });
  sealNode.addEventListener('pointermove', (event) => {
    if (!sealNode.hasPointerCapture(event.pointerId)) return;
    const dx = event.clientX - sx;
    const dy = event.clientY - sy;
    sealNode.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 6}deg)`;
    if (Math.hypot(dx, dy) > 90) {
      sealNode.style.transition = 'transform .6s ease';
      sealNode.style.transform = 'translate(120px,-90px) rotate(35deg) scale(.65)';
      next(700);
    }
  });
}

function letter() {
  const note = make('div', 'obj letter', 'Dear you,<br><br>May this year unfold like a secret page: quietly, bravely, and full of impossible light.');
  let startY = 0;
  note.addEventListener('pointerdown', (event) => {
    note.setPointerCapture(event.pointerId);
    startY = event.clientY;
  });
  note.addEventListener('pointermove', (event) => {
    if (!note.hasPointerCapture(event.pointerId)) return;
    const dy = Math.max(0, event.clientY - startY);
    note.style.transform = `translate(-50%, ${dy * 0.55}px) scaleY(${1 + dy / 520})`;
    if (dy > 115) next(800);
  });
}

function crane() {
  const bird = make('div', 'obj crane');
  bird.onclick = () => {
    bird.style.transition = 'transform 1.8s cubic-bezier(.2,.9,.2,1)';
    bird.style.transform = 'translate(120px,-360px) rotate(28deg)';
    next(1400);
  };
}

function duo() {
  stage.classList.add('duo');
  make('div', 'ground');
  make('div', 'person girl', '<i></i>');
  const boy = make('div', 'person boy');
  const tap = make('div', 'tap');
  const bouquet = make('div', 'bouquet');
  make('div', 'grenade');
  make('div', 'boom');
  let taps = 0;
  function advance() {
    taps += 1;
    boy.style.transform = `translateX(${taps * 58}px) rotate(${taps * 3}deg)`;
    if (taps === 1) say('The panel stretches with the silence.');
    if (taps >= 4) {
      root.classList.add('throw');
      setTimeout(() => root.classList.add('explode'), 1000);
      setTimeout(() => bouquet.classList.add('show'), 1550);
      next(3000);
    }
  }
  boy.onclick = advance;
  tap.onclick = advance;
}

function stars() {
  stage.style.background = '#08090f';
  const wrap = make('div', 'stars');
  for (let i = 0; i < 95; i += 1) {
    const star = document.createElement('i');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 2}s`;
    wrap.appendChild(star);
  }
  make('div', 'birthday', `HAPPY<br>BIRTHDAY<span>${name}</span>`);
}

function flash() {
  stage.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.7)' }, { filter: 'brightness(1)' }], { duration: 620, easing: 'ease-out' });
}

function tone() {
  if (!audio) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 220;
  gain.gain.setValueAtTime(0.04, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.13);
}

document.addEventListener('click', (event) => {
  const egg = event.target.closest('[data-msg]');
  if (egg) say(egg.dataset.msg);
});

hint.onclick = () => say(copy[scene]);
sound.onclick = (event) => {
  audio = !audio;
  event.target.textContent = `sound: ${audio ? 'on' : 'off'}`;
  tone();
};

render();
