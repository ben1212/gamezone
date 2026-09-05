import { createRequire } from 'module';
import dotenv from 'dotenv';
import { db } from '../data/db.js';

dotenv.config();

const require = createRequire(import.meta.url);
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8933892491:AAHud2vFLTILg_iR-7Edq_E5ycaqr8eQv8s';
const WEB_APP_URL = process.env.WEB_APP_URL || process.env.CLIENT_URL || 'https://gamezone-ben.up.railway.app';

let botInstance: any = null;

export function initTelegramBot(): any {
  if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token_here') {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN is not set. Bot service will not start.');
    return null;
  }

  if (botInstance) {
    return botInstance;
  }

  try {
    const bot = new TelegramBot(BOT_TOKEN, { polling: true });
    botInstance = bot;

    console.log('🤖 Telegram Bot Service Initializing...');

    // Delete any old webhook to prevent polling conflicts
    bot
      .deleteWebHook()
      .then(() => {
        console.log('🧹 Cleared existing Telegram webhooks.');
      })
      .catch((err: any) => {
        console.warn('⚠️ deleteWebHook warning:', err?.message || err);
      });

    // Set the Web App Chat Menu Button (Persistent Button on Bottom Left of Chat)
    bot
      .setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: '🎮 Play GameZone',
          web_app: { url: WEB_APP_URL },
        },
      })
      .then(() => {
        console.log(`✅ Telegram Bot Chat Menu Button configured -> ${WEB_APP_URL}`);
      })
      .catch((err: any) => {
        console.warn('⚠️ Could not set chat menu button:', err?.message || err);
      });

    // Helper: Build the Main Menu Keyboards
    const getMainMenuInlineKeyboard = () => ({
      inline_keyboard: [
        [
          {
            text: '🎮 PLAY',
            web_app: { url: WEB_APP_URL },
          },
        ],
        [
          {
            text: '💰 DEPOSIT',
            web_app: { url: `${WEB_APP_URL}?action=deposit` },
          },
          {
            text: '💸 WITHDRAW',
            web_app: { url: `${WEB_APP_URL}?action=withdraw` },
          },
        ],
        [
          {
            text: '👛 BALANCE',
            callback_data: 'menu_balance',
          },
          {
            text: '🎁 REFERRAL',
            callback_data: 'menu_referral',
          },
        ],
        [
          {
            text: '📢 ANNOUNCEMENTS',
            callback_data: 'menu_announcements',
          },
          {
            text: '👤 PROFILE',
            web_app: { url: `${WEB_APP_URL}?page=profile` },
          },
        ],
      ],
    });

    const getMainMenuReplyKeyboard = () => ({
      keyboard: [
        [
          {
            text: '🎮 PLAY',
            web_app: { url: WEB_APP_URL },
          },
        ],
        [
          {
            text: '💰 DEPOSIT',
            web_app: { url: `${WEB_APP_URL}?action=deposit` },
          },
          {
            text: '💸 WITHDRAW',
            web_app: { url: `${WEB_APP_URL}?action=withdraw` },
          },
        ],
        [
          { text: '👛 BALANCE' },
          { text: '🎁 REFERRAL' },
        ],
        [
          { text: '📢 ANNOUNCEMENTS' },
          {
            text: '👤 PROFILE',
            web_app: { url: `${WEB_APP_URL}?page=profile` },
          },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    });

    const sendWelcomeMessage = async (chatId: number, user?: any) => {
      console.log(`✨ Sending welcome message to Chat ID: ${chatId} (@${user?.username || 'user'})`);
      
      // Sync or update user in database
      if (user) {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Player';
        const username = user.username ? `@${user.username}` : '@player';
        db.updateUser({
          telegramId: String(user.id),
          name: fullName,
          username: username,
        });
      }

      const welcomeText = `🎮 *GameZone*\n\nWelcome to GameZone 👋\nYour games, wallet, and account — all in one place.\n\n*Main menu*`;

      await bot.sendMessage(chatId, welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: getMainMenuInlineKeyboard(),
      });

      // Also set persistent reply keyboard
      await bot.sendMessage(
        chatId,
        '👇 Use the menu below or tap *🎮 PLAY* to start immediately!',
        {
          parse_mode: 'Markdown',
          reply_markup: getMainMenuReplyKeyboard(),
        }
      );
    };

    // ── Command: /start & /menu & general message handler ──
    bot.on('message', async (msg: any) => {
      if (!msg.text) return;
      const chatId = msg.chat.id;
      const text = msg.text.trim();
      console.log(`📩 Telegram Message [${chatId}]: "${text}" from @${msg.from?.username || msg.from?.first_name}`);

      try {
        if (text.startsWith('/start') || text.startsWith('/menu') || text.toLowerCase() === 'start') {
          await sendWelcomeMessage(chatId, msg.from);
          return;
        }

        if (text === '👛 BALANCE' || text.toLowerCase().includes('balance')) {
          const balances = db.getBalances();
          const balanceMsg = `👛 *Your GameZone Balances:*\n\n` +
            `💰 *Total:* ${balances.total.toFixed(2)} ${balances.currency}\n` +
            `🎮 *Playable:* ${balances.playable.toFixed(2)} ${balances.currency}\n` +
            `💸 *Withdrawable:* ${balances.withdrawable.toFixed(2)} ${balances.currency}`;

          await bot.sendMessage(chatId, balanceMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 PLAY NOW', web_app: { url: WEB_APP_URL } }],
                [
                  { text: '💰 Deposit', web_app: { url: `${WEB_APP_URL}?action=deposit` } },
                  { text: '💸 Withdraw', web_app: { url: `${WEB_APP_URL}?action=withdraw` } },
                ],
              ],
            },
          });
        } else if (text === '🎁 REFERRAL' || text.toLowerCase().includes('referral')) {
          const user = db.getUser();
          const me = await bot.getMe();
          const botUsername = me.username || 'bingox2019_bot';
          const refLink = `https://t.me/${botUsername}?start=ref_${user.telegramId || user.id}`;

          const refMsg = `🎁 *Invite & Earn ETB*\n\n` +
            `👥 *Your Referrals:* ${user.totalReferrals || 0}\n` +
            `💵 *Bonus Earned:* ${(user.referralBonusETB || 0).toFixed(2)} ETB\n\n` +
            `🔗 *Referral Link:*\n\`${refLink}\``;

          await bot.sendMessage(chatId, refMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 OPEN GAMEZONE', web_app: { url: WEB_APP_URL } }],
                [{ text: '📢 Share Link', url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Join me on GameZone and play now! 🎮')}` }],
              ],
            },
          });
        } else if (text === '📢 ANNOUNCEMENTS' || text.toLowerCase().includes('announcement')) {
          const announceMsg = `📢 *GameZone Announcements*\n\n` +
            `🔥 *Bingo Live* active rooms with huge pots!\n` +
            `⚡ Instant Telebirr & CBE deposits and withdrawals.\n` +
            `🎯 24/7 Live gaming tournaments!`;

          await bot.sendMessage(chatId, announceMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 PLAY NOW', web_app: { url: WEB_APP_URL } }],
              ],
            },
          });
        } else if (text === '💰 DEPOSIT' || text.toLowerCase().includes('deposit')) {
          await bot.sendMessage(
            chatId,
            `💰 *Deposit Funds into GameZone*\n\nFast & secure deposits via Telebirr or CBE Bank.\n\nTap below to open the deposit page directly:`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '💰 OPEN DEPOSIT PAGE', web_app: { url: `${WEB_APP_URL}?action=deposit` } }],
                ],
              },
            }
          );
        } else if (text === '💸 WITHDRAW' || text.toLowerCase().includes('withdraw')) {
          await bot.sendMessage(
            chatId,
            `💸 *Withdraw Winnings*\n\nInstant withdrawals directly to your Telebirr account or CBE.\n\nTap below to open the withdrawal page:`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '💸 OPEN WITHDRAW PAGE', web_app: { url: `${WEB_APP_URL}?action=withdraw` } }],
                ],
              },
            }
          );
        } else if (text === '👤 PROFILE' || text.toLowerCase().includes('profile')) {
          const user = db.getUser();
          const profileMsg = `👤 *Your GameZone Profile*\n\n` +
            `📛 *Name:* ${user.name}\n` +
            `🏷 *Username:* ${user.username}\n` +
            `🆔 *ID:* \`${user.telegramId || user.id}\`\n` +
            `🎁 *Referral Code:* \`${user.referralCode}\``;

          await bot.sendMessage(chatId, profileMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '👤 VIEW FULL PROFILE', web_app: { url: `${WEB_APP_URL}?page=profile` } }],
              ],
            },
          });
        }
      } catch (err: any) {
        console.error('Error handling text message:', err?.message || err);
      }
    });

    // ── Handle Callback Queries (Inline Buttons) ──
    bot.on('callback_query', async (query: any) => {
      try {
        const chatId = query.message?.chat.id;
        const data = query.data;
        if (!chatId || !data) return;

        await bot.answerCallbackQuery(query.id);

        if (data === 'menu_balance') {
          const balances = db.getBalances();
          const balanceMsg = `👛 *Your GameZone Balances:*\n\n` +
            `💰 *Total:* ${balances.total.toFixed(2)} ${balances.currency}\n` +
            `🎮 *Playable:* ${balances.playable.toFixed(2)} ${balances.currency}\n` +
            `💸 *Withdrawable:* ${balances.withdrawable.toFixed(2)} ${balances.currency}\n\n` +
            `_Tap below to play games or manage your wallet._`;

          await bot.sendMessage(chatId, balanceMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 PLAY NOW', web_app: { url: WEB_APP_URL } }],
                [
                  { text: '💰 Deposit', web_app: { url: `${WEB_APP_URL}?action=deposit` } },
                  { text: '💸 Withdraw', web_app: { url: `${WEB_APP_URL}?action=withdraw` } },
                ],
              ],
            },
          });
        } else if (data === 'menu_referral') {
          const user = db.getUser();
          const me = await bot.getMe();
          const botUsername = me.username || 'bingox2019_bot';
          const refLink = `https://t.me/${botUsername}?start=ref_${user.telegramId || user.id}`;

          const refMsg = `🎁 *Invite Friends & Earn ETB!*\n\n` +
            `Share your referral link with friends. You earn *25 ETB* for each active player you invite!\n\n` +
            `👥 *Your Total Referrals:* ${user.totalReferrals || 0}\n` +
            `💵 *Total Bonus Earned:* ${(user.referralBonusETB || 0).toFixed(2)} ETB\n\n` +
            `🔗 *Your Referral Link:*\n\`${refLink}\``;

          await bot.sendMessage(chatId, refMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 OPEN GAMEZONE', web_app: { url: WEB_APP_URL } }],
                [{ text: '📢 Share Referral Link', url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Join me on GameZone and win real prizes! 🎮💰')}` }],
              ],
            },
          });
        } else if (data === 'menu_announcements') {
          const announceMsg = `📢 *GameZone Announcements & News*\n\n` +
            `🔥 *Bingo Live Turbo Rooms* are active with prize pools up to *50,000 ETB*!\n` +
            `⚡ *Instant Telebirr & CBE* deposits and withdrawals 24/7.\n` +
            `🎯 *Keno Turbo 2.0* tournament starts every 30 minutes.\n\n` +
            `Join the action now!`;

          await bot.sendMessage(chatId, announceMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 PLAY NOW', web_app: { url: WEB_APP_URL } }],
              ],
            },
          });
        }
      } catch (err: any) {
        console.error('Error handling callback_query:', err?.message || err);
      }
    });

    bot.on('polling_error', (error: any) => {
      if (error?.message && !error.message.includes('EFATAL')) {
        console.warn(`[TelegramBot Polling] ${error.message}`);
      }
    });

    console.log('✅ Telegram Bot successfully started & listening for commands!');
    return bot;
  } catch (error: any) {
    console.error('❌ Failed to initialize Telegram Bot:', error?.message || error);
    return null;
  }
}
