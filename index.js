const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();

// ใช้ SDK MessagingApiClient เวอร์ชันล่าสุด
const lineClient = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

// ===============================
// DATABASE / PACKAGES DATA
// ===============================
const HIGHLIGHT_TEXT = 'แรงไม่มีตก เต็ม Speed ตลอดการใช้งาน';

const PACKAGES = [
  {
    id: 'ais_300',
    keywords: ['ais 300', 'ais_300', 'ค่ายเขียว 300'],
    brand: 'AIS',
    price: '300',
    speed: '10 Mbps',
    detail: 'เน็ตไม่อั้น ใช้งานได้ 100 GB (หากใช้ครบ 100 GB แล้วจะไม่สามารถใช้งานต่อได้) นาน 30 วัน',
    highlight: HIGHLIGHT_TEXT,
    themeColor: '#00B900' // เขียว AIS
  },
  {
    id: 'ais_350',
    keywords: ['ais 350', 'ais_350', 'ค่ายเขียว 350'],
    brand: 'AIS',
    price: '350',
    speed: '10 Mbps',
    detail: 'เน็ตไม่อั้น ไม่ลดสปีด ใช้งานได้ไม่อั้น นาน 30 วัน',
    highlight: HIGHLIGHT_TEXT,
    themeColor: '#00B900'
  },
  {
    id: 'true_300',
    keywords: ['true 300', 'true_300', 'ทรู 300'],
    brand: 'TRUE',
    price: '300',
    speed: '15 Mbps',
    detail: 'เน็ตไม่อั้น ใช้งานได้ 100 GB (หากใช้ครบ 100 GB แล้วจะไม่สามารถใช้งานต่อได้) นาน 30 วัน',
    highlight: HIGHLIGHT_TEXT,
    themeColor: '#E60000' // แดง TRUE
  },
  {
    id: 'true_350',
    keywords: ['true 350', 'true_350', 'ทรู 350'],
    brand: 'TRUE',
    price: '350',
    speed: '15 Mbps',
    detail: 'เน็ตไม่อั้น ไม่ลดสปีด ใช้งานได้ไม่อั้น นาน 30 วัน',
    highlight: HIGHLIGHT_TEXT,
    themeColor: '#E60000'
  }
];

// ===============================
// WEBHOOK HEALTH CHECK
// ===============================
app.get('/webhook', (req, res) => {
  res.status(200).send('🚀 Modern LINE Bot Server is up and running!');
});

// ===============================
// NORMALIZE TEXT
// ===============================
function normalizeText(text) {
  if (!text) return '';
  return text.toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

// ===============================
// MODERN FLEX MESSAGE GENERATOR
// ===============================
function buildPackageFlexCard(pkg) {
  return {
    type: 'flex',
    altText: `📦 แพ็กเกจสุดคุ้ม ${pkg.brand} ${pkg.price} บาท/เดือน`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: pkg.themeColor,
        paddingAll: '20px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: pkg.brand,
                weight: 'bold',
                color: '#FFFFFF',
                size: 'xs',
                flex: 0
              }
            ],
            backgroundColor: '#00000033',
            paddingHorizontal: '10px',
            paddingVertical: '3px',
            cornerRadius: '20px'
          },
          {
            type: 'text',
            text: `แพ็กเกจ ${pkg.price} บาท`,
            weight: 'bold',
            size: 'xxl',
            color: '#FFFFFF',
            margin: 'md'
          },
          {
            type: 'text',
            text: `⚡ ความเร็วสูงสุด ${pkg.speed}`,
            size: 'md',
            color: '#FFFFFFEE',
            weight: 'bold',
            margin: 'xs'
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
            margin: 'none',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '✨ จุดเด่นแพ็กเกจ',
                size: 'xs',
                color: '#888888',
                weight: 'bold'
              },
              {
                type: 'text',
                text: `🔥 ${pkg.highlight}`,
                size: 'sm',
                color: '#111111',
                weight: 'bold',
                wrap: true
              }
            ]
          },
          { type: 'separator', margin: 'lg' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'xs',
            contents: [
              {
                type: 'text',
                text: '📋 เงื่อนไขการใช้งาน',
                size: 'xs',
                color: '#888888',
                weight: 'bold'
              },
              {
                type: 'text',
                text: pkg.detail,
                size: 'sm',
                color: '#555555',
                wrap: true
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '20px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: pkg.themeColor,
            height: 'sm',
            action: {
              type: 'message',
              label: `สมัครแพ็กเกจ ${pkg.brand} ${pkg.price}฿`,
              text: `สนใจสมัครแพ็กเกจ ${pkg.brand} ${pkg.price} บาท`
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'message',
              label: 'สอบถามแอดมิน',
              text: 'ติดต่อแอดมิน'
            }
          }
        ]
      }
    }
  };
}

// ===============================
// REPLY MESSAGES GENERATOR
// ===============================
function getReplyMessages(rawText) {
  const text = normalizeText(rawText);
  console.log('🔍 ประมวลผลข้อความ:', text);

  // 1. ตรวจสอบแพ็กเกจอินเทอร์เน็ต
  const matchedPackage = PACKAGES.find(pkg =>
    pkg.keywords.some(keyword => text.includes(keyword))
  );

  if (matchedPackage) {
    return [
      buildPackageFlexCard(matchedPackage),
      {
        type: 'text',
        text: '💡 สนใจสมัครแพ็กเกจนี้ พิมพ์ **"แจ้งเบอร์โทรศัพท์"** ไว้ในแชทได้เลยนะคะ เดี๋ยวแอดมินจะรีบดำเนินการสมัครให้ทันทีค่ะ 📱✨'
      }
    ];
  }

  // 2. ติดต่อแอดมิน / แจ้งปัญหา
  if (['แอดมิน', 'admin', 'ติดต่อ', 'แจ้งปัญหา', 'เจ้าหน้าที่'].some(kw => text.includes(kw))) {
    return [
      {
        type: 'text',
        text: '🤖 **AI Smart Assistant ยินดีให้บริการค่ะ!** 🌟\n\nรับทราบเรื่องค่ะ! คุณลูกค้าสามารถพิมพ์รายละเอียด ปัญหา หรือเบอร์โทรศัพท์ไว้ได้เลยนะคะ เดี๋ยวแอดมินตัวจริงจะรีบเข้ามาดูแลทันทีค่ะ 🛠️💬'
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

    return await lineClient.replyMessage({
      replyToken: event.replyToken,
      messages: replyMessages
    });

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
  console.log(`🚀 Server connected on port ${PORT}`);
  console.log(`📡 Ready for Webhook events at /webhook`);
});
