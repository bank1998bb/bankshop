'use strict';

const express = typeRequire('express');
// ไม่ใช้ line/bot-sdk เพื่อตัดปัญหาเรื่อง Token และ Signature Verification
const axios = require('axios'); // ต้องลง axios เพิ่ม หรือจะใช้ fetch ในตัว Node.js ก็ได้ครับ

const app = express();

// ใส่ Channel Access Token ตรงนี้ได้เลย (เผื่อเวลาบอทต้องส่งข้อความกลับหาลูกค้า)
// หรือจะเว้นว่างไว้ก่อนก็ได้ถ้าแค่อยากเทสรับ Webhook
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN || 'ใส่_Token_ของคุณตรงนี้';

// รายละเอียดแพ็กเกจ
const packages = [
  { key: 'AIS 300', price: 300, speed: '10 Mbps', data: '100 GB', validity: '30 วัน' },
  { key: 'AIS 350', price: 350, speed: '10 Mbps', data: 'ไม่อั้น ไม่ลดความเร็ว', validity: '30 วัน' },
  { key: 'TRUE 300', price: 300, speed: '15 Mbps', data: '100 GB', validity: '30 วัน' },
  { key: 'TRUE 350', price: 350, speed: '15 Mbps', data: 'ไม่อั้น ไม่ลดความเร็ว', validity: '30 วัน' }
];

// เก็บสถานะลูกค้าที่กำลังสมัคร
const pendingSignup = new Set();

// ฟังก์ชันส่งข้อความกลับผ่าน LINE Messaging API โดยตรง
async function replyMessage(replyToken, textMessage) {
  if (!CHANNEL_ACCESS_TOKEN || CHANNEL_ACCESS_TOKEN === 'ใส่_Token_ของคุณตรงนี้') {
    console.log('⚠️ ยังไม่ได้ใส่ Channel Access Token บอทจะไม่สามารถส่งข้อความตอบกลับได้ แต่รับ Webhook ได้ปกติ');
    return;
  }

  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken: replyToken,
        messages: [{ type: 'text', text: textMessage }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
  } catch (error) {
    console.error('Error sending message to LINE:', error.response?.data || error.message);
  }
}

async function handleEvent(event) {
  if (event.type !== 'message' || !event.message || event.message.type !== 'text') {
    return;
  }

  const userId = event.source && event.source.userId;
  if (!userId) return;

  const text = event.message.text.trim();
  const upperText = text.toUpperCase();
  const replyToken = event.replyToken;

  // ตรวจสอบว่าลูกค้ากำลังส่งเบอร์โทรหรือไม่
  if (pendingSignup.has(userId)) {
    if (/^[0-9]{10}$/.test(text)) {
      pendingSignup.delete(userId);
      await replyMessage(
        replyToken,
        'ได้รับเบอร์โทรศัพท์แล้วครับ ✅\nแอดมินจะตรวจสอบและติดต่อกลับเพื่อดำเนินการสมัครแพ็กเกจครับ'
      );
    } else {
      await replyMessage(replyToken, 'กรุณาส่งเบอร์โทรศัพท์ 10 หลักครับ (เฉพาะตัวเลข)');
    }
    return;
  }

  // เมนูเริ่มต้น
  if (/^(สวัสดี|หวัดดี|เริ่ม|เมนู|แพ็กเกจ|โปรโมชั่น)$/i.test(text)) {
    await replyMessage(
      replyToken,
      'ยินดีต้อนรับ BANKSHOP ครับ 😊\n\nเลือกดูแพ็กเกจได้โดยพิมพ์:\n• AIS 300\n• AIS 350\n• TRUE 300\n• TRUE 350'
    );
    return;
  }

  // ตรวจสอบแพ็กเกจ
  const selected = packages.find(pkg => upperText.includes(pkg.key));

  if (selected) {
    if (/สมัคร|สนใจ/.test(text)) {
      pendingSignup.add(userId);
      await replyMessage(
        replyToken,
        `สนใจสมัครแพ็กเกจ ${selected.key} ใช่ไหมครับ 😊\n\nกรุณาส่งเบอร์โทรศัพท์ 10 หลักที่ต้องการสมัครครับ`
      );
    } else {
      await replyMessage(
        replyToken,
        `📱 แพ็กเกจ ${selected.key}\n\n💰 ราคา ${selected.price} บาท\n🚀 ความเร็ว ${selected.speed}\n📶 ปริมาณเน็ต ${selected.data}\n🗓️ ระยะเวลา ${selected.validity}\n\nหากสนใจ พิมพ์ "สมัคร ${selected.key}" ได้เลยครับ`
      );
    }
    return;
  }

  // ลูกค้าพิมพ์คำว่า สมัคร/สนใจ แต่ยังไม่ได้ระบุแพ็กเกจ
  if (/สมัคร|สนใจ/.test(text)) {
    await replyMessage(
      replyToken,
      'สนใจแพ็กเกจไหนครับ?\n\nAIS 300\nAIS 350\nTRUE 300\nTRUE 350\n\nพิมพ์ชื่อแพ็กเกจที่ต้องการได้เลยครับ'
    );
    return;
  }

  // ข้อความอื่น ๆ
  await replyMessage(
    replyToken,
    'ขออภัยครับ ยังไม่เข้าใจข้อความนี้ 😅\n\nพิมพ์ "เมนู" เพื่อดูแพ็กเกจทั้งหมดครับ'
  );
}

// ตั้งค่าให้ Express รองรับ JSON Body เพื่อรับ Webhook โดยตรง
app.use(express.json());

// เช็คสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
  res.status(200).send('BANKSHOP WEBHOOK SERVER RUNNING');
});

app.get('/webhook', (req, res) => {
  res.status(200).send('LINE WEBHOOK READY');
});

// จุดรับ Webhook จาก LINE (ไม่มีการตรวจ Signature หรือ Token ซับซ้อน รับตรงๆ ได้เลย)
app.post('/webhook', async (req, res) => {
  // ตอบกลับ LINE ทันที 200 OK เพื่อไม่ให้ระบบ LINE Timeout
  res.status(200).json({ status: 'ok' });

  const events = req.body.events || [];
  console.log('Received events:', events.length);

  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (err) {
      console.error('Error handling event:', err);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
