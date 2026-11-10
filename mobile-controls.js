/*
 * Additive mobile controls for Mech Battlegrounds.
 * Include this file after the existing game scripts:
 *   <script src="mobile-controls.js"></script>
 *
 * Does not replace or edit the game's existing input handlers. It forwards
 * touch joystick/actions as ordinary keyboard and mouse events so existing
 * controls remain available on desktop.
 */
(() => {
  'use strict';

  const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (!coarsePointer) return;

  const STYLE = `
    #mobileControls {
      position:fixed; inset:0; z-index:60; pointer-events:none;
      font-family:system-ui,sans-serif; touch-action:none;
    }
    body:not(.ingame) #mobileControls { display:none; }
    #mobileControls .mc-joystick {
      position:absolute; left:max(18px,env(safe-area-inset-left));
      bottom:max(22px,env(safe-area-inset-bottom)); width:138px;height:138px;
      border:1px solid rgba(59,232,255,.55);border-radius:50%;
      background:rgba(5,15,28,.46);box-shadow:inset 0 0 22px rgba(59,232,255,.12),0 0 18px rgba(59,232,255,.16);
      pointer-events:auto;touch-action:none;
    }
    #mobileControls .mc-stick {
      position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px;
      border:1px solid rgba(125,245,255,.85);border-radius:50%;
      background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.8),rgba(59,232,255,.48) 45%,rgba(12,75,105,.68));
      box-shadow:0 0 18px rgba(59,232,255,.4);will-change:transform;
    }
    #mobileControls .mc-actions {
      position:absolute;right:max(14px,env(safe-area-inset-right));
      bottom:max(18px,env(safe-area-inset-bottom));display:grid;
      grid-template-columns:repeat(2,70px);grid-template-rows:repeat(3,62px);gap:8px;
      pointer-events:auto;touch-action:none;
    }
    #mobileControls .mc-btn {
      min-width:62px;min-height:56px;padding:7px 4px;border:1px solid rgba(59,232,255,.55);
      border-radius:14px;background:rgba(5,15,28,.78);color:#e8faff;
      font:700 10px/1.1 system-ui,sans-serif;letter-spacing:.06em;text-align:center;
      box-shadow:0 0 14px rgba(59,232,255,.12);touch-action:none;user-select:none;
    }
    #mobileControls .mc-btn:active,#mobileControls .mc-btn.held {
      background:rgba(30,145,170,.8);border-color:#9af7ff;box-shadow:0 0 18px rgba(59,232,255,.45);
    }
    #mobileControls .mc-fire {grid-column:2;grid-row:2 / span 2;border-radius:50%;min-height:84px;align-self:center;color:#fff;background:rgba(150,35,45,.8);border-color:rgba(255,100,110,.75)}
    #mobileControls .mc-alt {grid-column:1;grid-row:2;border-color:rgba(255,90,168,.65)}
    #mobileControls .mc-jump {grid-column:2;grid-row:1}
    #mobileControls .mc-sprint {grid-column:1;grid-row:3}
    #mobileControls .mc-interact {grid-column:1;grid-row:1}
    @media (orientation:landscape) and (max-height:500px) {
      #mobileControls .mc-joystick {width:112px;height:112px;bottom:max(12px,env(safe-area-inset-bottom))}
      #mobileControls .mc-stick {width:48px;height:48px;margin:-24px}
      #mobileControls .mc-actions {grid-template-columns:repeat(2,60px);grid-template-rows:repeat(3,48px);gap:5px;bottom:max(10px,env(safe-area-inset-bottom))}
      #mobileControls .mc-btn {min-width:54px;min-height:44px;font-size:9px}
      #mobileControls .mc-fire {min-height:68px}
    }
  `;
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'mobileControls';
  root.innerHTML = `
    <div class="mc-joystick" role="application" aria-label="Movement joystick"><div class="mc-stick"></div></div>
    <div class="mc-actions" aria-label="Mobile game controls">
      <button class="mc-btn mc-interact" type="button" data-key="KeyE">TALK<br>E</button>
      <button class="mc-btn mc-jump" type="button" data-key="Space">JUMP<br>SPACE</button>
      <button class="mc-btn mc-alt" type="button" data-mouse="2">ALT<br>FIRE</button>
      <button class="mc-btn mc-sprint" type="button" data-key="ShiftLeft">SPRINT<br>HOLD</button>
      <button class="mc-btn mc-fire" type="button" data-mouse="0">FIRE<br>HOLD</button>
    </div>`;
  document.body.appendChild(root);

  const heldKeys = new Set();
  const keyInfo = {
    KeyW: ['w', 'KeyW'], KeyA: ['a', 'KeyA'], KeyS: ['s', 'KeyS'], KeyD: ['d', 'KeyD'],
    Space: [' ', 'Space'], ShiftLeft: ['Shift', 'ShiftLeft'], KeyE: ['e', 'KeyE']
  };
  function keyEvent(type, code) {
    const [key, eventCode] = keyInfo[code] || [code.replace(/^Key/, '').toLowerCase(), code];
    document.dispatchEvent(new KeyboardEvent(type, {key, code:eventCode, bubbles:true, cancelable:true}));
  }
  function setKey(code, down) {
    if (down && !heldKeys.has(code)) { heldKeys.add(code); keyEvent('keydown', code); }
    if (!down && heldKeys.has(code)) { heldKeys.delete(code); keyEvent('keyup', code); }
  }

  const joy = root.querySelector('.mc-joystick');
  const stick = root.querySelector('.mc-stick');
  let joyPointer = null;
  const JOY_RADIUS = 42;
  function updateJoystick(e) {
    const r = joy.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const length = Math.hypot(dx, dy);
    if (length > JOY_RADIUS) { dx *= JOY_RADIUS / length; dy *= JOY_RADIUS / length; }
    stick.style.transform = `translate(${dx}px,${dy}px)`;
    const nx = dx / JOY_RADIUS, ny = dy / JOY_RADIUS;
    // Convert each joystick direction into the same WASD key events the game already uses.
    setKey('KeyA', nx < -.22); setKey('KeyD', nx > .22);
    setKey('KeyW', ny < -.22); setKey('KeyS', ny > .22);
  }
  function resetJoystick() {
    joyPointer = null;
    stick.style.transform = 'translate(0,0)';
    ['KeyW','KeyA','KeyS','KeyD'].forEach(k => setKey(k, false));
  }
  joy.addEventListener('pointerdown', e => {
    if (joyPointer !== null) return;
    e.preventDefault(); joyPointer = e.pointerId;
    joy.setPointerCapture(e.pointerId); updateJoystick(e);
  });
  joy.addEventListener('pointermove', e => { if (e.pointerId === joyPointer) { e.preventDefault(); updateJoystick(e); } });
  joy.addEventListener('pointerup', e => { if (e.pointerId === joyPointer) resetJoystick(); });
  joy.addEventListener('pointercancel', resetJoystick);
  joy.addEventListener('lostpointercapture', resetJoystick);

  function mouseEvent(type, button) {
    const canvas = document.querySelector('#gameCanvas') || document;
    const evt = new MouseEvent(type, {button, bubbles:true, cancelable:true, view:window});
    canvas.dispatchEvent(evt);
  }
  root.querySelectorAll('.mc-btn').forEach(button => {
    const key = button.dataset.key;
    const mouseButton = button.dataset.mouse;
    const press = e => {
      e.preventDefault(); button.classList.add('held');
      if (key) setKey(key, true);
      if (mouseButton !== undefined) mouseEvent('mousedown', Number(mouseButton));
      if (button.setPointerCapture && e.pointerId !== undefined) button.setPointerCapture(e.pointerId);
    };
    const release = e => {
      if (e && e.preventDefault) e.preventDefault();
      button.classList.remove('held');
      if (key) setKey(key, false);
      if (mouseButton !== undefined) mouseEvent('mouseup', Number(mouseButton));
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', e => e.preventDefault());
  });

  // Never leave an input held if the browser changes tab or the overlay is hidden.
  function releaseAll() {
    resetJoystick();
    [...heldKeys].forEach(k => setKey(k, false));
    root.querySelectorAll('.mc-btn.held').forEach(button => {
      const mouseButton = button.dataset.mouse;
      if (mouseButton !== undefined) mouseEvent('mouseup', Number(mouseButton));
      button.classList.remove('held');
    });
  }
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
})();
