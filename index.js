'use strict';

const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

if (!config.channelAccessToken || !config.channelSecret) {
  console.error('ERROR: กรุณาตั้งค่า CHANNEL_ACCESS_TOKEN และ CHANNEL_SECRET');
  process.exit(1);
}

const app = express();
const client = new line.Client(config);

const PACKAGES = [
  {
    keywords: ['ais 300', 'ais_300', 'ais300', 'ค่ายเขียว 300'],
    brand: 'AIS',
    price: '300 บาท',
    speed: '10 Mbps',
    detail: 'จำกัดปริมาณการใช้งาน 100 GB เมื่อใช้งานครบแล้วจะไม่สามารถใช้งานต่อได้',
    duration: '30 วัน',
    highlight: 'ใช้งานทั่วไปได้ลื่นไหล คุ้มค่าประหยัด',
    dataLimit: '100 GB'
  },
  {
    keywords: ['ais 350', 'ais_350', 'ais350', 'ค่ายเขียว 350'],
    brand: 'AIS',
    price: '350 บาท',
    speed: '10 Mbps',
    detail: 'เน็ตไม่อั้น ไม่ลดความเร็ว ใช้งานได้ไม่จำกัด',
    duration: '30 วัน',
    highlight: 'ดูหนัง ฟังเพลง เล่น TikTok และใช้งานโซเชียลได้ต่อเนื่อง',
    dataLimit: 'ไม่จำกัด'
  },
  {
    keywords: ['true 300', 'true_300', 'true300', 'ทรู 300', 'ทรู300'],
    brand: 'TRUE',
    price: '300 บาท',
    speed: '15 Mbps',
    detail: 'จำกัดปริมาณการใช้งาน 100 GB เมื่อใช้งานครบแล้วจะไม่สามารถใช้งานต่อได้',
    duration: '30 วัน',
    highlight: 'อินเทอร์เน็ตความเร็วสูง คุ้มค่าประหยัด',
    dataLimit: '100 GB'
  },
  {
    keywords: ['true 350', 'true_350', 'true350', 'ทรู 350', 'ทรู350'],
    brand: 'TRUE',
    price: '350 บาท',
    speed: '15 Mbps',
    detail: 'เน็ตไม่อั้น ไม่ลดความเร็ว ใช้งานได้ไม่จำกัด',
    duration: '30 วัน',
    highlight: 'เล่นเกม ดูหนัง ฟังเพลง และใช้งานออนไลน์ได้ต่อเนื่อง',
    dataLimit: 'ไม่จำกัด'
  }
];

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ');
}

function findPackage(rawText) {
  const text = normalizeText(rawText);
  const compactText = text.replace(/\s/g, '');

  return PACKAGES.find(pkg =>
    pkg.keywords.some(keyword => {
      const key = normalizeText(keyword);
      return text.includes(key) ||
        compactText.includes(key.replace(/\s/g, ''));
    })
  );
}

function createPackageFlex(pkg) {
  const brandColor = pkg.brand === 'AIS' ? '#16A34A' : '#DC2626';

  const sections = [
    {
      title: '📶 รายละเอียดอินเทอร์เน็ต',
      items: [
        `ความเร็วสูงสุด ${pkg.speed}`,
        `ปริมาณอินเทอร์เน็ต ${pkg.dataLimit}`,
        `ระยะเวลาใช้งาน ${pkg.duration}`
      ]
    },
    {
      title: '💰 รายละเอียดค่าโปรโมชั่น',
      items: [
        `ราคาโปรโมชั่น ${pkg.price}`,
        'ราคาเบ็ดเสร็จ ไม่มีบวกเพิ่ม'
      ]
    },
    {
      title: '🚀 จุดเด่นของแพ็กเกจ',
      items: [
        pkg.highlight,
        'เหมาะสำหรับเล่น Facebook และ LINE',
        'ดู YouTube และ TikTok',
        'ดูหนัง ฟังเพลง และใช้งานทั่วไป'
      ]
    },
    {
      title: '📌 เงื่อนไขการใช้งาน',
      items: [
        pkg.detail,
        'ความเร็วจริงขึ้นอยู่กับพื้นที่และสัญญาณเครือข่าย'
      ]
    }
  ];

  const sectionContents = [];

  for (const section of sections) {
    sectionContents.push({
      type: 'text',
      text: section.title,
      weight: 'bold',
      size: 'md',
      color: brandColor,
      wrap: true,
      margin: 'lg'
    });

    for (const item of section.items) {
      sectionContents.push({
        type: 'text',
        text: `• ${item}`,
        size: 'sm',
        color: '#444444',
        wrap: true,
        margin: 'sm'
      });
    }
  }

  return {
    type: 'flex',
    altText: `รายละเอียดแพ็กเกจ ${pkg.brand} ${pkg.price}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: brandColor,
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: 'INTERNET PACKAGE',
            color: '#FFFFFF',
            size: 'xs',
            weight: 'bold'
          },
          {
            type: 'text',
            text: `${pkg.brand} ${pkg.price}`,
            color: '#FFFFFF',
            size: 'xl',
            weight: 'bold',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'แพ็กเกจอินเทอร์เน็ต',
            color: '#FFFFFF',
            size: 'sm',
            margin: 'sm'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#F3F4F6',
            cornerRadius: '12px',
            paddingAll: '15px',
            contents: [
              {
                type: 'text',
                text: 'ความเร็วอินเทอร์เน็ต',
                size: 'sm',
                color: '#666666',
                align: 'center'
              },
              {
                type: 'text',
                text: pkg.speed,
                size: '3xl',
                weight: 'bold',
                color: brandColor,
                align: 'center',
                margin: 'sm'
              }
            ]
          },
          ...sectionContents
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '15px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: brandColor,
            height: 'md',
            action: {
              type: 'message',
              label: 'สนใจสมัครแพ็กเกจนี้',
              text: `สนใจสมัคร ${pkg.brand} ${pkg.price}`
            }
          },
          {
            type: 'text',
            text: 'สอบถามเพิ่มเติม ติดต่อแอดมินได้เลยค่ะ 💬',
            size: 'xs',
            color: '#888888',
            align: 'center',
            wrap: true,
            margin: 'md'
          }
        ]
      }
    }
  };
}

function getPackageMenu() {
  return {
    type: 'text',
    text:
      '🤖 ยินดีต้อนรับสู่ร้านของเราค่ะ 💚\n\n' +
      'เลือกแพ็กเกจที่สนใจเพื่อดูรายละเอียดได้เลยค่ะ',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: '🟢 AIS 300',
            text: 'AIS 300'
          }
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '🟢 AIS 350',
            text: 'AIS 350'
          }
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '🔴 TRUE 300',
            text: 'TRUE 300'
          }
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '🔴 TRUE 350',
            text: 'TRUE 350'
          }
        }
      ]
    }
  };
}

function getReplyMessages(rawText) {
  const text = normalizeText(rawText);
  console.log('Incoming LINE message:', text);

  // ตรวจคำสั่งสมัครก่อนค้นหาแพ็กเกจ
  if (text.includes('สนใจสมัคร')) {
    const pkg = findPackage(text);

    return [{
      type: 'text',
      text:
        `ขอบคุณที่สนใจ ${pkg ? `${pkg.brand} ${pkg.price}` : 'โปรโมชั่นของทางร้าน'} ค่ะ 🎉\n\n` +
        'กรุณาส่งเบอร์โทรศัพท์ที่ต้องการสมัครไว้ได้เลยค่ะ\n' +
        'แอดมินจะตรวจสอบแพ็กเกจและติดต่อกลับเพื่อดำเนินการสมัครค่ะ 📱'
    }];
  }

  const pkg = findPackage(text);

  if (pkg) {
    return [createPackageFlex(pkg)];
  }

  if (
    ['โปรโมชั่น', 'โปรเน็ต', 'แพ็กเกจ', 'แพคเกจ', 'ราคา', 'ดูโปร', 'โปร']
      .some(keyword => text.includes(keyword))
  ) {
    return [getPackageMenu()];
  }

  if (
    ['แอดมิน', 'admin', 'ติดต่อ', 'แจ้งปัญหา', 'เจ้าหน้าที่', 'สอบถาม']
      .some(keyword => text.includes(keyword))
  ) {
    return [{
      type: 'text',
      text:
        '🛠️ ยินดีให้บริการค่ะ\n\n' +
        'พิมพ์รายละเอียดหรือแจ้งปัญหาที่พบไว้ได้เลยนะคะ\n' +
        'แอดมินจะเข้ามาตรวจสอบและดูแลให้ค่ะ 💬'
    }];
  }

  return [{
    type: 'text',
    text:
      'สวัสดีค่ะ ยินดีต้อนรับสู่ร้านของเราค่ะ 💚\n\n' +
      'พิมพ์คำว่า “โปรโมชั่น” เพื่อดูแพ็กเกจทั้งหมด\n' +
      'หรือพิมพ์ AIS 300, AIS 350, TRUE 300 หรือ TRUE 350\n' +
      'เพื่อดูรายละเอียดแพ็กเกจได้เลยค่ะ'
  }];
}

async function handleEvent(event) {
  if (
    !event.replyToken ||
    event.replyToken === '00000000000000000000000000000000'
  ) {
    console.log('Skip event: missing/invalid reply token');
    return;
  }

  let payload = '';

  if (
    event.type === 'message' &&
    event.message &&
    event.message.type === 'text'
  ) {
    payload = event.message.text;
  } else if (
    event.type === 'postback' &&
    event.postback &&
    event.postback.data
  ) {
    payload = event.postback.data;
  } else {
    console.log('Skip unsupported event:', event.type);
    return;
  }

  const messages = getReplyMessages(payload);

  try {
    const result = await client.replyMessage(event.replyToken, messages);
    console.log('LINE reply sent successfully:', result);
  } catch (error) {
    console.error('LINE reply failed:', {
      message: error.message,
      statusCode: error.statusCode,
      response: error.originalError &&
        error.originalError.response
        ? error.originalError.response.data
        : undefined
    });
  }
}

app.get('/', (req, res) => {
  res.status(200).send('LINE BOT SERVER RUNNING');
});

app.get('/webhook', (req, res) => {
  res.status(200).send('OK - LINE WEBHOOK READY');
});

// LINE middleware ใช้ตรวจสอบลายเซ็น Webhook
app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = (req.body && req.body.events) || [];

  try {
    await Promise.allSettled(
      events.map(event => handleEvent(event))
    );

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ status: 'error' });
  }
});

app.use((err, req, res, next) => {
  console.error('Express error:', err.message || err);

  if (!res.headersSent) {
    res.status(err.status || 500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LINE Bot is running on port ${PORT}`);
  console.log('Webhook endpoint: /webhook');
});
