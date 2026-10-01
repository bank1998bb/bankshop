const express = require('express');
const line = require('@line/bot-sdk');
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
// USER STATE
// ======================================================
// true  = ผู้ใช้อยู่ในขั้นตอนค่ายแดงและกำลังรอสลิป
// false = ไม่ตรวจสอบรูป
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
// ตรวจยอด 99 บาท
// ======================================================
function isCorrectAmount(cleanText) {

  const amountPatterns = [
    '99.00',
    '99.00บาท',
    '99บาท',
    '99.00บาท',
    'จำนวนเงิน99',
    'ยอดเงิน99'
  ];

  return amountPatterns.some(pattern =>
    cleanText.includes(
      pattern.replace(/\s+/g, '').toLowerCase()
    )
  );
}

// ======================================================
// ตรวจข้อความที่เป็นลักษณะของสลิป
// ======================================================
function analyzeSlipText(ocrText) {

  const cleanText = ocrText
    .replace(/\s+/g, '')
    .toLowerCase();

  // ==================================================
  // คำที่พบบ่อยในสลิปธนาคาร
  // ==================================================
  const bankKeywords = [
    'กสิกรไทย',
    'kasikorn',
    'kbank',

    'ธนาคารกรุงเทพ',
    'bangkokbank',

    'ไทยพาณิชย์',
    'scb',

    'กรุงไทย',
    'krungthai',

    'กรุงศรี',
    'krungsri',

    'ทหารไทยธนชาต',
    'ttb',

    'ออมสิน',
    'gsb',

    'ธนาคารอาคารสงเคราะห์',
    'ธกส',
    'baac'
  ];

  // ==================================================
  // คำที่พบบ่อยในข้อมูลรายการโอน
  // ==================================================
  const slipKeywords = [
    'จำนวนเงิน',
    'ค่าธรรมเนียม',
    'วันที่ทำรายการ',
    'วันที่',
    'เวลา',
    'โอนเงิน',
    'โอนสำเร็จ',
    'รายการสำเร็จ',
    'สำเร็จ',
    'ยอดเงิน',
    'เงินออก',
    'เงินเข้า',
    'ผู้โอน',
    'ผู้รับ',
    'โอนจาก',
    'โอนไปยัง',

    'พร้อมเพย์',
    'promptpay',

    'ref',
    'reference',
    'transaction',

    'qrcode',
    'qr'
  ];

  const matchedBankKeywords =
    bankKeywords.filter(keyword =>
      cleanText.includes(
        keyword
          .replace(/\s+/g, '')
          .toLowerCase()
      )
    );

  const matchedSlipKeywords =
    slipKeywords.filter(keyword =>
      cleanText.includes(
        keyword
          .replace(/\s+/g, '')
          .toLowerCase()
      )
    );

  // ==================================================
  // ตรวจยอด 99 บาท
  // ==================================================
  const correctAmount =
    isCorrectAmount(cleanText);

  // ==================================================
  // คะแนนตรวจสอบ
  //
  // มีชื่อธนาคาร = 2 คะแนน
  // มีข้อมูลสลิป = 1 คะแนนต่อคำ
  // ยอด 99 บาท = 2 คะแนน
  // ==================================================
  let score = 0;

  if (matchedBankKeywords.length > 0) {
    score += 2;
  }

  score += Math.min(
    matchedSlipKeywords.length,
    3
  );

  if (correctAmount) {
    score += 2;
  }

  // ==================================================
  // ถือว่าเป็นสลิปเมื่อคะแนน >= 3
  // ==================================================
  const isSlip = score >= 3;

  console.log('==============================');
  console.log('🔎 SLIP ANALYSIS');
  console.log('Bank:', matchedBankKeywords);
  console.log('Slip:', matchedSlipKeywords);
  console.log('Amount 99:', correctAmount);
  console.log('Score:', score);
  console.log('Is Slip:', isSlip);
  console.log('==============================');

  return {
    isSlip,
    correctAmount,
    score,
    matchedBankKeywords,
    matchedSlipKeywords,
    cleanText
  };
}

// ======================================================
// ข้อความหลังตรวจสลิปผ่าน
// ======================================================
function getRedSuccessMessage() {

  return {
    type: 'text',
    text:
      `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +

      `✅ ตรวจสอบสลิปโอนเงินเรียบร้อยแล้วค่ะ! 🎉\n` +

      `💰 ยอดชำระ 99 บาท ตรวจสอบแล้วค่ะ\n\n` +

      `📲 ขั้นตอนการสมัครค่ายแดง\n` +

      `━━━━━━━━━━━━━━━━━━━━━━\n` +

      `🔹 ขั้นตอนที่ 1\n` +
      `กด *900*3704# แล้วกดโทรออก\n\n` +

      `🔹 ขั้นตอนที่ 2\n` +
      `กด *900*8788# แล้วกดโทรออก\n` +

      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +

      `📶 หลังจากได้รับข้อความยืนยันแพ็กเกจ ` +
      `เน็ต 6 Mbps แล้ว\n\n` +

      `✈️ แนะนำให้ปิด-เปิดโหมดเครื่องบิน ` +
      `(Airplane Mode) 1 รอบ\n\n` +

      `🚀 จากนั้นสามารถใช้งานอินเทอร์เน็ตได้เลยค่ะ!`
  };
}

// ======================================================
// GET REPLY MESSAGES
// ======================================================
function getReplyMessages(userMessage, userId) {

  const text =
    normalizeText(userMessage);

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

    // เปิดโหมดตรวจสลิป
    setWaitingRedSlip(
      userId,
      true
    );

    return [

      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +

          `🔴 แพ็กเกจค่ายแดง\n` +
          `⚡ รายละเอียดแพ็กเกจ: 52 บาท\n` +
          `🚀 ความเร็วเน็ต: 6 Mbps\n` +
          `♾️ เน็ตไม่อั้น ไม่ลดความเร็ว ไม่จำกัดการใช้งาน\n` +
          `⏳ ระยะเวลาการใช้งาน: 7 วัน\n\n` +

          `✨ ใช้งานได้ลื่นไหลไม่มีสะดุดค่ะ!`
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
          `💰 ค่าบริการ 99 บาท\n\n` +

          `ชำระเงินเสร็จแล้วส่งรูปสลิปเข้ามาในแชตได้เลยค่ะ 📷\n\n` +

          `🔍 ระบบจะตรวจสอบสลิปและส่งขั้นตอนสมัครให้โดยอัตโนมัติค่ะ`
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

    // ปิดตรวจสลิปค่ายแดง
    setWaitingRedSlip(
      userId,
      false
    );

    return [

      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +

          `🟢 แพ็กเกจค่ายเขียว 300 บาท\n` +
          `⚡ ความเร็วเน็ต: 10 Mbps\n` +
          `📊 เน็ตสปีด จำกัดการใช้งาน 100 GB\n` +
          `⏳ ใช้งานได้ 30 วัน\n` +
          `🚀 ใช้งานได้ลื่นไหล ไม่มีสะดุดค่ะ!`
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
    'ค่ายเขียว 350 ไม่ลดความเร็ว',
    'ค่ายเขียว 350 ไม่อั้น',
    'ค่ายเขียว 350 บาท ไม่ลดความเร็ว',
    'ค่ายเขียว 350 บาท ไม่อั้น',
    'AIS 350 บาท',
    'AIS 350',
    'โปรโมชั่น AIS 350 บาท',
    'โปรโมชั่น AIS 350',
  ]);

  if (green350Commands.has(text)) {

    // ปิดตรวจสลิปค่ายแดง
    setWaitingRedSlip(
      userId,
      false
    );

    return [

      {
        type: 'text',
        text:
          `🤖 AI สมาร์ท ยินดีให้บริการค่ะ! 🌟\n\n` +

          `🟢 แพ็กเกจค่ายเขียว 350 บาท\n` +
          `⚡ ความเร็วเน็ต: 10 Mbps\n` +
          `♾️ เน็ตไม่อั้น ไม่ลดความเร็ว\n` +
          `⏳ ใช้งานได้ 30 วัน\n` +
          `🚀 ใช้งานได้ลื่นไหล ไม่มีสะดุดค่ะ!`
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
// HANDLE POSTBACK
// ======================================================
function handlePostback(event) {

  if (
    !event.postback ||
    !event.postback.data
  ) {
    return null;
  }

  const data =
    normalizeText(
      event.postback.data
    );

  const userId =
    event.source.userId;

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
// HANDLE IMAGE MESSAGE
// ======================================================
async function handleImageMessage(event) {

  const userId =
    event.source.userId;

  const replyToken =
    event.replyToken;

  // ==================================================
  // สำคัญที่สุด
  //
  // ถ้าไม่ใช่ค่ายแดง
  // ไม่ดาวน์โหลดรูป
  // ไม่ OCR
  // ไม่ตรวจสลิป
  // ==================================================
  if (!isWaitingRedSlip(userId)) {

    console.log(
      `📷 ${userId} ส่งรูป แต่ไม่ได้อยู่ในค่ายแดง → ข้ามการตรวจ`
    );

    return null;
  }

  try {

    // ==================================================
    // ตอบทันที
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
      `🔴 ${userId} → เริ่มตรวจสลิปค่ายแดง`
    );

    // ==================================================
    // ดาวน์โหลดรูปจาก LINE
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
      `🔎 เริ่ม OCR...`
    );

    const result =
      await Tesseract.recognize(
        buffer,
        'tha+eng',
        {
          logger: info => {

            if (
              info.status ===
              'recognizing text'
            ) {

              const progress =
                Math.round(
                  (info.progress || 0) * 100
                );

              if (
                progress === 25 ||
                progress === 50 ||
                progress === 75 ||
                progress === 100
              ) {

                console.log(
                  `🔎 OCR ${progress}%`
                );
              }
            }
          }
        }
      );

    const ocrText =
      result &&
      result.data &&
      result.data.text
        ? result.data.text
        : '';

    console.log(
      `📝 OCR TEXT:\n${ocrText}`
    );

    // ==================================================
    // วิเคราะห์สลิป
    // ==================================================
    const analysis =
      analyzeSlipText(
        ocrText
      );

    // ==================================================
    // ไม่พบข้อมูลสลิป
    // ==================================================
    if (!analysis.isSlip) {

      // ยังคงรอสลิป
      setWaitingRedSlip(
        userId,
        true
      );

      await client.pushMessage(
        userId,
        {
          type: 'text',
          text:
            `❌ ระบบยังอ่านข้อมูลสลิปไม่ชัดเจนค่ะ\n\n` +

            `กรุณาส่งรูปสลิปโอนเงินแบบเต็มใบ ` +
            `และให้เห็นข้อมูลจำนวนเงิน/ธนาคารชัดเจนอีกครั้งนะคะ 📷`
        }
      );

      return null;
    }

    // ==================================================
    // พบสลิป
    //
    // ไม่ตรวจ Hash
    // ไม่ตรวจสลิปซ้ำ
    // ไม่ใช้ used_slips.json
    // ==================================================
    console.log(
      `✅ พบข้อมูลสลิป`
    );

    console.log(
      `💰 ยอด 99 บาท: ${
        analysis.correctAmount
          ? 'ถูกต้อง'
          : 'ไม่พบยอด 99'
      }`
    );

    // ==================================================
    // ปิดสถานะรอสลิป
    // ==================================================
    setWaitingRedSlip(
      userId,
      false
    );

    // ==================================================
    // ส่งขั้นตอนต่อทันที
    // ==================================================
    await client.pushMessage(
      userId,
      getRedSuccessMessage()
    );

    console.log(
      `🎉 ${userId} ตรวจสลิปผ่าน → ส่งขั้นตอนสมัครแล้ว`
    );

    return null;

  } catch (error) {

    console.error(
      '❌ Slip Verification Error:',
      error &&
      error.stack
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

      // ประมวลผลต่อ
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

    console.log(
      `💰 Required amount: 99 THB`
    );

    console.log(
      `🔁 Duplicate slip checking: DISABLED`
    );
  }
);
