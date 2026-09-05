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
    // NOTE: ONLY 🎮 PLAY opens the Web App directly. All other buttons work 100% inside Telegram Bot chat!
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
            callback_data: 'menu_deposit',
          },
          {
            text: '💸 WITHDRAW',
            callback_data: 'menu_withdraw',
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
            callback_data: 'menu_profile',
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
          { text: '💰 DEPOSIT' },
          { text: '💸 WITHDRAW' },
        ],
        [
          { text: '👛 BALANCE' },
          { text: '🎁 REFERRAL' },
        ],
        [
          { text: '📢 ANNOUNCEMENTS' },
          { text: '👤 PROFILE' },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    });

    // ── Content Builders for In-Bot Features ──

    const getDepositMessage = () => {
      return (
        `💰 *GameZone Deposit Center*\n\n` +
        `Top up your wallet instantly to play Bingo Live, Keno Turbo, and Ludo Arena.\n\n` +
        `📱 *Payment Methods:*\n` +
        `1️⃣ *Telebirr*: \`0911002233\` (GameZone VIP)\n` +
        `2️⃣ *CBE Bank*: \`1000123456789\` (GameZone Ltd)\n\n` +
        `⚡ *Instructions:*\n` +
        `• Minimum deposit: *50 ETB*\n` +
        `• Transfer the exact amount via Telebirr or CBE.\n` +
        `• Keep your transaction SMS / Reference ID.\n` +
        `• Your funds will reflect in your balance automatically!\n\n` +
        `_Tap below to check balance or launch the game._`
      );
    };

    const getDepositKeyboard = () => ({
      inline_keyboard: [
        [{ text: '🎮 PLAY NOW', web_app: { url: WEB_APP_URL } }],
        [
          { text: '👛 Check Balance', callback_data: 'menu_balance' },
          { text: '« Main Menu', callback_data: 'menu_home' },
        ],
      ],
    });

    const getWithdrawMessage = () => {
      const balances = db.getBalances();
      return (
        `💸 *GameZone Withdrawal Center*\n\n` +
        `Cash out your winnings instantly to your Telebirr or CBE account.\n\n` +
        `💵 *Your Withdrawable Balance:* *${balances.withdrawable.toFixed(2)} ${balances.currency}*\n\n` +
        `⚡ *Withdrawal Terms:*\n` +
        `• Minimum withdrawal: *100 ETB*\n` +
        `• Processing time: *1 to 5 minutes*\n` +
        `• 0% fee on all Telebirr withdrawals.\n\n` +
        `_To submit a withdrawal request, ensure your balance is above 100 ETB._`
      );
    };

    const getWithdrawKeyboard = () => ({
      inline_keyboard: [
        [{ text: '🎮 PLAY NOW', web_app: { url: WEB_APP_URL } }],
        [
          { text: '💰 Deposit', callback_data: 'menu_deposit' },
          { text: '« Main Menu', callback_data: 'menu_home' },
        ],
      ],
    });

    const getProfileMessage = () => {
      const user = db.getUser();
      const balances = db.getBalances();
      return (
        `👤 *Player Profile: ${user.name}*\n\n` +
        `🏷 *Username:* ${user.username}\n` +
        `🆔 *Telegram ID:* \`${user.telegramId || user.id}\`\n` +
        `⭐ *Tier:* VIP Gold Player\n` +
        `🎁 *Referral Code:* \`${user.referralCode}\`\n\n` +
        `💰 *Wallet Balances:*\n` +
        `• Total: *${balances.total.toFixed(2)} ETB*\n` +
        `• Playable: *${balances.playable.toFixed(2)} ETB*\n` +
        `• Withdrawable: *${balances.withdrawable.toFixed(2)} ETB*\n\n` +
        `👥 *Referral Stats:*\n` +
        `• Invited Players: *${user.totalReferrals || 0}*\n` +
        `• Total Bonus Earned: *${(user.referralBonusETB || 0).toFixed(2)} ETB*`
      );
    };

    const getProfileKeyboard = () => ({
      inline_keyboard: [
        [{ text: '🎮 LAUNCH GAMEZONE', web_app: { url: WEB_APP_URL } }],
        [
          { text: '💰 Deposit', callback_data: 'menu_deposit' },
          { text: '💸 Withdraw', callback_data: 'menu_withdraw' },
        ],
        [
          { text: '🎁 Referral Link', callback_data: 'menu_referral' },
          { text: '« Main Menu', callback_data: 'menu_home' },
        ],
      ],
    });

    const getBalanceMessage = () => {
      const balances = db.getBalances();
      return (
        `👛 *Your GameZone Balances:*\n\n` +
        `💰 *Total Balance:* *${balances.total.toFixed(2)} ${balances.currency}*\n` +
        `🎮 *Playable Funds:* ${balances.playable.toFixed(2)} ${balances.currency}\n` +
        `💸 *Withdrawable Winnings:* ${balances.withdrawable.toFixed(2)} ${balances.currency}\n\n` +
        `_Tap 🎮 PLAY to join live Bingo, Keno, or Ludo tournaments!_`
      );
    };

    const getBalanceKeyboard = () => ({
      inline_keyboard: [
        [{ text: '🎮 PLAY NOW', web_app: { url: WEB_APP_URL } }],
        [
          { text: '💰 Deposit', callback_data: 'menu_deposit' },
          { text: '💸 Withdraw', callback_data: 'menu_withdraw' },
        ],
        [{ text: '« Main Menu', callback_data: 'menu_home' }],
      ],
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

        if (text === '💰 DEPOSIT' || text.toLowerCase().includes('deposit')) {
          await bot.sendMessage(chatId, getDepositMessage(), {
            parse_mode: 'Markdown',
            reply_markup: getDepositKeyboard(),
          });
        } else if (text === '💸 WITHDRAW' || text.toLowerCase().includes('withdraw')) {
          await bot.sendMessage(chatId, getWithdrawMessage(), {
            parse_mode: 'Markdown',
            reply_markup: getWithdrawKeyboard(),
          });
        } else if (text === '👤 PROFILE' || text.toLowerCase().includes('profile')) {
          await bot.sendMessage(chatId, getProfileMessage(), {
            parse_mode: 'Markdown',
            reply_markup: getProfileKeyboard(),
          });
        } else if (text === '👛 BALANCE' || text.toLowerCase().includes('balance')) {
          await bot.sendMessage(chatId, getBalanceMessage(), {
            parse_mode: 'Markdown',
            reply_markup: getBalanceKeyboard(),
          });
        } else if (text === '🎁 REFERRAL' || text.toLowerCase().includes('referral')) {
          const user = db.getUser();
          const me = await bot.getMe();
          const botUsername = me.username || 'bingox2019_bot';
          const refLink = `https://t.me/${botUsername}?start=ref_${user.telegramId || user.id}`;

          const refMsg =
            `🎁 *Invite & Earn ETB*\n\n` +
            `Share your personal referral link with friends. You receive *25 ETB* instant bonus for every active player you invite!\n\n` +
            `👥 *Your Referrals:* ${user.totalReferrals || 0}\n` +
            `💵 *Total Bonus Earned:* ${(user.referralBonusETB || 0).toFixed(2)} ETB\n\n` +
            `🔗 *Your Referral Link:*\n\`${refLink}\``;

          await bot.sendMessage(chatId, refMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 OPEN GAMEZONE', web_app: { url: WEB_APP_URL } }],
                [
                  {
                    text: '📢 Share Referral Link',
                    url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(
                      'Join me on GameZone and play real games to win cash prizes! 🎮💰'
                    )}`,
                  },
                ],
                [{ text: '« Main Menu', callback_data: 'menu_home' }],
              ],
            },
          });
        } else if (text === '📢 ANNOUNCEMENTS' || text.toLowerCase().includes('announcement')) {
          const announceMsg =
            `📢 *GameZone Announcements & News*\n\n` +
            `🔥 *Bingo Live Turbo Rooms* are active with prize pools up to *50,000 ETB*!\n` +
            `⚡ *Instant Telebirr & CBE* deposits and withdrawals available 24/7.\n` +
            `🎯 *Keno Turbo 2.0* tournament rounds start every 30 minutes.\n\n` +
            `Join the action now!`;

          await bot.sendMessage(chatId, announceMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 PLAY NOW', web_app: { url: WEB_APP_URL } }],
                [{ text: '« Main Menu', callback_data: 'menu_home' }],
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

        if (data === 'menu_home') {
          await sendWelcomeMessage(chatId, query.from);
        } else if (data === 'menu_deposit') {
          await bot.sendMessage(chatId, getDepositMessage(), {
            parse_mode: 'Markdown',
            reply_markup: getDepositKeyboard(),
          });
        } else if (data === 'menu_withdraw') {
          await bot.sendMessage(chatId, getWithdrawMessage(), {
            parse_mode: 'Markdown',
            reply_markup: getWithdrawKeyboard(),
          });
        } else if (data === 'menu_profile') {
          await bot.sendMessage(chatId, getProfileMessage(), {
            parse_mode: 'Markdown',
            reply_markup: getProfileKeyboard(),
          });
        } else if (data === 'menu_balance') {
          await bot.sendMessage(chatId, getBalanceMessage(), {
            parse_mode: 'Markdown',
            reply_markup: getBalanceKeyboard(),
          });
        } else if (data === 'menu_referral') {
          const user = db.getUser();
          const me = await bot.getMe();
          const botUsername = me.username || 'bingox2019_bot';
          const refLink = `https://t.me/${botUsername}?start=ref_${user.telegramId || user.id}`;

          const refMsg =
            `🎁 *Invite Friends & Earn ETB!*\n\n` +
            `Share your referral link with friends. You earn *25 ETB* for each active player you invite!\n\n` +
            `👥 *Your Total Referrals:* ${user.totalReferrals || 0}\n` +
            `💵 *Total Bonus Earned:* ${(user.referralBonusETB || 0).toFixed(2)} ETB\n\n` +
            `🔗 *Your Referral Link:*\n\`${refLink}\``;

          await bot.sendMessage(chatId, refMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 OPEN GAMEZONE', web_app: { url: WEB_APP_URL } }],
                [
                  {
                    text: '📢 Share Referral Link',
                    url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(
                      'Join me on GameZone and win real prizes! 🎮💰'
                    )}`,
                  },
                ],
                [{ text: '« Main Menu', callback_data: 'menu_home' }],
              ],
            },
          });
        } else if (data === 'menu_announcements') {
          const announceMsg =
            `📢 *GameZone Announcements & News*\n\n` +
            `🔥 *Bingo Live Turbo Rooms* are active with prize pools up to *50,000 ETB*!\n` +
            `⚡ *Instant Telebirr & CBE* deposits and withdrawals 24/7.\n` +
            `🎯 *Keno Turbo 2.0* tournament starts every 30 minutes.\n\n` +
            `Join the action now!`;

          await bot.sendMessage(chatId, announceMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 PLAY NOW', web_app: { url: WEB_APP_URL } }],
                [{ text: '« Main Menu', callback_data: 'menu_home' }],
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
