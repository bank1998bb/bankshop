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
  return text.toString().trim().replace(/\s+/g, ' ');
}

// ===============================
// REPLY TEXT MESSAGES
// ===============================
function getReplyMessages(userMessage) {
  const text = normalizeText(userMessage);

  // ==========================================
  // โปรโมชั่น AIS 300 บาท
  // ==========================================
  const ais300Commands = new Set([
    'ais 300 บาท', 'ais 300', 'โปรโมชั่น ais 300 บาท', 'โปรโมชั่น ais 300',
    'ais 300 บาท ลดสปีด', 'ais 300 บาท จำกัด 100 gb', 'ais_300', 'promotion_ais_300'
  ]);

  if (ais300Commands.has(text) || text.includes('ais 300') || text.includes('ais_300')) {
    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
              `🟢 แพ็กเกจ AIS 300 บาท\n` +
              `⚡ ความเร็วเน็ต: 15 Mbps\n` +
              `📊 รายละเอียด: เน็ตลดสปีด จำกัดการใช้งาน 100 GB (ใช้งานได้ 30 วัน)\n` +
              `🚀 การใช้งาน: ใช้งานได้ลื่นไหล ไม่มีสะดุดค่ะ!`
      },
      {
        type: 'text',
        text: `💡 สนใจรับแพ็กเกจนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ เดี๋ยว AI ส่งต่อให้แอดมินดูแลต่อทันทีค่ะ ✨📱`
      }
    ];
  }

  // ==========================================
  // โปรโมชั่น AIS 350 บาท
  // ==========================================
  const ais350Commands = new Set([
    'ais 350 บาท', 'ais 350', 'โปรโมชั่น ais 350 บาท', 'โปรโมชั่น ais 350',
    'ais 350 ไม่ลดสปีด', 'ais 350 ไม่อั้น', 'ais_350', 'promotion_ais_350'
  ]);

  if (ais350Commands.has(text) || text.includes('ais 350') || text.includes('ais_350')) {
    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
              `🟢 แพ็กเกจ AIS 350 บาท\n` +
              `⚡ ความเร็วเน็ต: 15 Mbps\n` +
              `♾️ รายละเอียด: เน็ตไม่อั้น ไม่ลดสปีด (ใช้งานได้ 30 วัน)\n` +
              `🚀 การใช้งาน: ใช้งานได้ลื่นไหล ไม่มีสะดุด เต็มอิ่มจุใจค่ะ!`
      },
      {
        type: 'text',
        text: `💡 สนใจรับแพ็กเกจนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ เดี๋ยว AI ส่งต่อให้แอดมินดูแลต่อทันทีค่ะ ✨📱`
      }
    ];
  }

  // ==========================================
  // โปรโมชั่น TRUE 300 บาท
  // ==========================================
  const true300Commands = new Set([
    'true 300 บาท', 'true 300', 'โปรโมชั่น true 300 บาท', 'โปรโมชั่น true 300',
    'ทรู 300 บาท', 'ทรู 300', 'true 300 บาท ลดสปีด', 'true_300', 'promotion_true_300'
  ]);

  if (true300Commands.has(text) || text.includes('true 300') || text.includes('true_300') || text.includes('ทรู 300')) {
    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
              `🔴 แพ็กเกจ TRUE 300 บาท\n` +
              `⚡ ความเร็วเน็ต: 15 Mbps\n` +
              `📊 รายละเอียด: เน็ตลดสปีด จำกัดการใช้งาน 100 GB (ใช้งานได้ 30 วัน)\n` +
              `🚀 การใช้งาน: ใช้งานได้ลื่นไหล ไม่มีสะดุดค่ะ!`
      },
      {
        type: 'text',
        text: `💡 สนใจรับแพ็กเกจนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ เดี๋ยว AI ส่งต่อให้แอดมินดูแลต่อทันทีค่ะ ✨📱`
      }
    ];
  }

  // ==========================================
  // โปรโมชั่น TRUE 350 บาท
  // ==========================================
  const true350Commands = new Set([
    'true 350 บาท', 'true 350', 'โปรโมชั่น true 350 บาท', 'โปรโมชั่น true 350',
    'ทรู 350 บาท', 'ทรู 350', 'true 350 ไม่ลดสปีด', 'true 350 ไม่อั้น', 'true_350', 'promotion_true_350'
  ]);

  if (true350Commands.has(text) || text.includes('true 350') || text.includes('true_350') || text.includes('ทรู 350')) {
    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
              `🔴 แพ็กเกจ TRUE 350 บาท\n` +
              `⚡ ความเร็วเน็ต: 15 Mbps\n` +
              `♾️ รายละเอียด: เน็ตไม่อั้น ไม่ลดสปีด (ใช้งานได้ 30 วัน)\n` +
              `🚀 การใช้งาน: ใช้งานได้ลื่นไหล ไม่มีสะดุด เต็มอิ่มจุใจค่ะ!`
      },
      {
        type: 'text',
        text: `💡 สนใจรับแพ็กเกจนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ เดี๋ยว AI ส่งต่อให้แอดมินดูแลต่อทันทีค่ะ ✨📱`
      }
    ];
  }

  // ==========================================
  // ติดต่อแอดมิน / แจ้งปัญหา
  // ==========================================
  const adminCommands = new Set(['ติดต่อแอดมิน', 'แจ้งปัญหา/สอบถาม', 'แจ้งปัญหา', 'สอบถาม', 'ติดต่อเจ้าหน้าที่', 'admin']);
  if (adminCommands.has(text) || text.includes('แอดมิน') || text.includes('admin')) {
    return [
      { type: 'text', text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟` },
      { type: 'text', text: `รับทราบค่ะ! แจ้งรายละเอียดหรือปัญหาที่พบไว้ได้เลยนะคะ เดี๋ยว AI ตามแอดมินตัวจริงมาช่วยดูแลคุณลูกค้าทันทีค่ะ 🛠️💬` }
    ];
  }

  return null;
}

// ===============================
// HANDLE POSTBACK (รองรับการกดจาก Rich Menu)
// ===============================
function handlePostback(event) {
  if (!event.postback || !event.postback.data) return null;

  const data = normalizeText(event.postback.data);
  console.log('📌 Received Postback Data:', data); // ช่วยให้คุณดูค่าที่ส่งมาจากลิสต์เมนูใน Log ได้

  // Map ค่า Postback data ให้ตรงกับคำสั่งข้อความ
  const postbackMap = {
    'promotion_ais_300': 'AIS 300 บาท',
    'ais 300': 'AIS 300 บาท',
    'ais_300': 'AIS 300 บาท',
    'promotion_ais_350': 'AIS 350 บาท',
    'ais 350': 'AIS 350 บาท',
    'ais_350': 'AIS 350 บาท',
    'promotion_true_300': 'TRUE 300 บาท',
    'true 300': 'TRUE 300 บาท',
    'true_300': 'TRUE 300 บาท',
    'promotion_true_350': 'TRUE 350 บาท',
    'true 350': 'TRUE 350 บาท',
    'true_350': 'TRUE 350 บาท',
    'admin': 'ติดต่อแอดมิน',
    'ติดต่อแอดมิน': 'ติดต่อแอดมิน'
  };

  const targetMessage = postbackMap[data] || data;
  return getReplyMessages(targetMessage);
}

// ===============================
// HANDLE EVENT
// ===============================
async function handleEvent(event) {
  try {
    if (event.type === 'postback') {
      const replyMessages = handlePostback(event);
      if (!replyMessages) return null;
      return await client.replyMessage(event.replyToken, replyMessages);
    }

    if (
      event.type === 'message' &&
      event.message &&
      event.message.type === 'text'
    ) {
      const userMessage = normalizeText(event.message.text);
      const replyMessages = getReplyMessages(userMessage);
      if (!replyMessages) return null;
      return await client.replyMessage(event.replyToken, replyMessages);
    }

    return null;

  } catch (error) {
    console.error(
      '❌ Error handling event:',
      error && error.response ? error.response.data : error
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
