const express = require('express');
const crypto = require('crypto');

// ===============================
// 🔑 ตั้งค่า LINE Messaging API Token & Secret ของคุณ
// ===============================
const CHANNEL_ACCESS_TOKEN = 'tI4rvXRh22w/HvzrfBulBYV9xUTA0vk+Zns0wVQLjOLRWUmDhOohqs7RTrjTBNz7nt2iAIRsIAFVKNwnQj2VtYVCwKZYuDpy85K/Esz65dYfU/fBat2xJ4k4ay/aiSTZVXpY0L7ALL+9d2lsGoihZwdB04t89/1O/w1cDnyilFU=';
const CHANNEL_SECRET = '66feb451d12a4806de38da67fa08ce5c';

const app = express();

// ใช้ express.json() เพื่อรับค่า JSON จาก LINE Webhook โดยตรง
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf; // เก็บ Raw Body ไว้เช็กความปลอดภัย LINE Signature
  }
}));

// ===============================
// DATABASE / PACKAGES DATA
// ===============================
const HIGHLIGHT_TEXT = 'ใช้งานได้ลื่นไหลไม่มีสะดุด เน็ตแรงเต็มสปีด';
const APP_IMAGE_URL = 'https://i.ibb.co/k2h8DbsW/White-and-Black-Minimalist-Phone-Mockup-Your-Story-1.png';

const PACKAGES = [
  {
    keywords: ['ais 300', 'ais_300', 'ค่ายเขียว 300'],
    brand: 'AIS',
    price: '300',
    speed: '10 Mbps',
    detail: 'เน็ตไม่อั้น ใช้งานได้ 100 GB (หากใช้งานหมด 100 GB แล้ว จะไม่สามารถใช้งานต่อได้ในรอบนั้น) นาน 30 วัน',
    highlight: HIGHLIGHT_TEXT,
    themeColor: '#00B900'
  },
  {
    keywords: ['ais 350', 'ais_350', 'ค่ายเขียว 350'],
    brand: 'AIS',
    price: '350',
    speed: '10 Mbps',
    detail: 'เน็ตไม่อั้น ไม่ลดสปีด ใช้งานได้ไม่อั้น นาน 30 วัน',
    highlight: HIGHLIGHT_TEXT,
    themeColor: '#00B900'
  },
  {
    keywords: ['true 300', 'true_300', 'ทรู 300'],
    brand: 'TRUE',
    price: '300',
    speed: '15 Mbps',
    detail: 'เน็ตไม่อั้น ใช้งานได้ 100 GB (หากใช้งานหมด 100 GB แล้ว จะไม่สามารถใช้งานต่อได้ในรอบนั้น) นาน 30 วัน',
    highlight: HIGHLIGHT_TEXT,
    themeColor: '#E60000'
  },
  {
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
// FUNCTION: ส่งข้อความหา LINE API โดยตรง
// ===============================
async function replyMessage(replyToken, messages) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({ replyToken, messages })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ LINE API Error:', errText);
    }
  } catch (err) {
    console.error('❌ Error sending message:', err);
  }
}

// ===============================
// NORMALIZE TEXT
// ===============================
function normalizeText(text) {
  if (!text) return '';
  return text.toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

// ===============================
// FLEX MESSAGE GENERATOR
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
              { type: 'text', text: pkg.brand, weight: 'bold', color: '#FFFFFF', size: 'xs', flex: 0 }
            ],
            backgroundColor: '#00000033',
            paddingHorizontal: '10px',
            paddingVertical: '3px',
            cornerRadius: '20px'
          },
          { type: 'text', text: `แพ็กเกจ ${pkg.price} บาท`, weight: 'bold', size: 'xxl', color: '#FFFFFF', margin: 'md' },
          { type: 'text', text: `⚡ ความเร็วสูงสุด ${pkg.speed}`, size: 'md', color: '#FFFFFFEE', weight: 'bold', margin: 'xs' }
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
            spacing: 'sm',
            contents: [
              { type: 'text', text: '✨ จุดเด่นแพ็กเกจ', size: 'xs', color: '#888888', weight: 'bold' },
              { type: 'text', text: `🔥 ${pkg.highlight}`, size: 'sm', color: '#111111', weight: 'bold', wrap: true }
            ]
          },
          { type: 'separator', margin: 'lg' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'xs',
            contents: [
              { type: 'text', text: '📋 เงื่อนไขการใช้งาน', size: 'xs', color: '#888888', weight: 'bold' },
              { type: 'text', text: pkg.detail, size: 'sm', color: '#555555', wrap: true }
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
            action: { type: 'message', label: `สมัครแพ็กเกจ ${pkg.brand} ${pkg.price}฿`, text: `สนใจสมัครแพ็กเกจ ${pkg.brand} ${pkg.price} บาท` }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: { type: 'message', label: 'สอบถามแอดมิน', text: 'ติดต่อแอดมิน' }
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
  if (!rawText) return null;
  const cleanText = rawText.toString().trim();
  console.log('🔍 ข้อความที่ได้รับ:', cleanText);

  // 1. ตรวจสอบเบอร์โทรศัพท์มือถือ 10 หลัก (ลบขีด/ช่องว่างออกก่อนค้นหา)
  const digitsOnly = cleanText.replace(/[-\s]/g, '');
  const phoneMatch = digitsOnly.match(/0\d{9}/);

  if (phoneMatch) {
    const phoneNumber = phoneMatch[0];
    console.log('📞 ตรวจพบเบอร์โทรศัพท์:', phoneNumber);
    return [
      {
        type: 'text',
        text: `✅ **ได้รับเบอร์โทรศัพท์ (${phoneNumber}) เรียบร้อยแล้วครับ!**\n\n📌 ขั้นตอนถัดไป: รบกวนคุณลูกค้าเข้าไปดาวน์โหลดแอปพลิเคชันตามรูปภาพด้านล่างนี้ได้เลยนะครับ`
      },
      {
        type: 'image',
        originalContentUrl: APP_IMAGE_URL,
        previewImageUrl: APP_IMAGE_URL
      },
      {
        type: 'text',
        text: '📲 ดาวน์โหลดเสร็จเรียบร้อยแล้ว แจ้งแอดมินในแชทนี้ได้เลยนะครับ เดี๋ยวแอดมินเข้ามารับช่วงต่อให้ทันทีครับ 🙏✨'
      }
    ];
  }

  // 2. ตรวจสอบแพ็กเกจอินเทอร์เน็ต
  const textLower = normalizeText(cleanText);
  const matchedPackage = PACKAGES.find(pkg =>
    pkg.keywords.some(keyword => textLower.includes(keyword))
  );

  if (matchedPackage) {
    return [buildPackageFlexCard(matchedPackage)];
  }

  // 3. ติดต่อแอดมิน / แจ้งปัญหา
  if (['แอดมิน', 'admin', 'ติดต่อ', 'แจ้งปัญหา', 'เจ้าหน้าที่'].some(kw => textLower.includes(kw))) {
    return [
      {
        type: 'text',
        text: '🤖 **AI Smart Assistant ยินดีให้บริการครับ!** 🌟\n\nรับทราบเรื่องครับ! คุณลูกค้าสามารถพิมพ์รายละเอียด ปัญหา หรือฝากเบอร์โทรศัพท์ไว้ได้เลยนะครับ เดี๋ยวแอดมินตัวจริงจะรีบเข้ามาดูแลทันทีครับ 🛠️💬'
      }
    ];
  }

  return null;
}

// ===============================
// WEBHOOK ENDPOINT
// ===============================
app.get('/webhook', (req, res) => {
  res.status(200).send('🚀 Native LINE Bot Server is running smoothly!');
});

app.post('/webhook', async (req, res) => {
  res.status(200).end(); // ตอบ LINE กลับทันทีเพื่อป้องกัน Timeout

  try {
    const events = req.body.events || [];
    for (const event of events) {
      let payload = '';

      if (event.type === 'postback' && event.postback?.data) {
        payload = event.postback.data;
      } else if (event.type === 'message' && event.message?.type === 'text') {
        payload = event.message.text;
      }

      if (payload && event.replyToken) {
        const replyMessages = getReplyMessages(payload);
        if (replyMessages) {
          await replyMessage(event.replyToken, replyMessages);
        }
      }
    }
  } catch (error) {
    console.error('❌ Webhook Processing Error:', error);
  }
});

// ===============================
// SERVER START
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
