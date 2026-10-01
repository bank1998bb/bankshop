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

// ======================================================
// LINE CLIENT
// ======================================================
const client = new line.Client(config);

// ======================================================
// DATABASE สลิปที่ใช้แล้ว
// ======================================================
const DB_FILE = './used_slips.json';

function getUsedSlips() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
      return [];
    }

    const data = fs.readFileSync(DB_FILE, 'utf8');

    if (!data.trim()) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    console.error('❌ อ่าน used_slips.json ไม่สำเร็จ:', error);
    return [];
  }
}

function saveUsedSlip(identifier) {
  try {
    const slips = getUsedSlips();

    if (!slips.includes(identifier)) {
      slips.push(identifier);
    }

    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(slips, null, 2)
    );

  } catch (error) {
    console.error('❌ บันทึกสลิปไม่สำเร็จ:', error);
  }
}

// ======================================================
// USER STATE
//
// waitingRedSlip = true
// หมายถึงผู้ใช้เลือกค่ายแดงและกำลังรอสลิป
//
// waitingRedSlip = false
// หมายถึงไม่ตรวจสอบรูป
// ======================================================
const userStates = new Map();

function setWaitingRedSlip(userId, value) {
  if (!userId) return;

  userStates.set(userId, {
    waitingRedSlip: value
  });

  console.log(
    `👤 ${userId} | waitingRedSlip = ${value}`
  );
}

function isWaitingRedSlip(userId) {
  if (!userId) return false;

  const state = userStates.get(userId);

  return !!(
    state &&
    state.waitingRedSlip === true
  );
}

// ======================================================
// WEBHOOK TEST
// ======================================================
app.get('/webhook', (req, res) => {
  res.status(200).send('OK');
});

// ======================================================
// NORMALIZE TEXT
// ======================================================
function normalizeText(text) {
  if (!text) return '';

  return text
    .toString()
    .trim()
    .replace(/\s+/g, ' ');
}

// ======================================================
// GET REPLY MESSAGES
// ======================================================
function getReplyMessages(userMessage, userId) {
  const text = normalizeText(userMessage);

  // ==================================================
  // 🔴 ค่ายแดง
  // ==================================================
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

    // เปิดโหมดรอสลิปค่ายแดง
    setWaitingRedSlip(userId, true);

    return [
      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
          `🔴 แพ็กเกจค่ายแดง\n` +
          `⚡ รายละเอียดแพ็กเกจ: 52 บาท\n` +
          `🚀 ความเร็วเน็ต: 6 Mbps\n` +
          `♾️ รายละเอียด: เน็ตไม่อั้น ไม่ลดสปีด ไม่จำกัดการใช้งาน\n` +
          `⏳ ระยะเวลาการใช้งาน: 7 วัน\n` +
          `✨ การใช้งาน: ใช้งานได้ลื่นไหลไม่มีสะดุดค่ะ!`
      },

      {
        type: 'image',
        originalContentUrl:
          'https://i.ibb.co/tMR5CxTV/line-oa-chat-260714-124114.jpg',
        previewImageUrl:
          'https://i.ibb.co/tMR5CxTV/line-oa-chat-260714-124114.jpg'
      },

      {
        type: 'text',
        text:
          `💰 มีค่าบริการ 99 บาท\n\n` +
          `ชำระค่าบริการเสร็จแล้วส่งสลิปเข้ามาในแชตได้เลยค่ะ 📷\n\n` +
          `🔍 ระบบจะตรวจสอบสลิปอัตโนมัติและส่งขั้นตอนการสมัครให้ทันทีค่ะ 😊`
      }
    ];
  }

  // ==================================================
  // 🟢 ค่ายเขียว 300
  // ==================================================
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

    // ปิดการตรวจสลิปค่ายแดง
    setWaitingRedSlip(userId, false);

    return [
      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
          `🟢 แพ็กเกจค่ายเขียว 300 บาท\n` +
          `⚡ ความเร็วเน็ต: 10 Mbps\n` +
          `📊 รายละเอียด: เน็ตลดสปีด จำกัดการใช้งาน 100 GB (ใช้งานได้ 30 วัน)\n` +
          `🚀 การใช้งาน: ใช้งานได้ลื่นไหล ไม่มีสะดุดค่ะ!`
      },

      {
        type: 'text',
        text:
          `💡 สนใจรับแพ็กเกจนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ ` +
          `เดี๋ยว AI ส่งต่อให้แอดมินดูแลต่อทันทีค่ะ ✨📱`
      }
    ];
  }

  // ==================================================
  // 🟢 ค่ายเขียว 350
  // ==================================================
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

    // ปิดการตรวจสลิปค่ายแดง
    setWaitingRedSlip(userId, false);

    return [
      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
          `🟢 แพ็กเกจค่ายเขียว 350 บาท\n` +
          `⚡ ความเร็วเน็ต: 10 Mbps\n` +
          `♾️ รายละเอียด: เน็ตไม่อั้น ไม่ลดสปีด (ใช้งานได้ 30 วัน)\n` +
          `🚀 การใช้งาน: ใช้งานได้ลื่นไหล ไม่มีสะดุด เต็มอิ่มจุใจค่ะ!`
      },

      {
        type: 'text',
        text:
          `💡 สนใจรับแพ็กเกจนี้ แจ้งเบอร์โทรของคุณลูกค้าไว้ได้เลยนะคะ ` +
          `เดี๋ยว AI ส่งต่อให้แอดมินดูแลต่อทันทีค่ะ ✨📱`
      }
    ];
  }

  // ==================================================
  // ต่อโปรโมชั่น
  // ==================================================
  const renewCommands = new Set([
    'ต่อโปรโปรโมชั่น',
    'ต่อโปรโมชั่น',
    'สอบถามโปรโมชั่น',
    'ต่อโปร',
    'ต่ออายุโปรโมชั่น',
  ]);

  if (renewCommands.has(text)) {

    setWaitingRedSlip(userId, false);

    return [
      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟`
      },

      {
        type: 'text',
        text:
          `รับเรื่องต่อโปรโมชั่นให้เรียบร้อยค่ะ ` +
          `กำลังตามแอดมินใจดีมาดูแลต่อให้อย่างด่วนเลยนะคะ ` +
          `รอสักครู่นะคะ ⏳📅`
      }
    ];
  }

  // ==================================================
  // ติดต่อแอดมิน
  // ==================================================
  const adminCommands = new Set([
    'ติดต่อแอดมิน',
    'แจ้งปัญหา/สอบถาม',
    'แจ้งปัญหา',
    'สอบถาม',
    'ติดต่อเจ้าหน้าที่',
    'แจ้งปัญหาและสอบถาม',
  ]);

  if (adminCommands.has(text)) {

    setWaitingRedSlip(userId, false);

    return [
      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟`
      },

      {
        type: 'text',
        text:
          `รับทราบค่ะ! แจ้งรายละเอียดหรือปัญหาที่พบไว้ได้เลยนะคะ ` +
          `เดี๋ยว AI ตามแอดมินตัวจริงมาช่วยดูแลคุณลูกค้าทันทีค่ะ 🛠️💬`
      }
    ];
  }

  return null;
}

// ======================================================
// HANDLE POSTBACK
// ======================================================
function handlePostback(event) {
  if (!event.postback || !event.postback.data) {
    return null;
  }

  const data = normalizeText(
    event.postback.data
  );

  const userId = event.source.userId;

  const postbackMap = {

    // 🟢 AIS 300
    'promotion_ais_300':
      'ค่ายเขียว 300 บาท',

    'ais 300':
      'ค่ายเขียว 300 บาท',

    'ais 300 บาท':
      'ค่ายเขียว 300 บาท',

    'green_300':
      'ค่ายเขียว 300 บาท',

    // 🟢 AIS 350
    'promotion_ais_350':
      'ค่ายเขียว 350 บาท',

    'ais 350':
      'ค่ายเขียว 350 บาท',

    'ais 350 บาท':
      'ค่ายเขียว 350 บาท',

    'green_350':
      'ค่ายเขียว 350 บาท',

    // 🔴 RED
    'promotion_red':
      'ค่ายแดง',

    'red':
      'ค่ายแดง',

    'ค่ายแดง':
      'ค่ายแดง',

    'ค่ายแดง 52 บาท':
      'ค่ายแดง',
  };

  if (postbackMap[data]) {

    return getReplyMessages(
      postbackMap[data],
      userId
    );
  }

  // ==================================================
  // ต่อโปร
  // ==================================================
  if (
    data === 'renew' ||
    data === 'ต่อโปร'
  ) {

    setWaitingRedSlip(
      userId,
      false
    );

    return [
      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟`
      },

      {
        type: 'text',
        text:
          `รับเรื่องต่อโปรโมชั่นให้เรียบร้อยค่ะ ` +
          `กำลังตามแอดมินใจดีมาดูแลต่อให้อย่างด่วนเลยนะคะ ` +
          `รอสักครู่นะคะ ⏳📅`
      }
    ];
  }

  // ==================================================
  // แอดมิน
  // ==================================================
  if (
    data === 'admin' ||
    data === 'ติดต่อแอดมิน'
  ) {

    setWaitingRedSlip(
      userId,
      false
    );

    return [
      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟`
      },

      {
        type: 'text',
        text:
          `รับทราบค่ะ! แจ้งรายละเอียดหรือปัญหาที่พบไว้ได้เลยนะคะ ` +
          `เดี๋ยว AI ตามแอดมินตัวจริงมาช่วยดูแลคุณลูกค้าทันทีค่ะ 🛠️💬`
      }
    ];
  }

  return null;
}

// ======================================================
// HANDLE IMAGE
// ======================================================
async function handleImageMessage(event) {

  const userId =
    event.source.userId;

  const replyToken =
    event.replyToken;

  // ==================================================
  // สำคัญมาก
  //
  // ถ้าไม่ได้อยู่ใน flow ค่ายแดง
  // จะไม่ดาวน์โหลดรูป
  // จะไม่ OCR
  // จะไม่ตรวจ QR
  // จะไม่ตรวจสลิป
  // ==================================================
  if (!isWaitingRedSlip(userId)) {

    console.log(
      `📷 ${userId} ส่งรูป แต่ไม่ใช่ flow ค่ายแดง → ข้าม`
    );

    return null;
  }

  try {

    // ==================================================
    // ตอบกลับทันที
    // ไม่รอ OCR
    // ==================================================
    await client.replyMessage(
      replyToken,
      {
        type: 'text',
        text:
          `📷 รับรูปเรียบร้อยแล้วค่ะ\n\n` +
          `🔍 กำลังตรวจสอบสลิปโอนเงิน...\n` +
          `กรุณารอสักครู่นะคะ ⏳`
      }
    );

    console.log(
      `🔴 ${userId} → เริ่มตรวจสอบสลิป`
    );

    // ==================================================
    // ดาวน์โหลดรูป
    // ==================================================
    const stream =
      await client.getMessageContent(
        event.message.id
      );

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer =
      Buffer.concat(chunks);

    console.log(
      `📥 ดาวน์โหลดรูปสำเร็จ: ${buffer.length} bytes`
    );

    // ==================================================
    // OCR
    // ==================================================
    console.log(
      `🔎 เริ่ม OCR: ${userId}`
    );

    const result =
      await Tesseract.recognize(
        buffer,
        'tha+eng'
      );

    const ocrText =
      result &&
      result.data &&
      result.data.text
        ? result.data.text
        : '';

    const cleanText =
      ocrText
        .replace(/\s+/g, '')
        .toLowerCase();

    console.log(
      `📝 OCR RESULT:\n${ocrText.substring(0, 1000)}`
    );

    // ==================================================
    // KEYWORDS สลิป
    // ==================================================
    const slipKeywords = [

      'qrcode',
      'qr',

      'slipid',

      'โอนเงินสำเร็จ',
      'โอนสำเร็จ',
      'รายการสำเร็จ',

      'สำเร็จ',

      'จำนวนเงิน',
      'ยอดเงิน',

      'ref.',
      'ref:',
      'reference',

      'bangkokbank',
      'kbank',
      'kasikorn',
      'scb',
      'krungthai',
      'krungsri',
      'truemoney',

      'พร้อมเพย์',
      'promptpay',

      'โอนจาก',
      'โอนไปยัง'
    ];

    const matchedKeywords =
      slipKeywords.filter(
        keyword =>
          cleanText.includes(
            keyword
              .replace(/\s+/g, '')
              .toLowerCase()
          )
      );

    const isSlip =
      matchedKeywords.length > 0;

    console.log(
      `🔎 Slip Result: ${isSlip ? 'พบสลิป' : 'ไม่พบสลิป'}`
    );

    console.log(
      `🔎 Matched:`,
      matchedKeywords
    );

    // ==================================================
    // ไม่ใช่สลิป
    // ==================================================
    if (!isSlip) {

      setWaitingRedSlip(
        userId,
        true
      );

      await client.pushMessage(
        userId,
        {
          type: 'text',
          text:
            `❌ ระบบยังตรวจไม่พบว่าเป็นสลิปโอนเงินค่ะ\n\n` +
            `กรุณาส่งรูปสลิปโอนเงินที่เห็นข้อมูลชัดเจนอีกครั้งนะคะ 📷`
        }
      );

      return null;
    }

    // ==================================================
    // HASH รูป
    // ==================================================
    const imageHash =
      crypto
        .createHash('sha256')
        .update(buffer)
        .digest('hex');

    console.log(
      `🔐 Hash: ${imageHash}`
    );

    // ==================================================
    // ตรวจสลิปซ้ำ
    // ==================================================
    const usedSlips =
      getUsedSlips();

    if (
      usedSlips.includes(imageHash)
    ) {

      setWaitingRedSlip(
        userId,
        false
      );

      await client.pushMessage(
        userId,
        {
          type: 'text',
          text:
            `❌ สลิปนี้ถูกใช้งานไปแล้วค่ะ!\n\n` +
            `ระบบไม่อนุญาตให้นำสลิปเดิมมาใช้ซ้ำค่ะ\n` +
            `กรุณาใช้สลิปใหม่ในการทำรายการนะคะ`
        }
      );

      return null;
    }

    // ==================================================
    // บันทึกสลิป
    // ==================================================
    saveUsedSlip(
      imageHash
    );

    console.log(
      `💾 บันทึกสลิปใหม่แล้ว`
    );

    // ==================================================
    // ปิดโหมดรอสลิป
    // ==================================================
    setWaitingRedSlip(
      userId,
      false
    );

    // ==================================================
    // SUCCESS
    // ==================================================
    await client.pushMessage(
      userId,
      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +

          `✅ ตรวจสอบสลิปโอนเงินสำเร็จเรียบร้อยแล้วค่ะ! 🎉\n\n` +

          `📲 ขั้นตอนการสมัครเติมเงินเข้าเบอร์ 52 บาท\n` +

          `━━━━━━━━━━━━━━━━━━━━━━\n` +

          `🔹 ขั้นตอนที่ 1: กด *900*3704# แล้วกดโทรออก\n` +

          `🔹 ขั้นตอนที่ 2: กด *900*8788# แล้วกดโทรออก\n` +

          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +

          `📶 พอได้รับข้อความเน็ต 6 Mbps แล้ว ` +
          `สามารถปิด-เปิดโหมดเครื่องบิน (Airplane Mode) 1 รอบ ` +
          `แล้วใช้งานได้เลยค่ะ! 🚀✨`
      }
    );

    console.log(
      `🎉 ${userId} ตรวจสลิปสำเร็จ`
    );

    return null;

  } catch (error) {

    console.error(
      '❌ Slip Verification Error:',
      error && error.stack
        ? error.stack
        : error
    );

    // ให้ส่งใหม่ได้
    setWaitingRedSlip(
      userId,
      true
    );

    try {

      await client.pushMessage(
        userId,
        {
          type: 'text',
          text:
            `⚠️ ระบบตรวจสอบสลิปเกิดข้อผิดพลาดค่ะ\n\n` +
            `กรุณาส่งรูปสลิปใหม่อีกครั้งนะคะ 📷`
        }
      );

    } catch (pushError) {

      console.error(
        '❌ Push Error:',
        pushError
      );
    }

    return null;
  }
}

// ======================================================
// HANDLE EVENT
// ======================================================
async function handleEvent(event) {

  try {

    // ==================================================
    // POSTBACK
    // ==================================================
    if (
      event.type === 'postback'
    ) {

      const replyMessages =
        handlePostback(event);

      if (!replyMessages) {
        return null;
      }

      return await client.replyMessage(
        event.replyToken,
        replyMessages
      );
    }

    // ==================================================
    // IMAGE
    // ==================================================
    if (
      event.type === 'message' &&
      event.message &&
      event.message.type === 'image'
    ) {

      return await handleImageMessage(
        event
      );
    }

    // ==================================================
    // TEXT
    // ==================================================
    if (
      event.type === 'message' &&
      event.message &&
      event.message.type === 'text'
    ) {

      const userId =
        event.source.userId;

      const userMessage =
        normalizeText(
          event.message.text
        );

      const replyMessages =
        getReplyMessages(
          userMessage,
          userId
        );

      if (!replyMessages) {
        return null;
      }

      return await client.replyMessage(
        event.replyToken,
        replyMessages
      );
    }

    return null;

  } catch (error) {

    console.error(
      '❌ Error handling event:',
      error &&
      error.response
        ? error.response.data
        : error
    );

    return null;
  }
}

// ======================================================
// WEBHOOK
// ======================================================
app.post(
  '/webhook',
  line.middleware(config),
  async (req, res) => {

    try {

      const events =
        req.body.events || [];

      // ตอบ LINE ทันที
      res.status(200).json({
        status: 'ok'
      });

      // ประมวลผลต่อเบื้องหลัง
      if (events.length > 0) {

        await Promise.allSettled(
          events.map(
            event =>
              handleEvent(event)
          )
        );
      }

    } catch (error) {

      console.error(
        '❌ Webhook Error:',
        error
      );

      if (!res.headersSent) {

        res.status(200).json({
          status: 'ok'
        });

      }
    }
  }
);

// ======================================================
// ERROR HANDLER
// ======================================================
app.use(
  (err, req, res, next) => {

    console.error(
      '❌ Server Error:',
      err
    );

    if (!res.headersSent) {

      res.status(200).json({
        status: 'ok'
      });

    }
  }
);

// ======================================================
// SERVER
// ======================================================
const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  () => {

    console.log(
      `🚀 LINE Bot Server running on port ${PORT}`
    );

    console.log(
      `📡 Webhook: /webhook`
    );

    console.log(
      `🔴 Slip verification: RED MENU ONLY`
    );
  }
);
