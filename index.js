const express = require('express');
const line = require('@line/bot-sdk');
const fs = require('fs');
const crypto = require('crypto');
const Tesseract = require('tesseract.js');

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
// ไฟล์เก็บประวัติสลิปที่ใช้แล้ว (ป้องกันสลิปซ้ำ)
// ===============================
const DB_FILE = './used_slips.json';

function getUsedSlips() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data);
}

function saveUsedSlip(identifier) {
  const slips = getUsedSlips();
  slips.push(identifier);
  fs.writeFileSync(DB_FILE, JSON.stringify(slips, null, 2));
}

// ===============================
// เก็บสถานะผู้ใช้ว่าอยู่ระหว่างรอสลิปค่ายแดงหรือไม่
// ===============================
const waitingForRedSlip = new Set();

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
function getReplyMessages(userMessage, userId) {
  const text = normalizeText(userMessage);

  // ==========================================
  // โปรโมชั่น ค่ายแดง
  // ==========================================
  const redCommands = new Set([
    'ค่ายแดง',
    'ค่ายแดง 52 บาท',
    'ค่ายแดง 52',
    'โปรโมชั่นค่ายแดง',
    'โปรค่ายแดง 52 บาท',
    'True 52 บาท',
    'ทรู 52',
  ]);

  if (redCommands.has(text)) {
    // บันทึกสถานะว่าผู้ใช้กำลังทำรายการค่ายแดง (รอสลิป)
    if (userId) waitingForRedSlip.add(userId);

    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
              `🔴 แพ็กเกจค่ายแดง\n` +
              `⚡ รายละเอียดแพ็กเกจ: 52 บาท\n` +
              `🚀 ความเร็วเน็ต: 6 Mbps\n` +
              `♾️ รายละเอียด: เน็ตไม่อั้น ไม่ลดสปีด ไม่จำกัดการใช้งาน\n` +
              `⏳ ระยะเวลาการใช้งาน: 7 วัน\n` +
              `✨ การใช้งาน: ใช้งานได้ลื่นไหลไม่มีสะดุดค่ะ!`
      },
      {
        type: 'image',
        originalContentUrl: 'https://i.ibb.co/tMR5CxTV/line-oa-chat-260714-124114.jpg',
        previewImageUrl: 'https://i.ibb.co/tMR5CxTV/line-oa-chat-260714-124114.jpg'
      },
      {
        type: 'text',
        text: `💰 มีค่าบริการ 99 บาท ชำระค่าบริการเสร็จส่งสลิปเข้ามาในแชตได้เลย ระบบจะตรวจสอบสลิปอัตโนมัติและส่งขั้นตอนการสมัครให้ทันทีค่ะ 😊`
      }
    ];
  }

  // หากพิมพ์ข้อความอื่นๆ ที่ไม่ใช่ค่ายแดง ให้ลบสถานะรอสลิปออก (ถ้ามี)
  if (userId) waitingForRedSlip.delete(userId);

  // ==========================================
  // โปรโมชั่น ค่ายเขียว 300 บาท
  // ==========================================
  const green300Commands = new Set([
    'ค่ายเขียว 300 บาท',
    'ค่ายเขียว 300',
    'โปรโมชั่นค่ายเขียว 300 บาท',
    'โปรโมชั่นค่ายเขียว 300',
    'ค่ายเขียว 300 บาท ลดสปีด',
    'ค่ายเขียว 300 บาท จำกัด 100 GB',
    'ค่ายเขียว 300 ลดสปีด',
    'ค่ายเขียว 300 จำกัด 100 GB',
    'AIS 300 บาท',
    'AIS 300',
    'โปรโมชั่น AIS 300 บาท',
    'โปรโมชั่น AIS 300',
  ]);

  if (green300Commands.has(text)) {
    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
              `🟢 แพ็กเกจค่ายเขียว 300 บาท\n` +
              `⚡ ความเร็วเน็ต: 10 Mbps\n` +
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
  // โปรโมชั่น ค่ายเขียว 350 บาท
  // ==========================================
  const green350Commands = new Set([
    'ค่ายเขียว 350 บาท',
    'ค่ายเขียว 350',
    'โปรโมชั่นค่ายเขียว 350 บาท',
    'โปรโมชั่นค่ายเขียว 350',
    'ค่ายเขียว 350 ไม่ลดสปีด',
    'ค่ายเขียว 350 ไม่อั้น',
    'ค่ายเขียว 350 บาท ไม่ลดสปีด',
    'ค่ายเขียว 350 บาท ไม่อั้น',
    'AIS 350 บาท',
    'AIS 350',
    'โปรโมชั่น AIS 350 บาท',
    'โปรโมชั่น AIS 350',
  ]);

  if (green350Commands.has(text)) {
    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
              `🟢 แพ็กเกจค่ายเขียว 350 บาท\n` +
              `⚡ ความเร็วเน็ต: 10 Mbps\n` +
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
    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟`
      },
      {
        type: 'text',
        text: `รับเรื่องต่อโปรโมชั่นให้เรียบร้อยค่ะ กำลังตามแอดมินใจดีมาดูแลต่อให้อย่างด่วนเลยนะคะ รอสักครู่นะคะ ⏳📅`
      }
    ];
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
    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟`
      },
      {
        type: 'text',
        text: `รับทราบค่ะ! แจ้งรายละเอียดหรือปัญหาที่พบไว้ได้เลยนะคะ เดี๋ยว AI ตามแอดมินตัวจริงมาช่วยดูแลคุณลูกค้าทันทีค่ะ 🛠️💬`
      }
    ];
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

  const data = normalizeText(event.postback.data);
  const userId = event.source.userId;

  const postbackMap = {
    'promotion_ais_300': 'ค่ายเขียว 300 บาท',
    'ais 300': 'ค่ายเขียว 300 บาท',
    'ais 300 บาท': 'ค่ายเขียว 300 บาท',
    'green_300': 'ค่ายเขียว 300 บาท',

    'promotion_ais_350': 'ค่ายเขียว 350 บาท',
    'ais 350': 'ค่ายเขียว 350 บาท',
    'ais 350 บาท': 'ค่ายเขียว 350 บาท',
    'green_350': 'ค่ายเขียว 350 บาท',

    'promotion_red': 'ค่ายแดง',
    'red': 'ค่ายแดง',
    'ค่ายแดง': 'ค่ายแดง',
    'ค่ายแดง 52 บาท': 'ค่ายแดง',
  };

  if (postbackMap[data]) {
    return getReplyMessages(postbackMap[data], userId);
  }

  if (userId) waitingForRedSlip.delete(userId);

  if (data === 'renew' || data === 'ต่อโปร') {
    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟`
      },
      {
        type: 'text',
        text: `รับเรื่องต่อโปรโมชั่นให้เรียบร้อยค่ะ กำลังตามแอดมินใจดีมาดูแลต่อให้อย่างด่วนเลยนะคะ รอสักครู่นะคะ ⏳📅`
      }
    ];
  }

  if (data === 'admin' || data === 'ติดต่อแอดมิน') {
    return [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟`
      },
      {
        type: 'text',
        text: `รับทราบค่ะ! แจ้งรายละเอียดหรือปัญหาที่พบไว้ได้เลยนะคะ เดี๋ยว AI ตามแอดมินตัวจริงมาช่วยดูแลคุณลูกค้าทันทีค่ะ 🛠️💬`
      }
    ];
  }

  return null;
}

// ===============================
// HANDLE IMAGE (ตรวจสอบเฉพาะเมื่อเลือกเมนูค่ายแดงแล้วส่งรูปภาพ)
// ===============================
async function handleImageMessage(event) {
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  // ตรวจสอบว่าผู้ใช้คนนี้ได้เลือกเมนู "ค่ายแดง" มาก่อนหน้านี้หรือไม่
  if (!waitingForRedSlip.has(userId)) {
    console.log('ℹ️ ผู้ใช้ไม่ได้อยู่ในขั้นตอนเลือกค่ายแดง ข้ามการตรวจสอบสลิป');
    return;
  }

  try {
    // 1. ดาวน์โหลดรูปภาพจาก LINE มาประมวลผล
    const stream = await client.getMessageContent(event.message.id);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 2. ใช้ Tesseract.js ตรวจสอบว่าภาพนี้มีคีย์เวิร์ดของสลิปโอนเงินหรือ QR Code หรือไม่
    const { data: { text } } = await Tesseract.recognize(buffer, 'tha+eng');
    const cleanText = text.replace(/\s+/g, '').toLowerCase();

    // เงื่อนไขตรวจสอบว่าเป็นสลิปธนาคาร / มี QR Code หรือไม่
    const isSlip = 
      cleanText.includes('qrcode') || 
      cleanText.includes('qr') || 
      cleanText.includes('slipid') || 
      cleanText.includes('โอนเงินสำเร็จ') ||
      cleanText.includes('ref.') ||
      cleanText.includes('ref:') ||
      cleanText.includes('bangkokbank') || 
      cleanText.includes('kbank') || 
      cleanText.includes('scb') || 
      cleanText.includes('krungthai') || 
      cleanText.includes('krungsri') ||
      cleanText.includes('truemoney');

    // ถ้าไม่ใช่สลิป ให้ข้ามการตรวจสอบไปเลยทันที
    if (!isSlip) {
      console.log('ℹ️️ รูปภาพที่ส่งมาไม่ใช่สลิปโอนเงิน (ไม่มี QR Code หรือคำว่าสลิป) ข้ามการทำงาน');
      return; 
    }

    // 3. หากเป็นสลิปจริง ตอบกลับด้วยข้อความกำลังตรวจสอบเพื่อปิด replyToken
    await client.replyMessage(replyToken, [
      {
        type: 'text',
        text: `🔍 ระบบกำลังตรวจสอบสลิปโอนเงินและป้องกันการใช้สลิปซ้ำ รอสักครู่นะคะ...`
      }
    ]);

    // 4. ป้องกันสลิปซ้ำด้วย Image Hash
    const imageHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const usedSlips = getUsedSlips();

    if (usedSlips.includes(imageHash)) {
      return await client.pushMessage(userId, [
        {
          type: 'text',
          text: `❌ สลิปนี้ถูกใช้งานไปแล้วค่ะ!\nไม่อนุญาตให้นำสลิปเดิมมาส่งซ้ำ กรุณาใช้สลิปจริงในการทำรายการค่ะ`
        }
      ]);
    }

    // 5. บันทึก Hash สลิปนี้ลงฐานข้อมูลว่าใช้งานแล้ว
    saveUsedSlip(imageHash);

    // ทำรายการสำเร็จ ลบสถานะรอสลิปออก
    waitingForRedSlip.delete(userId);

    // 6. ส่งข้อความขั้นตอนการสมัครแพ็กเกจค่ายแดง
    const successMessages = [
      {
        type: 'text',
        text: `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
              `✅ ตรวจสอบสลิปโอนเงินสำเร็จเรียบร้อยแล้วค่ะ! 🎉\n\n` +
              `📲 **ขั้นตอนการสมัครเติมเงินเข้าเบอร์ 52 บาท**\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n` +
              `🔹 **ขั้นตอนที่ 1:** กด *900*3704# แล้วกดโทรออก\n` +
              `🔹 **ขั้นตอนที่ 2:** กด *900*8788# แล้วกดโทรออก\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `📶 **คำแนะนำเพิ่มเติม:**\n` +
              `พอได้รับข้อความเน็ต 6 Mbps แล้ว สามารถปิด-เปิดโหมดเครื่องบิน (Airplane Mode) 1 รอบ แล้วสามารถใช้งานได้เลยค่ะ! 🚀✨`
      }
    ];

    await client.pushMessage(userId, successMessages);

  } catch (error) {
    console.error('❌ Slip Verification Error:', error);
    await client.pushMessage(userId, [
      {
        type: 'text',
        text: `⚠ เกิดข้อผิดพลาดในการตรวจสอบสลิปอัตโนมัติ กรุณาส่งสลิปเข้ามาใหม่หรือติดต่อแอดมินค่ะ`
      }
    ]);
  }
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
      event.message.type === 'image'
    ) {
      return await handleImageMessage(event);
    }

    if (
      event.type === 'message' &&
      event.message &&
      event.message.type === 'type' || 
      event.message.type === 'text'
    ) {
      const userId = event.source.userId;
      const userMessage = normalizeText(event.message.text);
      const replyMessages = getReplyMessages(userMessage, userId);
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
