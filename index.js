const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();
const client = new line.Client(config);

// ===============================
// DATABASE / PACKAGES DATA
// ===============================
const PACKAGES = [
  {
    keywords: ['ais 300', 'ais_300', 'ค่ายเขียว 300'],
    brand: 'AIS',
    price: '300 บาท',
    speed: '10 Mbps',
    detail: 'เน็ตไม่อั้น (จำกัดการใช้งาน 100 GB ถ้าใช้งานหมดแล้วคือหมดเลย) นาน 30 วัน',
    highlight: 'ใช้งานได้ลื่นไหล คุ้มค่าโดนใจ'
  },
  {
    keywords: ['ais 350', 'ais_350', 'ค่ายเขียว 350'],
    brand: 'AIS',
    price: '350 บาท',
    speed: '10 Mbps',
    detail: 'เน็ตไม่อั้น ไม่ลดสปีด ใช้งานได้ไม่อั้น นาน 30 วัน',
    highlight: 'สตรีมมิ่ง ดูหนัง ฟังเพลง จุใจไม่มีสะดุด'
  },
  {
    keywords: ['true 300', 'true_300', 'ทรู 300'],
    brand: 'TRUE',
    price: '300 บาท',
    speed: '15 Mbps',
    detail: 'เน็ตไม่อั้น (จำกัดการใช้งาน 100 GB ถ้าใช้งานหมดแล้วคือหมดเลย) นาน 30 วัน',
    highlight: 'เน็ตแรงเต็มสปีด คุ้มค่าประหยัด'
  },
  {
    keywords: ['true 350', 'true_350', 'ทรู 350'],
    brand: 'TRUE',
    price: '350 บาท',
    speed: '15 Mbps',
    detail: 'เน็ตไม่อั้น ไม่ลดสปีด ใช้งานได้ไม่อั้น นาน 30 วัน',
    highlight: 'แรงไม่มีตก เต็มอิ่มทุกความบันเทิง'
  }
];

// ===============================
// WEBHOOK TEST
// ===============================
app.get('/webhook', (req, res) => {
  res.status(200).send('OK - LINE Bot Server is running.');
});

// ===============================
// NORMALIZE TEXT
// ===============================
function normalizeText(text) {
  if (!text) return '';
  return text.toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

// ===============================
// REPLY MESSAGES GENERATOR
// ===============================
function getReplyMessages(rawText) {
  const text = normalizeText(rawText);
  console.log('🔍 ข้อความหรือ Data ที่เข้ามาประมวลผล:', text);

  // 1. ตรวจสอบแพ็กเกจอินเทอร์เน็ตจากอาร์เรย์ข้อมูล
  const matchedPackage = PACKAGES.find(pkg => 
    pkg.keywords.some(keyword => text.includes(keyword))
  );

  if (matchedPackage) {
    const brandEmoji = matchedPackage.brand === 'AIS' ? '🟢' : '🔴';
    return [
      {
        type: 'text',
        text: `🤖 **AI สมาร์ท พร้อมให้บริการค่ะ!** 🌟\n\n` +
              `${brandEmoji} **แพ็กเกจ ${matchedPackage.brand} ${matchedPackage.price}**\n` +
              `⚡ **ความเร็วสูงสุด:** ${matchedPackage.speed}\n` +
              `📍 **เงื่อนไข:** ${matchedPackage.detail}\n` +
              `🚀 **จุดเด่น:** ${matchedPackage.highlight}\n\n` +
              `💳 *ราคาเบ็ดเสร็จ ไม่มีบวกเพิ่ม*`
      },
      {
        type: 'text',
        text: `💡 **สนใจรับโปรโมชั่นนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ** เดี๋ยวระบบส่งต่อให้แอดมินดูแลการสมัครให้ทันทีค่ะ ✨📱`
      }
    ];
  }

  // 2. ติดต่อแอดมิน / แจ้งปัญหา
  if (['แอดมิน', 'admin', 'ติดต่อ', 'แจ้งปัญหา', 'เจ้าหน้าที่'].some(kw => text.includes(kw))) {
    return [
      { 
        type: 'text', 
        text: `🤖 **AI สมาร์ท ยินดีให้บริการค่ะ!** 🌟\n\n` +
              `รับทราบค่ะ! คุณลูกค้าสามารถพิมพ์แจ้งรายละเอียดหรือปัญหาที่พบไว้ได้เลยนะคะ เดี๋ยวแอดมินตัวจริงรีบเข้ามาดูแลทันทีค่ะ 🛠️💬` 
      }
    ];
  }

  return null;
}

// ===============================
// HANDLE EVENT
// ===============================
async function handleEvent(event) {
  try {
    let payload = '';

    if (event.type === 'postback' && event.postback?.data) {
      payload = event.postback.data;
    } else if (event.type === 'message' && event.message?.type === 'text') {
      payload = event.message.text;
    }

    if (!payload) return null;

    const replyMessages = getReplyMessages(payload);
    if (!replyMessages) return null;

    return await client.replyMessage(event.replyToken, replyMessages);

  } catch (error) {
    console.error('❌ Error handling event:', error);
    return null;
  }
}

// ===============================
// WEBHOOK ENDPOINT
// ===============================
app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];
    res.status(200).json({ status: 'ok' });

    if (events.length > 0) {
      await Promise.allSettled(events.map(event => handleEvent(event)));
    }
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    if (!res.headersSent) {
      res.status(200).json({ status: 'ok' });
    }
  }
});

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
// SERVER START
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 LINE Bot Server running on port ${PORT}`);
  console.log(`📡 Webhook Endpoint: /webhook`);
});
