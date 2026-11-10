'use strict';

const express = require('express');
const axios = require('axios');

const app = express();

const CHANNEL_ACCESS_TOKEN = 'sS4kjfKeiTz9FujmF3JMltwqfeZZdgERTBWdD32T4pzh0T2nsVAcd+NkM8qfbreAnt2iAIRsIAFVKNwnQj2VtYVCwKZYuDpy85K/Esz65da/Biqr/ZDt+CwJ9z0VCxM07WMc4ti4/kye8oZvlVEYYwdB04t89/1O/w1cDnyilFU=';

const packages = [
  { key: 'AIS 300', price: 300, speed: '10 Mbps', data: '100 GB', validity: '30 วัน' },
  { key: 'AIS 350', price: 350, speed: '10 Mbps', data: 'ไม่อั้น ไม่ลดความเร็ว', validity: '30 วัน' },
  { key: 'TRUE 300', price: 300, speed: '15 Mbps', data: '100 GB', validity: '30 วัน' },
  { key: 'TRUE 350', price: 350, speed: '15 Mbps', data: 'ไม่อั้น ไม่ลดความเร็ว', validity: '30 วัน' }
];

const pendingSignup = new Set();

async function replyMessage(replyToken, textMessage) {
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

  // เงื่อนไขติดต่อแอดมิน
  if (/ติดต่อแอดมิน|แอดมิน|admin|help|ช่วยเหลือ/i.test(text)) {
    await replyMessage(
      replyToken,
      'ลูกค้าสามารถแจ้งรายละเอียดหรือพิมพ์ปัญหาที่พบไว้ได้เลยครับ เดี๋ยวแอดมินจะเข้าดูแลทันทีครับ'
    );
    return;
  }

  if (/^(สวัสดี|หวัดดี|เริ่ม|เมนู|แพ็กเกจ|โปรโมชั่น)$/i.test(text)) {
    await replyMessage(
      replyToken,
      'ยินดีต้อนรับ BANKSHOP ครับ 😊\n\nเลือกดูแพ็กเกจได้โดยพิมพ์:\n• AIS 300\n• AIS 350\n• TRUE 300\n• TRUE 350\n\nหรือพิมพ์ "ติดต่อแอดมิน" เพื่อแจ้งปัญหาได้เลยครับ'
    );
    return;
  }

  const selected = packages.find(pkg => upperText.includes(pkg.key));

  if (selected) {
    if (/สมัคร|สนใจ/.test(text)) {
      pendingSignup.add(userId);
      await replyMessage(
        replyToken,
        `สนใจแพ็กเกจ ${selected.key} ใช่ไหมครับ 😊\n\nกรุณาส่งเบอร์โทรศัพท์ 10 หลักที่ต้องการสมัครครับ`
      );
    } else {
      await replyMessage(
        replyToken,
        `📱 แพ็กเกจ ${selected.key}\n\n💰 ราคา ${selected.price} บาท\n🚀 ความเร็ว ${selected.speed}\n📶 ปริมาณเน็ต ${selected.data}\n🗓️ ระยะเวลา ${selected.validity}\n\nหากสนใจแจ้งเบอร์แล้วรอแอดมินทำรายการได้เลยครับ`
      );
    }
    return;
  }

  if (/สมัคร|สนใจ/.test(text)) {
    await replyMessage(
      replyToken,
      'สนใจแพ็กเกจไหนครับ?\n\nAIS 300\nAIS 350\nTRUE 300\nTRUE 350\n\nพิมพ์ชื่อแพ็กเกจที่ต้องการได้เลยครับ'
    );
    return;
  }

  // นอกเหนือจากเงื่อนไขด้านบน จะไม่ตอบกลับข้อความใดๆ ทั้งสิ้น (ตัดข้อความขออภัยออกแล้ว)
  return;
}

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('BANKSHOP WEBHOOK SERVER RUNNING');
});

app.get('/webhook', (req, res) => {
  res.status(200).send('LINE WEBHOOK READY');
});

app.post('/webhook', async (req, res) => {
  res.status(200).json({ status: 'ok' });

  const events = req.body.events || [];
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
