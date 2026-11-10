
'use strict';

const express = require('express');
const line = require('@line/bot-sdk');

// ใช้ Environment Variables ใน Render เพื่อเก็บข้อมูลลับ
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

if (!config.channelAccessToken || !config.channelSecret) {
  console.error('ERROR: กรุณาตั้งค่า CHANNEL_ACCESS_TOKEN และ CHANNEL_SECRET ใน Render');
  process.exit(1);
}

const app = express();
const client = new line.Client(config);

// รายละเอียดแพ็กเกจ
const packages = [
  {
    key: 'AIS 300',
    price: 300,
    speed: '10 Mbps',
    data: '100 GB',
    validity: '30 วัน'
  },
  {
    key: 'AIS 350',
    price: 350,
    speed: '10 Mbps',
    data: 'ไม่อั้น ไม่ลดความเร็ว',
    validity: '30 วัน'
  },
  {
    key: 'TRUE 300',
    price: 300,
    speed: '15 Mbps',
    data: '100 GB',
    validity: '30 วัน'
  },
  {
    key: 'TRUE 350',
    price: 350,
    speed: '15 Mbps',
    data: 'ไม่อั้น ไม่ลดความเร็ว',
    validity: '30 วัน'
  }
];

// เก็บสถานะลูกค้าที่กำลังสมัคร
const pendingSignup = new Set();

async function handleEvent(event) {
  if (
    event.type !== 'message' ||
    !event.message ||
    event.message.type !== 'text'
  ) {
    return;
  }

  const userId = event.source && event.source.userId;
  if (!userId) return;

  const text = event.message.text.trim();
  const upperText = text.toUpperCase();

  // ตรวจสอบว่าลูกค้ากำลังส่งเบอร์โทรหรือไม่
  if (pendingSignup.has(userId)) {
    if (/^[0-9]{10}$/.test(text)) {
      pendingSignup.delete(userId);

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text:
          'ได้รับเบอร์โทรศัพท์แล้วครับ ✅\n' +
          'แอดมินจะตรวจสอบและติดต่อกลับเพื่อดำเนินการสมัครแพ็กเกจครับ'
      });
    } else {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'กรุณาส่งเบอร์โทรศัพท์ 10 หลักครับ'
      });
    }
    return;
  }

  // เมนูเริ่มต้น
  if (
    /^(สวัสดี|หวัดดี|เริ่ม|เมนู|แพ็กเกจ|โปรโมชั่น)$/i.test(text)
  ) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text:
        'ยินดีต้อนรับ BANKSHOP ครับ 😊\n\n' +
        'เลือกดูแพ็กเกจได้โดยพิมพ์:\n' +
        'AIS 300\n' +
        'AIS 350\n' +
        'TRUE 300\n' +
        'TRUE 350'
    });
    return;
  }

  // ตรวจสอบแพ็กเกจ
  const selected = packages.find(pkg =>
    upperText.includes(pkg.key)
  );

  if (selected) {
    if (/สมัคร|สนใจ/.test(text)) {
      pendingSignup.add(userId);

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text:
          `สนใจสมัครแพ็กเกจ ${selected.key} ใช่ไหมครับ 😊\n\n` +
          'กรุณาส่งเบอร์โทรศัพท์ 10 หลักที่ต้องการสมัครครับ'
      });
    } else {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text:
          `📱 แพ็กเกจ ${selected.key}\n\n` +
          `💰 ราคา ${selected.price} บาท\n` +
          `🚀 ความเร็ว ${selected.speed}\n` +
          `📶 ปริมาณเน็ต ${selected.data}\n` +
          `🗓️ ระยะเวลา ${selected.validity}\n\n` +
          `หากสนใจ พิมพ์ "สมัคร ${selected.key}" ได้เลยครับ`
      });
    }
    return;
  }

  // ลูกค้าสนใจแต่ยังไม่ได้เลือกแพ็กเกจ
  if (/สมัคร|สนใจ/.test(text)) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text:
        'สนใจแพ็กเกจไหนครับ?\n\n' +
        'AIS 300\n' +
        'AIS 350\n' +
        'TRUE 300\n' +
        'TRUE 350\n\n' +
        'พิมพ์ชื่อแพ็กเกจที่ต้องการได้เลยครับ'
    });
    return;
  }

  // ข้อความอื่น ๆ
  await client.replyMessage(event.replyToken, {
    type: 'text',
    text:
      'ขออภัยครับ ยังไม่เข้าใจข้อความนี้ 😅\n\n' +
      'พิมพ์ "เมนู" เพื่อดูแพ็กเกจทั้งหมดครับ'
  });
}

// ตรวจสอบว่าเซิร์ฟเวอร์ทำงานหรือไม่
app.get('/', (req, res) => {
  res.status(200).send('BANKSHOP LINE BOT SERVER RUNNING');
});

app.get('/webhook', (req, res) => {
  res.status(200).send('LINE WEBHOOK READY');
});

// LINE Webhook
app.post('/webhook', line.middleware(config), (req, res) => {
  const events = req.body.events || [];

  // ตอบ LINE ทันที
  res.status(200).json({ status: 'ok' });

  // ประมวลผลข้อความหลังจากตอบ Webhook แล้ว
  Promise.allSettled(
    events.map(event => handleEvent(event))
  ).then(results => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          'Event processing failed:',
          index,
          result.reason
        );
      }
    });
  });
});

// เปิดเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`BANKSHOP BOT RUNNING ON PORT ${PORT}`);
});
