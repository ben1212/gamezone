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

    const getHomeMessage = () => {
      return (
        `🎮 GameZone\n\n` +
        `Welcome to GameZone 👋\n` +
        `Your games, wallet, and account — all in one place.\n\n` +
        `Main menu`
      );
    };

    const getDepositMessage = () => {
      return (
        `💰 ገንዘብ ለመጨመር\n\n` +
        `የክፍያ ዘዴ ይምረጡ።`
      );
    };

    const getDepositKeyboard = () => ({
      inline_keyboard: [
        [
          { text: 'Telebirr', callback_data: 'deposit_telebirr' },
          { text: 'CBE Birr', callback_data: 'deposit_cbe' },
        ],
        [{ text: '« BACK', callback_data: 'menu_home' }],
      ],
    });

    const getDepositDetailsMessage = (method: 'telebirr' | 'cbe') => {
      if (method === 'telebirr') {
        return (
          `💰 Telebirr\n\n` +
          `መጠን → የክፍያ መመሪያ → SMS ማረጋገጫ → Pending\n\n` +
          `📱 Telebirr: 0911002233\n` +
          `📛 ስም: GameZone\n` +
          `💵 ዝቅተኛ መጠን: 50 ETB\n\n` +
          `ክፍያውን ከፈጸሙ በኋላ የደረሰዎትን SMS መልእክት እዚህ ይላኩ።`
        );
      }
      return (
        `💰 CBE Birr / Bank\n\n` +
        `መጠን → የክፍያ መመሪያ → SMS ማረጋገጫ → Pending\n\n` +
        `🏦 CBE አካውንት: 1000123456789\n` +
        `📛 ስም: GameZone Ltd\n` +
        `💵 ዝቅተኛ መጠን: 50 ETB\n\n` +
        `ክፍያውን ከፈጸሙ በኋላ የደረሰዎትን SMS ወይም Transaction ID እዚህ ይላኩ።`
      );
    };

    const getDepositDetailsKeyboard = () => ({
      inline_keyboard: [
        [
          { text: '« ተመለስ', callback_data: 'menu_deposit' },
          { text: '« BACK', callback_data: 'menu_home' },
        ],
      ],
    });

    const getWithdrawMessage = () => {
      const balances = db.getBalances();
      return (
        `💸 ገንዘብ ለማውጣት\n\n` +
        `የሚያወጡትን መጠን ያስገቡ።\n\n` +
        `Available: ${balances.withdrawable.toFixed(0)} ETB\n` +
        `Min: 100 ETB\n\n` +
        `Amount → Account → Confirm → Pending`
      );
    };

    const getWithdrawKeyboard = () => ({
      inline_keyboard: [
        [
          { text: '100 ETB', callback_data: 'withdraw_100' },
          { text: '250 ETB', callback_data: 'withdraw_250' },
          { text: '500 ETB', callback_data: 'withdraw_500' },
        ],
        [{ text: '« BACK', callback_data: 'menu_home' }],
      ],
    });

    const getBalanceMessage = () => {
      const balances = db.getBalances();
      return (
        `👛 ቀሪ ሂሳብ\n\n` +
        `Total: ${balances.total.toFixed(0)} ETB\n` +
        `Withdrawable: ${balances.withdrawable.toFixed(0)} ETB\n` +
        `Playable: ${balances.playable.toFixed(0)} ETB`
      );
    };

    const getBalanceKeyboard = () => ({
      inline_keyboard: [
        [
          { text: '💰 Deposit', callback_data: 'menu_deposit' },
          { text: '💸 Withdraw', callback_data: 'menu_withdraw' },
        ],
        [{ text: '🎮 PLAY', web_app: { url: WEB_APP_URL } }],
        [{ text: '« BACK', callback_data: 'menu_home' }],
      ],
    });

    const getReferralMessage = () => {
      const user = db.getUser();
      return (
        `🎁 ግብዣ\n\n` +
        `Invited: ${user.totalReferrals || 0}\n` +
        `Earned: ${(user.referralBonusETB || 0).toFixed(0)} ETB`
      );
    };

    const getReferralKeyboard = async () => {
      const user = db.getUser();
      const me = await bot.getMe();
      const botUsername = me.username || 'bingox2019_bot';
      const refLink = `https://t.me/${botUsername}?start=ref_${user.telegramId || user.id}`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(
        'GameZone ላይ ይቀላቀሉ እና ይጫወቱ! 🎮💰'
      )}`;

      return {
        inline_keyboard: [
          [{ text: '🎁 INVITE', url: shareUrl }],
          [{ text: '« BACK', callback_data: 'menu_home' }],
        ],
      };
    };

    const getProfileMessage = () => {
      const user = db.getUser();
      const phoneDisplay = user.phone ? user.phone : '+251...';
      const idDisplay = user.telegramId ? user.telegramId : user.id;

      return (
        `👤 መገለጫ\n\n` +
        `Name: ${user.name || 'Player'}\n` +
        `Username: ${user.username || '@username'}\n` +
        `Phone: ${phoneDisplay}\n` +
        `ID: #${idDisplay}`
      );
    };

    const getProfileKeyboard = () => ({
      inline_keyboard: [
        [
          { text: '👛 ቀሪ ሂሳብ', callback_data: 'menu_balance' },
          { text: '🎮 PLAY', web_app: { url: WEB_APP_URL } },
        ],
        [{ text: '« BACK', callback_data: 'menu_home' }],
      ],
    });

    const getAnnouncementsMessage = () => {
      return (
        `📢 ማስታወቂያዎች\n\n` +
        `🔥 Bingo Live የ 50,000 ETB ሽልማት ክፍት ነው!\n` +
        `⚡ ፈጣን የ Telebirr እና CBE ክፍያዎች።\n` +
        `🎯 Keno Turbo በየ 30 ደቂቃው ይካሄዳል።`
      );
    };

    const getAnnouncementsKeyboard = () => ({
      inline_keyboard: [
        [{ text: '🎮 PLAY', web_app: { url: WEB_APP_URL } }],
        [{ text: '« BACK', callback_data: 'menu_home' }],
      ],
    });

    // ── Seamless In-Place Message Editor ──
    const editOrSend = async (
      chatId: number,
      messageId: number | undefined,
      text: string,
      keyboard: any
    ) => {
      if (messageId) {
        try {
          await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: keyboard,
          });
          return;
        } catch (err: any) {
          if (!err?.message?.includes('message is not modified')) {
            console.warn('Could not edit message, fallback to send:', err?.message || err);
          } else {
            return;
          }
        }
      }

      await bot.sendMessage(chatId, text, {
        reply_markup: keyboard,
      });
    };

    const sendWelcomeMessage = async (chatId: number, user?: any, messageId?: number) => {
      console.log(`✨ Sending/Updating welcome message for Chat ID: ${chatId} (@${user?.username || 'user'})`);

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

      const welcomeText = getHomeMessage();

      if (messageId) {
        await editOrSend(chatId, messageId, welcomeText, getMainMenuInlineKeyboard());
      } else {
        await bot.sendMessage(chatId, welcomeText, {
          reply_markup: getMainMenuInlineKeyboard(),
        });

        // Set persistent bottom reply keyboard
        await bot.sendMessage(
          chatId,
          '👇 Tap 🎮 PLAY to start immediately or use the menu:',
          {
            reply_markup: getMainMenuReplyKeyboard(),
          }
        );
      }
    };

    // ── Text Messages & Command Handlers ──
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

        if (text === '💰 DEPOSIT' || text.toLowerCase().includes('deposit') || text.includes('ገንዘብ ለመጨመር')) {
          await bot.sendMessage(chatId, getDepositMessage(), {
            reply_markup: getDepositKeyboard(),
          });
        } else if (text === '💸 WITHDRAW' || text.toLowerCase().includes('withdraw') || text.includes('ገንዘብ ለማውጣት')) {
          await bot.sendMessage(chatId, getWithdrawMessage(), {
            reply_markup: getWithdrawKeyboard(),
          });
        } else if (text === '👤 PROFILE' || text.toLowerCase().includes('profile') || text.includes('መገለጫ')) {
          await bot.sendMessage(chatId, getProfileMessage(), {
            reply_markup: getProfileKeyboard(),
          });
        } else if (text === '👛 BALANCE' || text.toLowerCase().includes('balance') || text.includes('ቀሪ ሂሳብ')) {
          await bot.sendMessage(chatId, getBalanceMessage(), {
            reply_markup: getBalanceKeyboard(),
          });
        } else if (text === '🎁 REFERRAL' || text.toLowerCase().includes('referral') || text.includes('ግብዣ')) {
          const refMsg = getReferralMessage();
          const refKb = await getReferralKeyboard();
          await bot.sendMessage(chatId, refMsg, {
            reply_markup: refKb,
          });
        } else if (text === '📢 ANNOUNCEMENTS' || text.toLowerCase().includes('announcement') || text.includes('ማስታወቂያ')) {
          await bot.sendMessage(chatId, getAnnouncementsMessage(), {
            reply_markup: getAnnouncementsKeyboard(),
          });
        }
      } catch (err: any) {
        console.error('Error handling text message:', err?.message || err);
      }
    });

    // ── Handle Callback Queries (In-Place Message Editing) ──
    bot.on('callback_query', async (query: any) => {
      try {
        const chatId = query.message?.chat.id;
        const messageId = query.message?.message_id;
        const data = query.data;
        if (!chatId || !data) return;

        await bot.answerCallbackQuery(query.id);

        if (data === 'menu_home') {
          await sendWelcomeMessage(chatId, query.from, messageId);
        } else if (data === 'menu_deposit') {
          await editOrSend(chatId, messageId, getDepositMessage(), getDepositKeyboard());
        } else if (data === 'deposit_telebirr') {
          await editOrSend(chatId, messageId, getDepositDetailsMessage('telebirr'), getDepositDetailsKeyboard());
        } else if (data === 'deposit_cbe') {
          await editOrSend(chatId, messageId, getDepositDetailsMessage('cbe'), getDepositDetailsKeyboard());
        } else if (data === 'menu_withdraw') {
          await editOrSend(chatId, messageId, getWithdrawMessage(), getWithdrawKeyboard());
        } else if (data.startsWith('withdraw_')) {
          const amount = data.replace('withdraw_', '');
          const confirmText =
            `💸 የ ${amount} ETB የመውጣት ጥያቄ\n\n` +
            `Amount: ${amount} ETB\n` +
            `Status: Pending ⏳\n\n` +
            `ገንዘቡ በ 1-5 ደቂቃ ውስጥ ወደ አካውንትዎ ይላካል።`;
          const confirmKeyboard = {
            inline_keyboard: [
              [{ text: '👛 ቀሪ ሂሳብ', callback_data: 'menu_balance' }],
              [{ text: '« BACK', callback_data: 'menu_home' }],
            ],
          };
          await editOrSend(chatId, messageId, confirmText, confirmKeyboard);
        } else if (data === 'menu_profile') {
          await editOrSend(chatId, messageId, getProfileMessage(), getProfileKeyboard());
        } else if (data === 'menu_balance') {
          await editOrSend(chatId, messageId, getBalanceMessage(), getBalanceKeyboard());
        } else if (data === 'menu_referral') {
          const refMsg = getReferralMessage();
          const refKb = await getReferralKeyboard();
          await editOrSend(chatId, messageId, refMsg, refKb);
        } else if (data === 'menu_announcements') {
          await editOrSend(chatId, messageId, getAnnouncementsMessage(), getAnnouncementsKeyboard());
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
