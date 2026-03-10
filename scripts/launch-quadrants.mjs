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

const USERS = (process.env.QUAD_USERS || 'joel,jess,mckenna,kc')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .slice(0, 4);

if (USERS.length < 4) {
  console.error('Need 4 usernames. Set QUAD_USERS="u1,u2,u3,u4".');
  process.exit(1);
}

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

async function launchWindow(username, slot, index) {
  const profileDir = path.join(os.tmpdir(), `survivor-outdraft-quadrant-${index + 1}-${username}`);

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
      `Profile lock detected for ${username}; retrying with fresh profile: ${fallbackDir}`
    );
    context = await chromium.launchPersistentContext(fallbackDir, launchOptions);
  }

  const page = context.pages()[0] || (await context.newPage());

  // Navigate immediately to bypass restore dialog
  await page.goto(`${BASE_URL}${LOGIN_PATH}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(500);

  if (!SKIP_LOGIN) {
    await login(page, username);
  } else {
    // Already navigated above
  }

  return { context, page, username };
}

async function main() {
  console.log(`Launching 4 user windows at ${BASE_URL}`);
  console.log(`Users: ${USERS.join(', ')}`);
  console.log(
    `Layout: ${windowWidth}x${windowHeight}, preset=${DISPLAY_PRESET}, screen=${screenWidth}x${screenHeight}, margins=(${marginX},${marginY}), gaps=(${gapX},${gapY}), fit=${fitScale}`
  );

  const launchResults = await Promise.allSettled(
    USERS.slice(0, 4).map((username, index) => launchWindow(username, quadrants[index], index))
  );

  const sessions = launchResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  launchResults.forEach((result, index) => {
    const username = USERS[index];
    if (result.status === 'fulfilled') {
      console.log(`Opened quadrant ${index + 1} for ${username}`);
    } else {
      console.error(`Failed quadrant ${index + 1} for ${username}:`, result.reason);
    }
  });

  if (sessions.length === 0) {
    throw new Error('No quadrants could be opened.');
  }

  console.log('All quadrants are ready for human interaction. Press Ctrl+C to close all windows.');

  const closeAll = async () => {
    await Promise.allSettled(sessions.map((session) => session.context.close()));
    process.exit(0);
  };

  process.on('SIGINT', closeAll);
  process.on('SIGTERM', closeAll);

  await new Promise(() => {});
}

main().catch((error) => {
  console.error('Failed to launch quadrants:', error);
  process.exit(1);
});
