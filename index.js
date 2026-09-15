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
// REPLY TEXT (สำหรับผู้ใช้พิมพ์ข้อความมา)
// ===============================
function getReplyText(userMessage) {
  const text = normalizeText(userMessage);

  // ==========================================
  // โปรโมชั่น TRUE 307 บาท
  // ==========================================
  const true307Commands = new Set([
    'TRUE 307 บาท',
    'TRUE 307',
    'โปรโมชั่น TRUE 307 บาท',
    'โปรโมชั่น TRUE 307',
    'TRUE 307 บาท ลดสปีด',
    'TRUE 307 บาท จำกัด 100 GB',
    'TRUE 307 ลดสปีด',
    'TRUE 307 จำกัด 100 GB',
  ]);

  if (true307Commands.has(text)) {
    return `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
           `🔥 แพ็กเกจ TRUE 307 บาท\n` +
           `⚡ ความเร็วเน็ต: 10 Mbps\n` +
           `📊 รายละเอียด: เน็ตลดสปีด จำกัดการใช้งาน 100 GB (ใช้งานได้ 30 วัน)\n` +
           `🚀 การใช้งาน: ใช้งานได้ลื่นไหล ไม่มีสะดุดแน่นอนค่ะ!\n\n` +
           `💡 สนใจรับแพ็กเกจนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ เดี๋ยว AI ส่งต่อให้แอดมินดูแลต่อทันทีค่ะ ✨📱`;
  }

  // ==========================================
  // โปรโมชั่น TRUE 357 บาท
  // ==========================================
  const true357Commands = new Set([
    'TRUE 357 บาท',
    'TRUE 357',
    'โปรโมชั่น TRUE 357 บาท',
    'โปรโมชั่น TRUE 357',
    'TRUE 357 ไม่ลดสปีด',
    'TRUE 357 ไม่อั้น',
    'TRUE 357 บาท ไม่ลดสปีด',
    'TRUE 357 บาท ไม่อั้น',
  ]);

  if (true357Commands.has(text)) {
    return `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
           `🔥 แพ็กเกจ TRUE 357 บาท\n` +
           `⚡ ความเร็วเน็ต: 10 Mbps\n` +
           `♾️ รายละเอียด: เน็ตไม่อั้น ไม่ลดสปีด (ใช้งานได้ 30 วัน)\n` +
           `🚀 การใช้งาน: ใช้งานได้ลื่นไหล ไม่มีสะดุด คุ้มค่าสะใจแน่นอนค่ะ!\n\n` +
           `💡 สนใจรับแพ็กเกจนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ เดี๋ยว AI ส่งต่อให้แอดมินดูแลต่อทันทีค่ะ ✨📱`;
  }

  // ==========================================
  // โปรโมชั่น AIS 300 บาท
  // ==========================================
  const ais300Commands = new Set([
    'AIS 300 บาท',
    'AIS 300',
    'โปรโมชั่น AIS 300 บาท',
    'โปรโมชั่น AIS 300',
    'AIS 300 บาท ลดสปีด',
    'AIS 300 บาท จำกัด 100 GB',
    'AIS 300 ลดสปีด',
    'AIS 300 จำกัด 100 GB',
  ]);

  if (ais300Commands.has(text)) {
    return `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
           `💚 แพ็กเกจ AIS 300 บาท\n` +
           `⚡ ความเร็วเน็ต: 10 Mbps\n` +
           `📊 รายละเอียด: เน็ตลดสปีด จำกัดการใช้งาน 100 GB (ใช้งานได้ 30 วัน)\n` +
           `🚀 การใช้งาน: ใช้งานได้ลื่นไหล ไม่มีสะดุดค่ะ!\n\n` +
           `💡 สนใจรับแพ็กเกจนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ เดี๋ยว AI ส่งต่อให้แอดมินดูแลต่อทันทีค่ะ ✨📱`;
  }

  // ==========================================
  // โปรโมชั่น AIS 350 บาท
  // ==========================================
  const ais350Commands = new Set([
    'AIS 350 บาท',
    'AIS 350',
    'โปรโมชั่น AIS 350 บาท',
    'โปรโมชั่น AIS 350',
    'AIS 350 ไม่ลดสปีด',
    'AIS 350 ไม่อั้น',
    'AIS 350 บาท ไม่ลดสปีด',
    'AIS 350 บาท ไม่อั้น',
  ]);

  if (ais350Commands.has(text)) {
    return `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
           `💚 แพ็กเกจ AIS 350 บาท\n` +
           `⚡ ความเร็วเน็ต: 10 Mbps\n` +
           `♾️ รายละเอียด: เน็ตไม่อั้น ไม่ลดสปีด (ใช้งานได้ 30 วัน)\n` +
           `🚀 การใช้งาน: ใช้งานได้ลื่นไหล ไม่มีสะดุด เต็มอิ่มจุใจค่ะ!\n\n` +
           `💡 สนใจรับแพ็กเกจนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ เดี๋ยว AI ส่งต่อให้แอดมินดูแลต่อทันทีค่ะ ✨📱`;
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
    return '🤖 AI สมาร์ท: รับเรื่องต่อโปรโมชั่นให้เรียบร้อยค่ะ กำลังตามแอดมินใจดีมาดูแลต่อให้อย่างด่วนเลยนะคะ รอสักครู่นะคะ ⏳📅';
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
    return '🤖 AI สมาร์ท: รับทราบค่ะ! แจ้งรายละเอียดหรือปัญหาที่พบไว้ได้เลยนะคะ เดี๋ยว AI ตามแอดมินตัวจริงมาช่วยดูแลคุณลูกค้าทันทีค่ะ 🛠️💬';
  }

  return null;
}

// ===============================
// HANDLE POSTBACK (สำหรับปุ่ม Rich Menu แบบ Postback)
// ===============================
function handlePostback(event) {
  if (!event.postback || !event.postback.data) {
    return null;
  }

  const data = normalizeText(event.postback.data);

  const postbackReplies = {
    // รองรับทั้งแบบระบุรหัส และแบบพิมพ์ข้อความสั่งการผ่านปุ่ม
    'promotion_true_307': getReplyText('TRUE 307 บาท'),
    'true 307': getReplyText('TRUE 307 บาท'),
    'true 307 บาท': getReplyText('TRUE 307 บาท'),

    'promotion_true_357': getReplyText('TRUE 357 บาท'),
    'true 357': getReplyText('TRUE 357 บาท'),
    'true 357 บาท': getReplyText('TRUE 357 บาท'),

    'promotion_ais_300': getReplyText('AIS 300 บาท'),
    'ais 300': getReplyText('AIS 300 บาท'),
    'ais 300 บาท': getReplyText('AIS 300 บาท'),

    'promotion_ais_350': getReplyText('AIS 350 บาท'),
    'ais 350': getReplyText('AIS 350 บาท'),
    'ais 350 บาท': getReplyText('AIS 350 บาท'),

    'renew': '🤖 AI สมาร์ท: รับเรื่องต่อโปรโมชั่นให้เรียบร้อยค่ะ กำลังตามแอดมินใจดีมาดูแลต่อให้อย่างด่วนเลยนะคะ รอสักครู่นะคะ ⏳📅',
    'admin': '🤖 AI สมาร์ท: รับทราบค่ะ! แจ้งรายละเอียดหรือปัญหาที่พบไว้ได้เลยนะคะ เดี๋ยว AI ตามแอดมินตัวจริงมาช่วยดูแลคุณลูกค้าทันทีค่ะ 🛠️💬',
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

      res.status(200).json({ status: 'ok' });

      if (events.length > 0) {
        await Promise.allSettled(
          events.map(event => handleEvent(event))
        );
      }

    } catch (error) {
      console.error('❌ Webhook Error:', error);

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
