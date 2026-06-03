const slider = document.getElementById('darkness');
const valueDisplay = document.getElementById('value');
const statusDiv = document.getElementById('status');


async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('Нет активной вкладки');
  // Запрещённые URL (системные страницы)
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
    throw new Error('Расширение не работает на системных страницах');
  }
  return tab;
}


async function loadDarkness() {
  try {
    const tab = await getCurrentTab();
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getOverlayOpacity,
    });
    const current = result ?? 0;
    slider.value = current;
    updateUI(current);
  } catch (err) {
    showError(err.message);
  }
}


slider.addEventListener('input', async () => {
  const percent = Number(slider.value);
  updateUI(percent);
  try {
    const tab = await getCurrentTab();
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: setDarkness,
      args: [percent],
    });
  } catch (err) {
    showError('Не удалось применить затемнение: ' + err.message);
  }
});


function updateUI(value) {
  valueDisplay.textContent = value;
  statusDiv.textContent = value === 0 ? 'Статус: выключено' : `Статус: включено (${value}%)`;
}

function showError(msg) {
  statusDiv.textContent = '⚠️ ' + msg;
  statusDiv.style.color = 'red';
}


function getOverlayOpacity() {
  const overlay = document.getElementById('light-way-overlay');
  if (!overlay) return 0;
  const opacity = parseFloat(overlay.style.opacity);
  return isNaN(opacity) ? 100 : Math.round(opacity * 100);
}

function setDarkness(percent) {
  const id = 'light-way-overlay';
  let overlay = document.getElementById(id);

  if (percent === 0) {
    if (overlay) overlay.remove();
    return;
  }

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;z-index:2147483647;pointer-events:auto;cursor:none;';
    document.documentElement.appendChild(overlay);
  }

  overlay.style.opacity = percent / 100;
}


loadDarkness();
