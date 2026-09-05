import { createRequire } from 'module';
import dotenv from 'dotenv';
import { db } from '../data/db.js';

dotenv.config();

const require = createRequire(import.meta.url);
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8933892491:AAHud2vFLTILg_iR-7Edq_E5ycaqr8eQv8s';
const WEB_APP_URL = process.env.WEB_APP_URL || process.env.CLIENT_URL || 'https://gamezone-ben.up.railway.app';

interface UserSession {
  lastBotMessageId?: number;
  step?: 'idle' | 'withdraw_amount' | 'withdraw_account' | 'withdraw_confirm' | 'deposit_amount' | 'deposit_sms';
  withdrawAmount?: number;
  withdrawAccount?: string;
  withdrawMethod?: string;
  depositAmount?: number;
  depositMethod?: 'telebirr' | 'cbe';
}

const sessions = new Map<number, UserSession>();

function getSession(chatId: number): UserSession {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { step: 'idle' });
  }
  return sessions.get(chatId)!;
}

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

    // ── Permanent Navigation Reply Keyboard (Always sits underneath) ──
    const getPermanentReplyKeyboard = () => ({
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

    // ── Single Stateful Message Editor ──
    // Edits the active message in place instead of creating new messages
    const editOrSendState = async (
      chatId: number,
      text: string,
      inlineKeyboard?: any
    ) => {
      const session = getSession(chatId);
      const replyMarkup = inlineKeyboard && inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined;

      if (session.lastBotMessageId) {
        try {
          await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: session.lastBotMessageId,
            reply_markup: replyMarkup,
          });
          return;
        } catch (err: any) {
          // If message is identical, ignore; if message was deleted/cannot be edited, create new
          if (err?.message?.includes('message is not modified')) {
            return;
          }
          // Fall through to send a fresh state message
        }
      }

      // Send new message if no message exists or edit failed
      const sentMsg = await bot.sendMessage(chatId, text, {
        reply_markup: replyMarkup,
      });
      session.lastBotMessageId = sentMsg.message_id;
    };

    // Helper: Safely delete user input message to keep the chat spotless
    const tryDeleteUserMsg = async (chatId: number, msgId: number) => {
      try {
        await bot.deleteMessage(chatId, msgId);
      } catch {
        // Ignored if permissions not granted
      }
    };

    // ── Content Renderers ──

    const showHome = async (chatId: number, user?: any) => {
      const session = getSession(chatId);
      session.step = 'idle';

      if (user) {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Player';
        const username = user.username ? `@${user.username}` : '@player';
        db.updateUser({
          telegramId: String(user.id),
          name: fullName,
          username: username,
        });
      }

      const text =
        `🎮 GameZone\n\n` +
        `Welcome to GameZone 👋\n` +
        `Your games, wallet, and account — all in one place.\n\n` +
        `Main menu`;

      const inlineKeyboard = [
        [{ text: '🎮 PLAY', web_app: { url: WEB_APP_URL } }],
        [
          { text: '💰 DEPOSIT', callback_data: 'nav_deposit' },
          { text: '💸 WITHDRAW', callback_data: 'nav_withdraw' },
        ],
        [
          { text: '👛 BALANCE', callback_data: 'nav_balance' },
          { text: '🎁 REFERRAL', callback_data: 'nav_referral' },
        ],
        [
          { text: '📢 ANNOUNCEMENTS', callback_data: 'nav_announcements' },
          { text: '👤 PROFILE', callback_data: 'nav_profile' },
        ],
      ];

      // Ensure permanent bottom keyboard is attached
      if (!session.lastBotMessageId) {
        const sent = await bot.sendMessage(chatId, text, {
          reply_markup: {
            ...getPermanentReplyKeyboard(),
          },
        });
        session.lastBotMessageId = sent.message_id;

        // Also add the inline buttons
        await bot.editMessageReplyMarkup(
          { inline_keyboard: inlineKeyboard },
          { chat_id: chatId, message_id: sent.message_id }
        );
      } else {
        await editOrSendState(chatId, text, inlineKeyboard);
      }
    };

    // ── Step-by-Step Deposit Flow ──

    const showDeposit = async (chatId: number) => {
      const session = getSession(chatId);
      session.step = 'idle';
      session.depositAmount = undefined;
      session.depositMethod = undefined;

      const text =
        `💰 Deposit\n\n` +
        `Select payment method:`;

      const inlineKeyboard = [
        [
          { text: 'Telebirr', callback_data: 'deposit_telebirr' },
          { text: 'CBE Birr', callback_data: 'deposit_cbe' },
        ],
      ];

      await editOrSendState(chatId, text, inlineKeyboard);
    };

    const handleSelectDepositMethod = async (chatId: number, method: 'telebirr' | 'cbe') => {
      const session = getSession(chatId);
      session.step = 'deposit_amount';
      session.depositMethod = method;

      const text =
        `💰 Deposit\n\n` +
        `Enter amount:\n\n` +
        `Minimum: 10 ETB`;

      await editOrSendState(chatId, text);
    };

    const handleDepositAmount = async (chatId: number, amount: number) => {
      const session = getSession(chatId);

      if (isNaN(amount) || amount < 10) {
        const text =
          `💰 Deposit\n\n` +
          `❌ Minimum amount is 10 ETB.\n\n` +
          `Enter amount:\n\n` +
          `Minimum: 10 ETB`;
        await editOrSendState(chatId, text);
        return;
      }

      session.depositAmount = amount;
      session.step = 'deposit_sms';

      const method = session.depositMethod || 'telebirr';
      const accountNumber = method === 'telebirr' ? '0911002233' : '1000123456789';

      const text =
        `💳 Payment\n\n` +
        `Amount: ${amount} ETB\n\n` +
        `Send ${amount} ETB to:\n` +
        `${accountNumber}\n\n` +
        `Then send the payment SMS here.`;

      await editOrSendState(chatId, text);
    };

    const handleDepositSms = async (chatId: number, smsText: string) => {
      const session = getSession(chatId);
      const amount = session.depositAmount || 100;

      // Add pending deposit transaction
      db.addTransaction({
        id: `tx-d-${Date.now()}`,
        userId: String(chatId),
        title: `Deposit via ${session.depositMethod === 'cbe' ? 'CBE' : 'Telebirr'}`,
        meta: `Ref: ${smsText.slice(0, 30)}`,
        amount: amount,
        currency: 'ETB',
        type: 'positive',
        status: 'pending',
        timestamp: new Date().toISOString(),
      });

      session.step = 'idle';

      const text =
        `⏳ Deposit Pending\n\n` +
        `Amount: ${amount} ETB\n\n` +
        `Your payment is being verified.\n` +
        `You will be notified once completed.`;

      await editOrSendState(chatId, text);
    };

    // ── Step-by-Step Withdrawal Flow ──

    const showWithdrawStart = async (chatId: number) => {
      const session = getSession(chatId);
      session.step = 'withdraw_amount';
      session.withdrawAmount = undefined;
      session.withdrawAccount = undefined;

      const balances = db.getBalances();
      const text =
        `💸 ገንዘብ ማውጣት\n\n` +
        `Withdrawable: ${balances.withdrawable.toFixed(0)} ETB\n\n` +
        `የሚያወጡትን መጠን ያስገቡ።`;

      await editOrSendState(chatId, text);
    };

    const handleWithdrawAmount = async (chatId: number, amount: number) => {
      const session = getSession(chatId);
      const balances = db.getBalances();

      if (isNaN(amount) || amount < 50) {
        const text =
          `💸 ገንዘብ ማውጣት\n\n` +
          `❌ ዝቅተኛው የማውጣት መጠን 50 ETB ነው።\n\n` +
          `Withdrawable: ${balances.withdrawable.toFixed(0)} ETB\n\n` +
          `የሚያወጡትን መጠን ያስገቡ:`;
        await editOrSendState(chatId, text);
        return;
      }

      if (amount > balances.withdrawable) {
        const text =
          `💸 ገንዘብ ማውጣት\n\n` +
          `❌ በቂ Withdrawable ቀሪ ሂሳብ የለዎትም።\n` +
          `Available: ${balances.withdrawable.toFixed(0)} ETB\n\n` +
          `የሚያወጡትን መጠን ያስገቡ:`;
        await editOrSendState(chatId, text);
        return;
      }

      session.withdrawAmount = amount;
      session.step = 'withdraw_account';

      const text =
        `💸 ገንዘብ ማውጣት\n\n` +
        `Amount: ${amount} ETB\n\n` +
        `የክፍያ አካውንት ያስገቡ። (Telebirr ስልክ ወይም CBE)`;

      await editOrSendState(chatId, text);
    };

    const handleWithdrawAccount = async (chatId: number, account: string) => {
      const session = getSession(chatId);
      session.withdrawAccount = account;
      session.step = 'withdraw_confirm';

      const method = account.startsWith('09') || account.startsWith('07') || account.startsWith('+251') ? 'Telebirr' : 'CBE Bank';
      session.withdrawMethod = method;

      const maskedAccount =
        account.length > 4 ? `${account.slice(0, 2)}••••${account.slice(-4)}` : account;

      const text =
        `💸 ማረጋገጫ\n\n` +
        `Amount: ${session.withdrawAmount} ETB\n` +
        `Method: ${method}\n` +
        `Account: ${maskedAccount}\n\n` +
        `ጥያቄዎን ለመላክ ከታች ያለውን ያረጋግጡ።`;

      const inlineKeyboard = [
        [
          { text: '✅ አረጋግጥ (Confirm)', callback_data: 'w_confirm' },
          { text: '❌ ሰርዝ (Cancel)', callback_data: 'w_cancel' },
        ],
      ];

      await editOrSendState(chatId, text, inlineKeyboard);
    };

    const handleWithdrawConfirm = async (chatId: number) => {
      const session = getSession(chatId);
      const amount = session.withdrawAmount || 0;
      const account = session.withdrawAccount || '';
      const method = session.withdrawMethod || 'Telebirr';

      const balances = db.getBalances();
      if (amount > balances.withdrawable) {
        await editOrSendState(
          chatId,
          `❌ በቂ ቀሪ ሂሳብ የለዎትም።\nAvailable: ${balances.withdrawable.toFixed(0)} ETB`
        );
        session.step = 'idle';
        return;
      }

      // Deduct balance & create transaction
      const newWithdrawable = Math.max(0, balances.withdrawable - amount);
      const newTotal = Math.max(0, balances.total - amount);
      db.updateBalances({
        ...balances,
        total: newTotal,
        withdrawable: newWithdrawable,
      });

      db.addTransaction({
        id: `tx-w-${Date.now()}`,
        userId: String(chatId),
        title: `Withdrawal via ${method}`,
        meta: `To: ${account}`,
        amount: -amount,
        currency: 'ETB',
        type: 'negative',
        status: 'pending',
        timestamp: new Date().toISOString(),
      });

      session.step = 'idle';

      const maskedAccount =
        account.length > 4 ? `${account.slice(0, 2)}••••${account.slice(-4)}` : account;

      const text =
        `✅ ጥያቄዎ በተሳካ ሁኔታ ተልኳል!\n\n` +
        `Amount: ${amount} ETB\n` +
        `Method: ${method}\n` +
        `Account: ${maskedAccount}\n` +
        `Status: Pending ⏳\n\n` +
        `ገንዘቡ በ 1-5 ደቂቃ ውስጥ ወደ አካውንትዎ ይላካል።`;

      const inlineKeyboard = [
        [{ text: '👛 ቀሪ ሂሳብ', callback_data: 'nav_balance' }],
        [{ text: '🎮 PLAY', web_app: { url: WEB_APP_URL } }],
      ];

      await editOrSendState(chatId, text, inlineKeyboard);
    };

    // ── Balance, Referral, Profile, Announcements ──

    const showBalance = async (chatId: number) => {
      const session = getSession(chatId);
      session.step = 'idle';

      const balances = db.getBalances();
      const text =
        `👛 ቀሪ ሂሳብ\n\n` +
        `Total: ${balances.total.toFixed(0)} ETB\n` +
        `Withdrawable: ${balances.withdrawable.toFixed(0)} ETB\n` +
        `Playable: ${balances.playable.toFixed(0)} ETB`;

      const inlineKeyboard = [
        [
          { text: '💰 Deposit', callback_data: 'nav_deposit' },
          { text: '💸 Withdraw', callback_data: 'nav_withdraw' },
        ],
        [{ text: '🎮 PLAY', web_app: { url: WEB_APP_URL } }],
      ];

      await editOrSendState(chatId, text, inlineKeyboard);
    };

    const showReferral = async (chatId: number) => {
      const session = getSession(chatId);
      session.step = 'idle';

      const user = db.getUser();
      const me = await bot.getMe();
      const botUsername = me.username || 'bingox2019_bot';
      const refLink = `https://t.me/${botUsername}?start=ref_${user.telegramId || user.id}`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(
        'GameZone ላይ ይቀላቀሉ እና ይጫወቱ! 🎮💰'
      )}`;

      const text =
        `🎁 ግብዣ\n\n` +
        `Invited: ${user.totalReferrals || 0}\n` +
        `Earned: ${(user.referralBonusETB || 0).toFixed(0)} ETB`;

      const inlineKeyboard = [
        [{ text: '🎁 INVITE', url: shareUrl }],
      ];

      await editOrSendState(chatId, text, inlineKeyboard);
    };

    // Profile: ONLY Profile Info, no balance or play button!
    const showProfile = async (chatId: number) => {
      const session = getSession(chatId);
      session.step = 'idle';

      const user = db.getUser();
      const phoneDisplay = user.phone ? user.phone : '+251...';
      const idDisplay = user.telegramId ? user.telegramId : user.id;

      const text =
        `👤 መገለጫ\n\n` +
        `Name: ${user.name || 'Bini'}\n` +
        `Username: ${user.username || '@username'}\n` +
        `Phone: ${phoneDisplay}\n` +
        `ID: #${idDisplay}`;

      // Clean profile info ONLY, no extra buttons underneath
      await editOrSendState(chatId, text);
    };

    const showAnnouncements = async (chatId: number) => {
      const session = getSession(chatId);
      session.step = 'idle';

      const text =
        `📢 ማስታወቂያዎች\n\n` +
        `🔥 Bingo Live የ 50,000 ETB ሽልማት ክፍት ነው!\n` +
        `⚡ ፈጣን የ Telebirr እና CBE ክፍያዎች።\n` +
        `🎯 Keno Turbo በየ 30 ደቂቃው ይካሄዳል።`;

      const inlineKeyboard = [
        [{ text: '🎮 PLAY', web_app: { url: WEB_APP_URL } }],
      ];

      await editOrSendState(chatId, text, inlineKeyboard);
    };

    // ── Command & Reply Keyboard Message Router ──
    bot.on('message', async (msg: any) => {
      if (!msg.text) return;
      const chatId = msg.chat.id;
      const text = msg.text.trim();
      const session = getSession(chatId);

      console.log(`📩 Message [${chatId}]: "${text}" (step: ${session.step})`);

      try {
        // 1. Slash commands & Menu resets
        if (text.startsWith('/start') || text.startsWith('/menu') || text.toLowerCase() === 'start') {
          await showHome(chatId, msg.from);
          return;
        }

        // 2. Reply Keyboard Navigation (Always edits the message in place)
        if (text === '💰 DEPOSIT' || text.toLowerCase().includes('deposit') || text.includes('ገንዘብ ለመጨመር')) {
          await tryDeleteUserMsg(chatId, msg.message_id);
          await showDeposit(chatId);
          return;
        }

        if (text === '💸 WITHDRAW' || text.toLowerCase().includes('withdraw') || text.includes('ገንዘብ ለማውጣት')) {
          await tryDeleteUserMsg(chatId, msg.message_id);
          await showWithdrawStart(chatId);
          return;
        }

        if (text === '👛 BALANCE' || text.toLowerCase().includes('balance') || text.includes('ቀሪ ሂሳብ')) {
          await tryDeleteUserMsg(chatId, msg.message_id);
          await showBalance(chatId);
          return;
        }

        if (text === '🎁 REFERRAL' || text.toLowerCase().includes('referral') || text.includes('ግብዣ')) {
          await tryDeleteUserMsg(chatId, msg.message_id);
          await showReferral(chatId);
          return;
        }

        if (text === '📢 ANNOUNCEMENTS' || text.toLowerCase().includes('announcement') || text.includes('ማስታወቂያ')) {
          await tryDeleteUserMsg(chatId, msg.message_id);
          await showAnnouncements(chatId);
          return;
        }

        if (text === '👤 PROFILE' || text.toLowerCase().includes('profile') || text.includes('መገለጫ')) {
          await tryDeleteUserMsg(chatId, msg.message_id);
          await showProfile(chatId);
          return;
        }

        // 3. User Input States for Deposit
        if (session.step === 'deposit_amount') {
          await tryDeleteUserMsg(chatId, msg.message_id);
          const amt = parseFloat(text.replace(/[^0-9.]/g, ''));
          await handleDepositAmount(chatId, amt);
          return;
        }

        if (session.step === 'deposit_sms') {
          await tryDeleteUserMsg(chatId, msg.message_id);
          await handleDepositSms(chatId, text);
          return;
        }

        // 4. User Input States for Withdrawal
        if (session.step === 'withdraw_amount') {
          await tryDeleteUserMsg(chatId, msg.message_id);
          const amt = parseFloat(text.replace(/[^0-9.]/g, ''));
          await handleWithdrawAmount(chatId, amt);
          return;
        }

        if (session.step === 'withdraw_account') {
          await tryDeleteUserMsg(chatId, msg.message_id);
          await handleWithdrawAccount(chatId, text);
          return;
        }

        // Default fallback: show home menu
        await showHome(chatId, msg.from);
      } catch (err: any) {
        console.error('Error handling message:', err?.message || err);
      }
    });

    // ── Callback Query Router (Inline Buttons) ──
    bot.on('callback_query', async (query: any) => {
      try {
        const chatId = query.message?.chat.id;
        const data = query.data;
        if (!chatId || !data) return;

        await bot.answerCallbackQuery(query.id);

        if (data === 'nav_home') {
          await showHome(chatId, query.from);
        } else if (data === 'nav_deposit') {
          await showDeposit(chatId);
        } else if (data === 'deposit_telebirr') {
          await handleSelectDepositMethod(chatId, 'telebirr');
        } else if (data === 'deposit_cbe') {
          await handleSelectDepositMethod(chatId, 'cbe');
        } else if (data.startsWith('d_amt_')) {
          const amt = parseInt(data.replace('d_amt_', ''), 10);
          await handleDepositAmount(chatId, amt);
        } else if (data === 'nav_withdraw') {
          await showWithdrawStart(chatId);
        } else if (data.startsWith('w_amt_')) {
          const amt = parseInt(data.replace('w_amt_', ''), 10);
          await handleWithdrawAmount(chatId, amt);
        } else if (data === 'w_confirm') {
          await handleWithdrawConfirm(chatId);
        } else if (data === 'w_cancel') {
          const session = getSession(chatId);
          session.step = 'idle';
          await editOrSendState(chatId, `❌ የመውጣት ጥያቄው ተሰርዟል።`, [
            [{ text: '💸 እንደገና ሞክር', callback_data: 'nav_withdraw' }],
            [{ text: '👛 ቀሪ ሂሳብ', callback_data: 'nav_balance' }],
          ]);
        } else if (data === 'nav_balance') {
          await showBalance(chatId);
        } else if (data === 'nav_referral') {
          await showReferral(chatId);
        } else if (data === 'nav_announcements') {
          await showAnnouncements(chatId);
        } else if (data === 'nav_profile') {
          await showProfile(chatId);
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
