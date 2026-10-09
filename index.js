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
  return text.toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

// ===============================
// REPLY TEXT MESSAGES
// ===============================
function getReplyMessages(userMessage) {
  const text = normalizeText(userMessage);

  // Debug ดูข้อความที่เข้ามาใน Console
  console.log('📥 Incoming Message/Data:', text);

  // ==========================================
  // โปรโมชั่น AIS 300 บาท
  // ==========================================
  if (text.includes('ais 300') || text.includes('ais_300') || text.includes('ค่ายเขียว 300')) {
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
  if (text.includes('ais 350') || text.includes('ais_350') || text.includes('ค่ายเขียว 350')) {
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
  if (text.includes('true 300') || text.includes('true_300') || text.includes('ทรู 300')) {
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
  if (text.includes('true 350') || text.includes('true_350') || text.includes('ทรู 350')) {
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
  if (text.includes('แอดมิน') || text.includes('admin') || text.includes('ติดต่อ') || text.includes('แจ้งปัญหา')) {
    return [
      { type: 'text', text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟` },
      { type: 'text', text: `รับทราบค่ะ! แจ้งรายละเอียดหรือปัญหาที่พบไว้ได้เลยนะคะ เดี๋ยว AI ตามแอดมินตัวจริงมาช่วยดูแลคุณลูกค้าทันทีค่ะ 🛠️💬` }
    ];
  }

  return null;
}

// ===============================
// HANDLE EVENT (รองรับทั้ง Message และ Postback)
// ===============================
async function handleEvent(event) {
  try {
    let incomingText = '';

    if (event.type === 'postback' && event.postback && event.postback.data) {
      incomingText = event.postback.data;
    } else if (event.type === 'message' && event.message && event.message.type === 'text') {
      incomingText = event.message.text;
    }

    if (!incomingText) return null;

    const replyMessages = getReplyMessages(incomingText);
    if (!replyMessages) return null;

    return await client.replyMessage(event.replyToken, replyMessages);

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
