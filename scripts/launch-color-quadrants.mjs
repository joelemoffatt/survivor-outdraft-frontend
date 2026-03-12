import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';
import { chromium } from 'playwright';

const BASE_URL = process.env.QUAD_BASE_URL || 'http://localhost:8081';
const LOGIN_PATH = process.env.QUAD_LOGIN_PATH || '/login';
const PASSWORD = process.env.QUAD_PASSWORD || '123';
const RESET_AUTH = process.env.RESET_AUTH === '1';
const SKIP_LOGIN = process.env.SKIP_LOGIN === '1';
const LOGIN_WAIT_MS = Number(process.env.QUAD_LOGIN_WAIT_MS || 1200);

// Color quadrants mapping
const COLORS = {
  blue: { username: 'blue', hex: '#0066FF', rgb: 'rgb(0, 102, 255)' },
  yellow: { username: 'yellow', hex: '#FFD700', rgb: 'rgb(255, 215, 0)' },
  green: { username: 'green', hex: '#00CC66', rgb: 'rgb(0, 204, 102)' },
  red: { username: 'red', hex: '#FF3333', rgb: 'rgb(255, 51, 51)' },
};

const COLOR_ORDER = ['blue', 'yellow', 'green', 'red'];

const DISPLAY_PRESET = process.env.QUAD_DISPLAY_PRESET || 'retina';

const PRESET_SCREENS = {
  retina: { width: 1512, height: 982 },
  external1080: { width: 1920, height: 1080 },
};

const presetScreen = PRESET_SCREENS[DISPLAY_PRESET] || PRESET_SCREENS.retina;

const screenWidth = Number(process.env.QUAD_SCREEN_WIDTH || presetScreen.width);
const screenHeight = Number(process.env.QUAD_SCREEN_HEIGHT || presetScreen.height);
const marginX = Number(process.env.QUAD_MARGIN_X || 0);
const marginY = Number(process.env.QUAD_MARGIN_Y || 0);
const gapX = Number(process.env.QUAD_GAP_X || 0);
const gapY = Number(process.env.QUAD_GAP_Y || 40);
const fitScale = Number(process.env.QUAD_FIT_SCALE || 1);

const cellWidth = Math.floor((screenWidth - marginX * 2 - gapX) / 2);
const cellHeight = Math.floor((screenHeight - marginY * 2 - gapY) / 2);

const windowWidth = Math.floor(cellWidth * fitScale);
const windowHeight = Math.floor(cellHeight * fitScale);

const offsetX = Math.floor((cellWidth - windowWidth) / 2);
const offsetY = Math.floor((cellHeight - windowHeight) / 2);

const quadrants = [
  { x: marginX + offsetX, y: marginY + offsetY, width: windowWidth, height: windowHeight },
  {
    x: marginX + cellWidth + gapX + offsetX,
    y: marginY + offsetY,
    width: windowWidth,
    height: windowHeight,
  },
  {
    x: marginX + offsetX,
    y: marginY + cellHeight + gapY + offsetY,
    width: windowWidth,
    height: windowHeight,
  },
  {
    x: marginX + cellWidth + gapX + offsetX,
    y: marginY + cellHeight + gapY + offsetY,
    width: windowWidth,
    height: windowHeight,
  },
];

async function tryFill(page, selector, value) {
  try {
    await page.locator(selector).first().fill(value);
    return true;
  } catch {
    return false;
  }
}

async function tryClick(page, selector) {
  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
    await element.click();
    return true;
  } catch {
    return false;
  }
}

async function login(page, username) {
  // Page is already at login URL from launchWindow

  const userFilled =
    (await tryFill(page, 'input[placeholder="Username"]', username)) ||
    (await tryFill(page, 'input[name="username"]', username)) ||
    (await tryFill(page, 'input[type="text"]', username));

  const passFilled =
    (await tryFill(page, 'input[placeholder="Password"]', PASSWORD)) ||
    (await tryFill(page, 'input[name="password"]', PASSWORD)) ||
    (await tryFill(page, 'input[type="password"]', PASSWORD));

  if (!userFilled || !passFilled) {
    throw new Error(`Could not find login inputs for ${username}`);
  }

  console.log(`Submitting login for ${username}...`);

  // Tab to move focus to login button
  await page.keyboard.press('Tab').catch(() => {});
  await page.waitForTimeout(100);

  // Press Enter to activate the focused button
  await page.keyboard.press('Enter').catch(() => {});
  console.log(`Enter pressed for ${username}`);

  // Wait for URL to change away from login page
  const loginPageUrl = page.url();
  const startTime = Date.now();
  const maxWait = 10000;

  while (Date.now() - startTime < maxWait) {
    const currentUrl = page.url();
    if (currentUrl !== loginPageUrl && !currentUrl.includes(LOGIN_PATH)) {
      console.log(`✓ ${username} logged in`);
      break;
    }
    await page.waitForTimeout(300);
  }

  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(500);
}

async function injectColorBar(page, color) {
  // Inject a colored bar at the top of the page for visual identification
  await page.evaluate(
    async (colorInfo) => {
      const bar = document.createElement('div');
      bar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 8px;
        background-color: ${colorInfo.rgb};
        z-index: 10000;
        pointer-events: none;
      `;
      bar.setAttribute('data-color-quadrant', colorInfo.username);
      document.body.prepend(bar);
    },
    COLORS[color]
  );
}

async function launchWindow(colorName, slot, index) {
  const colorInfo = COLORS[colorName];
  const profileDir = path.join(
    os.tmpdir(),
    `survivor-outdraft-quadrant-${index + 1}-${colorName}`
  );

  if (RESET_AUTH) {
    await fs.rm(profileDir, { recursive: true, force: true });
  }

  const launchOptions = {
    headless: false,
    viewport: null,
    args: [
      `--window-position=${slot.x},${slot.y}`,
      `--window-size=${slot.width},${slot.height}`,
      '--hide-crash-restore-bubble',
      '--disable-session-crashed-bubble',
      '--disable-infobars',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-pings',
      '--incognito',
    ],
  };

  let context;
  try {
    context = await chromium.launchPersistentContext(profileDir, launchOptions);
  } catch (error) {
    const message = String(error?.message || error);
    const lockError =
      message.includes('ProcessSingleton') ||
      message.includes('profile is already in use');

    if (!lockError) {
      throw error;
    }

    const fallbackDir = `${profileDir}-run-${Date.now()}`;
    console.warn(
      `Profile lock detected for ${colorName}; retrying with fresh profile: ${fallbackDir}`
    );
    context = await chromium.launchPersistentContext(fallbackDir, launchOptions);
  }

  const page = context.pages()[0] || (await context.newPage());

  // Navigate immediately to bypass restore dialog
  await page.goto(`${BASE_URL}${LOGIN_PATH}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(500);

  if (!SKIP_LOGIN) {
    await login(page, colorInfo.username);
  } else {
    // Already navigated above
  }

  // Inject color bar to identify quadrant
  await injectColorBar(page, colorName).catch(() => {});

  return { context, page, colorName, colorInfo };
}

async function main() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Launching Color Quadrants at ${BASE_URL}`);
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Colors: ${COLOR_ORDER.map((c) => `${c.toUpperCase()} (${COLORS[c].hex})`).join(', ')}`);
  console.log(
    `Layout: ${windowWidth}x${windowHeight}, preset=${DISPLAY_PRESET}, screen=${screenWidth}x${screenHeight}`
  );
  console.log(`Margins: (${marginX}, ${marginY}), Gaps: (${gapX}, ${gapY}), Fit Scale: ${fitScale}\n`);

  const launchResults = await Promise.allSettled(
    COLOR_ORDER.map((colorName, index) => launchWindow(colorName, quadrants[index], index))
  );

  const sessions = launchResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  launchResults.forEach((result, index) => {
    const colorName = COLOR_ORDER[index];
    if (result.status === 'fulfilled') {
      console.log(`✓ Opened ${colorName.toUpperCase()} quadrant (${index + 1})`);
    } else {
      console.error(`✗ Failed ${colorName.toUpperCase()} quadrant (${index + 1}):`, result.reason);
    }
  });

  if (sessions.length === 0) {
    throw new Error('No quadrants could be opened.');
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('All color quadrants are ready. Press Ctrl+C to close all windows.');
  console.log(`${'='.repeat(80)}\n`);

  const closeAll = async () => {
    console.log('\nClosing all quadrants...');
    await Promise.allSettled(sessions.map((session) => session.context.close()));
    process.exit(0);
  };

  process.on('SIGINT', closeAll);
  process.on('SIGTERM', closeAll);

  await new Promise(() => {});
}

main().catch((error) => {
  console.error('Failed to launch color quadrants:', error);
  process.exit(1);
});
