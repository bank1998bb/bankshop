const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();

// ===============================
// LINE CLIENT
// ===============================
const client = new line.Client(config);

// ===============================
// WEBHOOK TEST
// ===============================
app.get('/webhook', (req, res) => {
  res.status(200).send('OK');
});

// ===============================
// NORMALIZE TEXT
// ===============================
function normalizeText(text) {
  if (!text) return '';

  return text
    .toString()
    .trim()
    .replace(/\s+/g, ' ');
}

// ===============================
// REPLY TEXT
// ===============================
function getReplyText(userMessage) {
  const text = normalizeText(userMessage);

  // ==========================================
  // โปรโมชั่น
  // ==========================================
  const promotionCommands = new Set([
    'TRUE 357 ไม่ลดสปีด',
    'TRUE 357 ไม่ลดความเร็ว',
    'TRUE 357 ไม่จำกัดความเร็ว',
    'TRUE 357 ไม่อั้น',
    'TRUE 357 ไม่อั้นไม่ลดสปีด',
    'TRUE 357 ไม่อั้นไม่ลดความเร็ว',
    'TRUE 357 บาท ไม่ลดสปีด',
    'TRUE 357 บาท ไม่ลดความเร็ว',
    'TRUE 357 บาท ไม่จำกัดความเร็ว',
    'TRUE 357 บาท ไม่อั้น',
    'TRUE 357 บาท ไม่อั้นไม่ลดสปีด',
    'TRUE 357 บาท ไม่อั้นไม่ลดความเร็ว',

    'AIS 350 ไม่ลดสปีด',
    'AIS 350 ไม่ลดความเร็ว',
    'AIS 350 ไม่จำกัดความเร็ว',
    'AIS 350 ไม่อั้น',
    'AIS 350 ไม่อั้นไม่ลดสปีด',
    'AIS 350 ไม่อั้นไม่ลดความเร็ว',
    'AIS 350 บาท ไม่ลดสปีด',
    'AIS 350 บาท ไม่ลดความเร็ว',
    'AIS 350 บาท ไม่จำกัดความเร็ว',
    'AIS 350 บาท ไม่อั้น',
    'AIS 350 บาท ไม่อั้นไม่ลดสปีด',
    'AIS 350 บาท ไม่อั้นไม่ลดความเร็ว',

    'AIS 300 บาท ลดสปีด',
    'AIS 300 บาท จำกัด 100 GB',
    'AIS 300 ลดสปีด',
    'AIS 300 จำกัด 100 GB',

    'TRUE 307 บาท ลดสปีด',
    'TRUE 307 บาท จำกัด 100 GB',
    'TRUE 307 ลดสปีด',
    'TRUE 307 จำกัด 100 GB',

    'โปรโมชั่น AIS 300 ลดสปีด',
    'โปรโมชั่น AIS 300 จำกัด 100 GB',

    'โปรโมชั่น AIS 350 ไม่ลดสปีด',
    'โปรโมชั่น AIS 350 ไม่ลดความเร็ว',
    'โปรโมชั่น AIS 350 ไม่จำกัดความเร็ว',
    'โปรโมชั่น AIS 350 ไม่อั้น',

    'โปรโมชั่น TRUE 307 ลดสปีด',
    'โปรโมชั่น TRUE 307 จำกัด 100 GB',

    'โปรโมชั่น TRUE 357 ไม่ลดสปีด',
    'โปรโมชั่น TRUE 357 ไม่ลดความเร็ว',
    'โปรโมชั่น TRUE 357 ไม่จำกัดความเร็ว',
    'โปรโมชั่น TRUE 357 ไม่อั้น',

    // รองรับข้อความเดิม
    'AIS 300 บาท ลดสปีด',
    'AIS 350 บาท ไม่ลดสปีด',
    'TRUE 307 บาท ลดสปีด',
    'TRUE 357 บาท ไม่ลดสปีด',
  ]);

  if (promotionCommands.has(text)) {
    return '🤖 AI สมาร์ท: สนใจแพ็กเกจนี้ แจ้งเบอร์โทรไว้ได้เลยค่ะ เดี๋ยวแอดมินดูแลต่อตามคิวให้นะคะ ✨📱';
  }

  // ==========================================
  // ต่อโปรโมชั่น
  // ==========================================
  const renewCommands = new Set([
    'ต่อโปรโปรโมชั่น',
    'ต่อโปรโมชั่น',
    'สอบถามโปรโมชั่น',
    'ต่อโปร',
    'ต่ออายุโปรโมชั่น',
  ]);

  if (renewCommands.has(text)) {
    return '🤖 AI สมาร์ท: กำลังติดต่อแอดมินเพื่อต่อโปรให้ค่ะ กรุณารอสักครู่นะคะ ⏳📅';
  }

  // ==========================================
  // ติดต่อแอดมิน / แจ้งปัญหา
  // ==========================================
  const adminCommands = new Set([
    'ติดต่อแอดมิน',
    'แจ้งปัญหา/สอบถาม',
    'แจ้งปัญหา',
    'สอบถาม',
    'ติดต่อเจ้าหน้าที่',
    'แจ้งปัญหาและสอบถาม',
  ]);

  if (adminCommands.has(text)) {
    return '🤖 AI สมาร์ท: แจ้งรายละเอียดปัญหาไว้ได้เลยค่ะ กำลังตามแอดมินให้ด่วนเลยค่ะ 🛠️💬';
  }

  return null;
}

// ===============================
// HANDLE POSTBACK
// ===============================
function handlePostback(event) {
  if (!event.postback || !event.postback.data) {
    return null;
  }

  // ตัวอย่าง:
  // data=promotion_true_357
  // data=promotion_ais_350
  // data=renew
  // data=admin

  const data = normalizeText(event.postback.data);

  const postbackReplies = {
    'promotion_true_357':
      '🤖 AI สมาร์ท: สนใจแพ็กเกจ TRUE 357 บาท ไม่ลดสปีด แจ้งเบอร์โทรไว้ได้เลยค่ะ เดี๋ยวแอดมินดูแลต่อตามคิวให้นะคะ ✨📱',

    'promotion_ais_350':
      '🤖 AI สมาร์ท: สนใจแพ็กเกจ AIS 350 บาท ไม่ลดสปีด แจ้งเบอร์โทรไว้ได้เลยค่ะ เดี๋ยวแอดมินดูแลต่อตามคิวให้นะคะ ✨📱',

    'promotion_true_307':
      '🤖 AI สมาร์ท: สนใจแพ็กเกจ TRUE 307 บาท จำกัด 100 GB แจ้งเบอร์โทรไว้ได้เลยค่ะ เดี๋ยวแอดมินดูแลต่อตามคิวให้นะคะ ✨📱',

    'promotion_ais_300':
      '🤖 AI สมาร์ท: สนใจแพ็กเกจ AIS 300 บาท จำกัด 100 GB แจ้งเบอร์โทรไว้ได้เลยค่ะ เดี๋ยวแอดมินดูแลต่อตามคิวให้นะคะ ✨📱',

    'renew':
      '🤖 AI สมาร์ท: กำลังติดต่อแอดมินเพื่อต่อโปรให้ค่ะ กรุณารอสักครู่นะคะ ⏳📅',

    'admin':
      '🤖 AI สมาร์ท: แจ้งรายละเอียดปัญหาไว้ได้เลยค่ะ กำลังตามแอดมินให้ด่วนเลยค่ะ 🛠️💬',
  };

  return postbackReplies[data] || null;
}

// ===============================
// HANDLE EVENT
// ===============================
async function handleEvent(event) {
  try {
    // --------------------------------
    // POSTBACK
    // --------------------------------
    if (event.type === 'postback') {
      const replyText = handlePostback(event);

      if (!replyText) {
        return null;
      }

      return await client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyText,
      });
    }

    // --------------------------------
    // TEXT MESSAGE
    // --------------------------------
    if (
      event.type === 'message' &&
      event.message &&
      event.message.type === 'text'
    ) {
      const userMessage = normalizeText(event.message.text);

      const replyText = getReplyText(userMessage);

      // ไม่มีคำสั่งที่ตรงกัน
      if (!replyText) {
        return null;
      }

      return await client.replyMessage(event.replyToken, {
        type: 'text',
        text: replyText,
      });
    }

    return null;

  } catch (error) {
    console.error(
      '❌ Error handling event:',
      error && error.response
        ? error.response.data
        : error
    );

    return null;
  }
}

// ===============================
// WEBHOOK
// ===============================
app.post(
  '/webhook',
  line.middleware(config),
  async (req, res) => {

    try {
      const events = req.body.events || [];

      // ตอบ LINE ว่าได้รับ webhook แล้วทันที
      res.status(200).json({ status: 'ok' });

      // ประมวลผลต่อเบื้องหลัง
      if (events.length > 0) {
        await Promise.allSettled(
          events.map(event => handleEvent(event))
        );
      }

    } catch (error) {
      console.error('❌ Webhook Error:', error);

      // ถ้ายังไม่ได้ส่ง response
      if (!res.headersSent) {
        res.status(200).json({ status: 'ok' });
      }
    }
  }
);

// ===============================
// ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);

  if (!res.headersSent) {
    res.status(200).json({ status: 'ok' });
  }
});

// ===============================
// SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 LINE Bot Server running on port ${PORT}`);
  console.log(`📡 Webhook: /webhook`);
});
