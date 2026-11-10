
'use strict';

const express = require('express');
const line = require('@line/bot-sdk');

// ==========================================
// CONFIGURATION
// ==========================================

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

if (!config.channelAccessToken || !config.channelSecret) {
  console.error('❌ ไม่พบ CHANNEL_ACCESS_TOKEN หรือ CHANNEL_SECRET');
  process.exit(1);
}

const app = express();
const client = new line.Client(config);

// ==========================================
// PACKAGE DATABASE
// ==========================================

const PACKAGES = [
  {
    keywords: ['ais 300', 'ais_300', 'ais300', 'ค่ายเขียว 300'],
    brand: 'AIS',
    price: '300 บาท',
    speed: '10 Mbps',
    detail: 'จำกัดปริมาณการใช้งาน 100 GB เมื่อใช้งานครบแล้วจะไม่สามารถใช้งานต่อได้',
    duration: '30 วัน',
    highlight: 'ใช้งานทั่วไปได้ลื่นไหล คุ้มค่าประหยัด'
  },
  {
    keywords: ['ais 350', 'ais_350', 'ais350', 'ค่ายเขียว 350'],
    brand: 'AIS',
    price: '350 บาท',
    speed: '10 Mbps',
    detail: 'เน็ตไม่อั้น ไม่ลดความเร็ว ใช้งานได้ไม่จำกัด',
    duration: '30 วัน',
    highlight: 'ดูหนัง ฟังเพลง เล่น TikTok และใช้งานโซเชียลได้ต่อเนื่อง'
  },
  {
    keywords: ['true 300', 'true_300', 'true300', 'ทรู 300', 'ทรู300'],
    brand: 'TRUE',
    price: '300 บาท',
    speed: '15 Mbps',
    detail: 'จำกัดปริมาณการใช้งาน 100 GB เมื่อใช้งานครบแล้วจะไม่สามารถใช้งานต่อได้',
    duration: '30 วัน',
    highlight: 'อินเทอร์เน็ตความเร็วสูง คุ้มค่าประหยัด'
  },
  {
    keywords: ['true 350', 'true_350', 'true350', 'ทรู 350', 'ทรู350'],
    brand: 'TRUE',
    price: '350 บาท',
    speed: '15 Mbps',
    detail: 'เน็ตไม่อั้น ไม่ลดความเร็ว ใช้งานได้ไม่จำกัด',
    duration: '30 วัน',
    highlight: 'เล่นเกม ดูหนัง ฟังเพลง และใช้งานออนไลน์ได้ต่อเนื่อง'
  }
];

// ==========================================
// NORMALIZE TEXT
// ==========================================

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ');
}

// ==========================================
// FIND PACKAGE
// ==========================================

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

// ==========================================
// PACKAGE FLEX MESSAGE
// ==========================================

function createPackageFlex(pkg) {
  const isAIS = pkg.brand === 'AIS';
  const brandColor = isAIS ? '#16A34A' : '#DC2626';

  const sections = [
    {
      title: '📶 รายละเอียดอินเทอร์เน็ต',
      items: [
        `ความเร็วสูงสุด ${pkg.speed}`,
        `ปริมาณอินเทอร์เน็ต: ${pkg.price === '350 บาท' ? 'ไม่จำกัด' : '100 GB'}`,
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
        'ความเร็วจริงขึ้นอยู่กับพื้นที่และสัญญาณเครือข่าย',
        `ใช้งานได้นาน ${pkg.duration}`
      ]
    }
  ];

  const sectionContents = [];

  sections.forEach(section => {
    sectionContents.push({
      type: 'text',
      text: section.title,
      weight: 'bold',
      size: 'md',
      color: brandColor,
      wrap: true,
      margin: 'lg'
    });

    section.items.forEach(item => {
      sectionContents.push({
        type: 'text',
        text: `• ${item}`,
        size: 'sm',
        color: '#444444',
        wrap: true,
        margin: 'sm'
      });
    });
  });

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

// ==========================================
// PACKAGE MENU
// ==========================================

function getPackageMenu() {
  return {
    type: 'text',
    text:
      '🤖 ยินดีต้อนรับสู่ร้านของเราค่ะ 💚\n\n' +
      '📱 เลือกดูรายละเอียดโปรโมชั่นที่สนใจได้เลยค่ะ\n\n' +
      '🟢 AIS\n' +
      '• AIS 300 บาท\n' +
      '• AIS 350 บาท\n\n' +
      '🔴 TRUE\n' +
      '• TRUE 300 บาท\n' +
      '• TRUE 350 บาท\n\n' +
      '👇 กดเลือกแพ็กเกจด้านล่างได้เลยค่ะ',
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

// ==========================================
// REPLY MESSAGE GENERATOR
// ==========================================

function getReplyMessages(rawText) {
  const text = normalizeText(rawText);

  console.log('🔍 Incoming:', text);

  // 1. ตรวจสอบแพ็กเกจ
  const pkg = findPackage(text);

  if (pkg) {
    return [createPackageFlex(pkg)];
  }

  // 2. สมัครแพ็กเกจ
  if (text.includes('สนใจสมัคร')) {
    return [{
      type: 'text',
      text:
        '🎉 ขอบคุณที่สนใจโปรโมชั่นของทางร้านค่ะ\n\n' +
        '📱 กรุณาแจ้งข้อมูลดังนี้\n' +
        '1. เบอร์โทรศัพท์ที่ต้องการสมัคร\n' +
        '2. เครือข่าย AIS หรือ TRUE\n' +
        '3. แพ็กเกจที่สนใจ\n\n' +
        'แอดมินจะเข้ามาตรวจสอบและดูแลการสมัครให้ค่ะ 💚'
    }];
  }

  // 3. แสดงโปรโมชั่นทั้งหมด
  if (
    ['โปรโมชั่น', 'โปรเน็ต', 'แพ็กเกจ',
     'แพคเกจ', 'ราคา', 'ดูโปร', 'โปร']
      .some(keyword => text.includes(keyword))
  ) {
    return [getPackageMenu()];
  }

  // 4. ติดต่อแอดมิน
  if (
    ['แอดมิน', 'admin', 'ติดต่อ',
     'แจ้งปัญหา', 'เจ้าหน้าที่', 'สอบถาม']
      .some(keyword => text.includes(keyword))
  ) {
    return [{
      type: 'text',
      text:
        '🛠️ ยินดีให้บริการค่ะ\n\n' +
        'คุณลูกค้าสามารถพิมพ์รายละเอียดหรือแจ้งปัญหาไว้ได้เลยนะคะ\n\n' +
        'แอดมินจะเข้ามาตรวจสอบและดูแลให้เร็วที่สุดค่ะ 💬'
    }];
  }

  // 5. ข้อความทั่วไป
  return [{
    type: 'text',
    text:
      'สวัสดีค่ะ ยินดีต้อนรับสู่ร้านของเราค่ะ 💚\n\n' +
      'พิมพ์คำว่า โปรโมชั่น เพื่อดูแพ็กเกจทั้งหมด\n\n' +
      '🟢 AIS 300 / AIS 350\n' +
      '🔴 TRUE 300 / TRUE 350\n\n' +
      'หรือพิมพ์ ติดต่อแอดมิน เพื่อสอบถามเพิ่มเติมค่ะ 😊'
  }];
}

// ==========================================
// HANDLE EVENT
// ==========================================

async function handleEvent(event) {
  if (!event.replyToken) return;

  // ข้อความ
  let payload = '';

  if (event.type === 'message' && event.message?.type === 'text') {
    payload = event.message.text;
  }

  // Postback
  else if (event.type === 'postback' && event.postback?.data) {
    payload = event.postback.data;
  }

  else {
    return;
  }

  try {
    const messages = getReplyMessages(payload);

    await client.replyMessage(event.replyToken, messages);

    console.log('✅ Reply successful');

  } catch (error) {
    console.error('❌ Reply Error:', error.message || error);
  }
}

// ==========================================
// SERVER HEALTH CHECK
// ==========================================

app.get('/', (req, res) => {
  res.status(200).send('LINE BOT SERVER RUNNING');
});

app.get('/webhook', (req, res) => {
  res.status(200).send('OK - LINE WEBHOOK READY');
});

// ==========================================
// LINE WEBHOOK
// ==========================================

app.post('/webhook', line.middleware(config), (req, res) => {
  const events = req.body.events || [];

  // ตอบ LINE ก่อน ป้องกัน webhook timeout
  res.status(200).json({ status: 'ok' });

  // ประมวลผลข้อความ
  Promise.allSettled(
    events.map(event => handleEvent(event))
  ).then(results => {
    results.forEach(result => {
      if (result.status === 'rejected') {
        console.error('❌ Event Error:', result.reason);
      }
    });
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message || err);

  if (!res.headersSent) {
    res.status(err.status || 500).send('Internal Server Error');
  }
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('================================');
  console.log('🚀 LINE BOT SERVER STARTED');
  console.log(`📡 PORT: ${PORT}`);
  console.log('🔗 WEBHOOK: /webhook');
  console.log('🟢 AIS PACKAGE: READY');
  console.log('🔴 TRUE PACKAGE: READY');
  console.log('🤖 FLEX MESSAGE: READY');
  console.log('================================');
});
