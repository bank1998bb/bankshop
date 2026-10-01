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
// ไฟล์เก็บประวัติสลิปที่ใช้แล้ว
// ===============================
const DB_FILE = './used_slips.json';

function getUsedSlips() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }

  try {
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ อ่าน used_slips.json ไม่ได้:', error);
    return [];
  }
}

function saveUsedSlip(identifier) {
  const slips = getUsedSlips();

  if (!slips.includes(identifier)) {
    slips.push(identifier);
  }

  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(slips, null, 2)
  );
}

// ===============================
// ไฟล์เก็บสถานะโปรโมชั่นของลูกค้า
// ===============================
const USER_STATE_FILE = './user_states.json';

function getUserStates() {
  if (!fs.existsSync(USER_STATE_FILE)) {
    fs.writeFileSync(
      USER_STATE_FILE,
      JSON.stringify({}, null, 2)
    );
  }

  try {
    const data = fs.readFileSync(USER_STATE_FILE);
    return JSON.parse(data);
  } catch (error) {
    console.error(
      '❌ อ่าน user_states.json ไม่ได้:',
      error
    );

    return {};
  }
}

function saveUserState(userId, packageName) {
  const states = getUserStates();

  states[userId] = {
    package: packageName,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    USER_STATE_FILE,
    JSON.stringify(states, null, 2)
  );
}

function getUserState(userId) {
  const states = getUserStates();
  return states[userId] || null;
}

function isRedPackageSelected(userId) {
  const state = getUserState(userId);

  if (!state) {
    return false;
  }

  return state.package === 'red_52';
}

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
function getReplyMessages(userMessage) {
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
          `💰 มีค่าบริการ 99 บาท ชำระค่าบริการเสร็จส่งสลิปเข้ามาในแชตได้เลย ` +
          `ระบบจะตรวจสอบสลิปและตรวจสอบยอด 99 บาทอัตโนมัติ ` +
          `จากนั้นจะแจ้งขั้นตอนการสมัครให้ทันทีค่ะ 😊`
      }
    ];
  }

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
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
          `🟢 แพ็กเกจค่ายเขียว 300 บาท\n` +
          `⚡ ความเร็วเน็ต: 10 Mbps\n` +
          `📊 รายละเอียด: เน็ตสปีด จำกัดการใช้งาน 100 GB (ใช้งานได้ 30 วัน)\n` +
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

// ===============================
// HANDLE POSTBACK
// ===============================
function handlePostback(event) {
  if (!event.postback || !event.postback.data) {
    return null;
  }

  const data = normalizeText(event.postback.data);
  const userId = event.source.userId;

  // ==========================================
  // ค่ายเขียว 300
  // ==========================================
  if (
    data === 'promotion_ais_300' ||
    data === 'ais 300' ||
    data === 'ais 300 บาท' ||
    data === 'green_300'
  ) {
    saveUserState(userId, 'green_300');

    return getReplyMessages(
      'ค่ายเขียว 300 บาท'
    );
  }

  // ==========================================
  // ค่ายเขียว 350
  // ==========================================
  if (
    data === 'promotion_ais_350' ||
    data === 'ais 350' ||
    data === 'ais 350 บาท' ||
    data === 'green_350'
  ) {
    saveUserState(userId, 'green_350');

    return getReplyMessages(
      'ค่ายเขียว 350 บาท'
    );
  }

  // ==========================================
  // ค่ายแดง 52 บาท
  // เปิดระบบตรวจสลิป
  // ==========================================
  if (
    data === 'promotion_red' ||
    data === 'red' ||
    data === 'ค่ายแดง' ||
    data === 'ค่ายแดง 52 บาท'
  ) {
    saveUserState(userId, 'red_52');

    return getReplyMessages('ค่ายแดง');
  }

  // ==========================================
  // ต่อโปร
  // ==========================================
  if (
    data === 'renew' ||
    data === 'ต่อโปร'
  ) {
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

  // ==========================================
  // ติดต่อแอดมิน
  // ==========================================
  if (
    data === 'admin' ||
    data === 'ติดต่อแอดมิน'
  ) {
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

// ===============================
// ตรวจยอด 99 บาทจาก OCR
// ===============================
function isAmount99(cleanText) {

  // รูปแบบที่ต้องการตรวจ เช่น
  // 99.00
  // 99
  // 99 บาท
  // ฿99
  // ฿ 99
  // 99.00 บาท

  const amountPatterns = [
    /฿99(?:\.00)?/,
    /99(?:\.00)?บาท/,
    /จำนวนเงิน99(?:\.00)?/,
    /ยอดเงิน99(?:\.00)?/,
    /ยอดโอน99(?:\.00)?/,
    /จำนวน99(?:\.00)?/
  ];

  return amountPatterns.some(
    pattern => pattern.test(cleanText)
  );
}

// ===============================
// HANDLE IMAGE
// ตรวจสอบเฉพาะค่ายแดง + ยอด 99 บาท
// ===============================
async function handleImageMessage(event) {

  const userId = event.source.userId;
  const replyToken = event.replyToken;

  try {

    // ==========================================
    // ต้องเลือกค่ายแดงก่อนเท่านั้น
    // ==========================================
    if (!isRedPackageSelected(userId)) {

      console.log(
        `ℹ️ ${userId} ยังไม่ได้เลือกค่ายแดง → ไม่ตรวจสลิป`
      );

      return;
    }

    console.log(
      `🔴 ${userId} เลือกค่ายแดง → เริ่มตรวจสลิป`
    );

    // ==========================================
    // ดาวน์โหลดรูปจาก LINE
    // ==========================================
    const stream =
      await client.getMessageContent(
        event.message.id
      );

    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    // ==========================================
    // OCR
    // ==========================================
    console.log(
      '🔍 กำลังอ่านข้อความจากสลิป...'
    );

    const {
      data: {
        text
      }
    } = await Tesseract.recognize(
      buffer,
      'tha+eng'
    );

    const cleanText = text
      .replace(/\s+/g, '')
      .toLowerCase();

    console.log(
      '📝 OCR:',
      cleanText
    );

    // ==========================================
    // ตรวจว่าเป็นสลิปหรือไม่
    // ==========================================
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
      cleanText.includes('truemoney') ||
      cleanText.includes('โอนเงิน') ||
      cleanText.includes('จำนวนเงิน') ||
      cleanText.includes('ยอดเงิน') ||
      cleanText.includes('ผู้รับเงิน') ||
      cleanText.includes('ผู้โอน');

    // ==========================================
    // ไม่ใช่สลิป
    // ==========================================
    if (!isSlip) {

      console.log(
        `❌ ไม่พบข้อมูลที่บ่งบอกว่าเป็นสลิป`
      );

      return await client.replyMessage(
        replyToken,
        [
          {
            type: 'text',
            text:
              `❌ ระบบไม่พบข้อมูลที่เป็นสลิปโอนเงินค่ะ\n\n` +
              `กรุณาส่งภาพสลิปโอนเงินที่เห็นข้อมูลชัดเจนอีกครั้งนะคะ 📄💸`
          }
        ]
      );
    }

    // ==========================================
    // ตรวจยอด 99 บาท
    // ==========================================
    const amountIs99 =
      isAmount99(cleanText);

    console.log(
      `💰 ตรวจยอด 99 บาท: ${amountIs99}`
    );

    // ==========================================
    // ถ้ายอดไม่ใช่ 99 บาท
    // ==========================================
    if (!amountIs99) {

      return await client.replyMessage(
        replyToken,
        [
          {
            type: 'text',
            text:
              `❌ ไม่สามารถยืนยันยอดชำระ 99 บาทได้ค่ะ\n\n` +
              `กรุณาตรวจสอบว่าสลิปมียอดโอน **99 บาท** ` +
              `และส่งสลิปที่เห็นยอดเงินชัดเจนอีกครั้งนะคะ 💸`
          }
        ]
      );
    }

    // ==========================================
    // แจ้งว่าผ่านการตรวจยอด
    // ==========================================
    await client.replyMessage(
      replyToken,
      [
        {
          type: 'text',
          text:
            `🔍 ตรวจพบสลิปและยอด 99 บาทแล้วค่ะ\n` +
            `กำลังตรวจสอบว่าสลิปนี้เคยใช้งานแล้วหรือไม่ ⏳`
        }
      ]
    );

    // ==========================================
    // สร้าง SHA-256 Hash
    // ==========================================
    const imageHash =
      crypto
        .createHash('sha256')
        .update(buffer)
        .digest('hex');

    const usedSlips =
      getUsedSlips();

    // ==========================================
    // ตรวจสลิปซ้ำ
    // ==========================================
    if (
      usedSlips.includes(imageHash)
    ) {

      console.log(
        `🚫 พบสลิปซ้ำ: ${userId}`
      );

      return await client.pushMessage(
        userId,
        [
          {
            type: 'text',
            text:
              `❌ สลิปนี้ถูกใช้งานไปแล้วค่ะ!\n\n` +
              `ไม่อนุญาตให้นำสลิปเดิมมาส่งซ้ำค่ะ\n` +
              `กรุณาใช้สลิปโอนเงินรายการใหม่ในการทำรายการนะคะ 💸`
          }
        ]
      );
    }

    // ==========================================
    // บันทึกสลิป
    // ==========================================
    saveUsedSlip(imageHash);

    console.log(
      `✅ สลิปใหม่ ยอด 99 บาท ผ่านการตรวจสอบ`
    );

    // ==========================================
    // ส่งขั้นตอนสมัคร
    // ==========================================
    await client.pushMessage(
      userId,
      [
        {
          type: 'text',
          text:
            `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +
            `✅ ตรวจสอบสลิปเรียบร้อยแล้วค่ะ!\n` +
            `💰 ยอดชำระ: 99 บาท\n` +
            `🎉 สลิปนี้ยังไม่เคยถูกใช้งานค่ะ\n\n` +
            `📲 ขั้นตอนการสมัครเติมเงินเข้าเบอร์ 52 บาท\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🔹 ขั้นตอนที่ 1: กด *900*3704# แล้วกดโทรออก\n` +
            `🔹 ขั้นตอนที่ 2: กด *900*8788# แล้วกดโทรออก\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `📶 คำแนะนำเพิ่มเติม:\n` +
            `พอได้รับข้อความเน็ต 6 Mbps แล้ว สามารถปิด-เปิดโหมดเครื่องบิน (Airplane Mode) 1 รอบ แล้วสามารถใช้งานได้เลยค่ะ! 🚀✨`
        }
      ]
    );

  } catch (error) {

    console.error(
      '❌ Slip Verification Error:',
      error
    );

    try {

      await client.pushMessage(
        userId,
        [
          {
            type: 'text',
            text:
              `⚠️ เกิดข้อผิดพลาดในการตรวจสอบสลิปอัตโนมัติค่ะ\n\n` +
              `กรุณาส่งสลิปเข้ามาใหม่อีกครั้งนะคะ`
          }
        ]
      );

    } catch (pushError) {

      console.error(
        '❌ Push Error:',
        pushError
      );
    }
  }
}

// ===============================
// HANDLE EVENT
// ===============================
async function handleEvent(event) {

  try {

    // ==========================================
    // POSTBACK
    // ==========================================
    if (event.type === 'postback') {

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

    // ==========================================
    // IMAGE
    // ==========================================
    if (
      event.type === 'message' &&
      event.message &&
      event.message.type === 'image'
    ) {

      return await handleImageMessage(
        event
      );
    }

    // ==========================================
    // TEXT
    // ==========================================
    if (
      event.type === 'message' &&
      event.message &&
      event.message.type === 'text'
    ) {

      const userMessage =
        normalizeText(
          event.message.text
        );

      const userId =
        event.source.userId;

      // ==========================================
      // ถ้าเลือกค่ายแดง
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

      if (
        redCommands.has(userMessage)
      ) {

        saveUserState(
          userId,
          'red_52'
        );

        console.log(
          `🔴 ${userId} เลือกค่ายแดง 52 บาท`
        );
      }

      // ==========================================
      // ถ้าเลือกค่ายเขียว 300
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

      if (
        green300Commands.has(userMessage)
      ) {

        saveUserState(
          userId,
          'green_300'
        );

        console.log(
          `🟢 ${userId} เลือกค่ายเขียว 300 บาท`
        );
      }

      // ==========================================
      // ถ้าเลือกค่ายเขียว 350
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

      if (
        green350Commands.has(userMessage)
      ) {

        saveUserState(
          userId,
          'green_350'
        );

        console.log(
          `🟢 ${userId} เลือกค่ายเขียว 350 บาท`
        );
      }

      const replyMessages =
        getReplyMessages(
          userMessage
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

// ===============================
// WEBHOOK
// ===============================
app.post(
  '/webhook',
  line.middleware(config),
  async (req, res) => {

    try {

      const events =
        req.body.events || [];

      res.status(200).json({
        status: 'ok'
      });

      if (
        events.length > 0
      ) {

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

// ===============================
// ERROR HANDLER
// ===============================
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

// ===============================
// SERVER
// ===============================
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
      `🔴 Slip verification: RED 52 BAHT ONLY`
    );

    console.log(
      `💰 Required slip amount: 99 BAHT`
    );

  }
);
