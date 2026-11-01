const express = require('express');
const crypto = require('crypto');

// ===============================
// ตั้งค่า (ใส่ผ่าน Environment Variables)
// CHANNEL_ACCESS_TOKEN / CHANNEL_SECRET
// ===============================
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN || 'tI4rvXRh22w/HvzrfBulBYV9xUTA0vk+Zns0wVQLjOLRWUmDhOohqs7RTrjTBNz7nt2iAIRsIAFVKNwnQj2VtYVCwKZYuDpy85K/Esz65dYfU/fBat2xJ4k4ay/aiSTZVXpY0L7ALL+9d2lsGoihZwdB04t89/1O/w1cDnyilFU=';
const CHANNEL_SECRET = process.env.CHANNEL_SECRET || '66feb451d12a4806de38da67fa08ce5c';

if (!CHANNEL_ACCESS_TOKEN || !CHANNEL_SECRET) {
  console.warn('⚠️ ยังไม่ได้ตั้งค่า CHANNEL_ACCESS_TOKEN / CHANNEL_SECRET');
}

const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// ===============================
// DATA
// ===============================
const APP_IMAGE_URL = 'https://i.ibb.co/k2h8DbsW/White-and-Black-Minimalist-Phone-Mockup-Your-Story-1.png';

const THEME = {
  AIS: { color: '#00A651', soft: '#E8F7EE' },
  TRUE: { color: '#E60012', soft: '#FDECEE' }
};

const PACKAGES = [
  {
    id: 'ais300', keywords: ['ais 300', 'ais_300', 'ค่ายเขียว 300'],
    brand: 'AIS', price: '300', speed: '10 Mbps',
    features: ['เน็ตไม่อั้น ใช้ได้ 100 GB', 'ใช้ครบ 100 GB แล้วจะใช้ต่อในรอบนั้นไม่ได้', 'ใช้งานได้นาน 30 วัน']
  },
  {
    id: 'ais350', keywords: ['ais 350', 'ais_350', 'ค่ายเขียว 350'],
    brand: 'AIS', price: '350', speed: '10 Mbps',
    features: ['เน็ตไม่อั้น ไม่ลดสปีด', 'ใช้งานได้ไม่จำกัด', 'ใช้งานได้นาน 30 วัน']
  },
  {
    id: 'true300', keywords: ['true 300', 'true_300', 'ทรู 300'],
    brand: 'TRUE', price: '300', speed: '15 Mbps',
    features: ['เน็ตไม่อั้น ใช้ได้ 100 GB', 'ใช้ครบ 100 GB แล้วจะใช้ต่อในรอบนั้นไม่ได้', 'ใช้งานได้นาน 30 วัน']
  },
  {
    id: 'true350', keywords: ['true 350', 'true_350', 'ทรู 350'],
    brand: 'TRUE', price: '350', speed: '15 Mbps',
    features: ['เน็ตไม่อั้น ไม่ลดสปีด', 'ใช้งานได้ไม่จำกัด', 'ใช้งานได้นาน 30 วัน']
  }
];

// ===============================
// HELPERS
// ===============================
const normalize = (t) => (t ? t.toString().trim().toLowerCase().replace(/\s+/g, ' ') : '');

const QUICK_REPLY = {
  items: [
    { type: 'action', action: { type: 'message', label: '📦 ดูแพ็กเกจ', text: 'เมนู' } },
    { type: 'action', action: { type: 'message', label: 'AIS 300', text: 'ais 300' } },
    { type: 'action', action: { type: 'message', label: 'AIS 350', text: 'ais 350' } },
    { type: 'action', action: { type: 'message', label: 'TRUE 300', text: 'true 300' } },
    { type: 'action', action: { type: 'message', label: 'TRUE 350', text: 'true 350' } },
    { type: 'action', action: { type: 'message', label: '💬 คุยกับแอดมิน', text: 'ติดต่อแอดมิน' } }
  ]
};

function withQuickReply(messages) {
  const last = messages[messages.length - 1];
  last.quickReply = QUICK_REPLY;
  return messages;
}

async function callLine(path, body) {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/message/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
      body: JSON.stringify(body)
    });
    if (!res.ok) console.error('❌ LINE API Error:', await res.text());
  } catch (err) {
    console.error('❌ Error sending message:', err);
  }
}

const replyMessage = (replyToken, messages) => callLine('reply', { replyToken, messages });

// ===============================
// FLEX BUILDERS
// ===============================
function packageBubble(pkg, size = 'mega') {
  const t = THEME[pkg.brand];
  return {
    type: 'bubble',
    size,
    header: {
      type: 'box', layout: 'vertical', backgroundColor: t.color, paddingAll: '20px',
      contents: [
        {
          type: 'box', layout: 'horizontal', justifyContent: 'space-between', alignItems: 'center',
          contents: [
            { type: 'text', text: pkg.brand, color: '#FFFFFF', weight: 'bold', size: 'sm' },
            { type: 'text', text: '30 วัน', color: '#FFFFFF', size: 'sm', align: 'end' }
          ]
        },
        {
          type: 'box', layout: 'baseline', margin: 'lg',
          contents: [
            { type: 'text', text: pkg.price, color: '#FFFFFF', weight: 'bold', size: '4xl', flex: 0 },
            { type: 'text', text: ' บาท', color: '#FFFFFF', size: 'md', margin: 'sm', flex: 0 }
          ]
        }
      ]
    },
    body: {
      type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'md',
      contents: [
        {
          type: 'box', layout: 'horizontal', backgroundColor: t.soft, cornerRadius: '12px', paddingAll: '12px',
          contents: [
            { type: 'text', text: '⚡ ความเร็วสูงสุด', size: 'sm', color: '#555555', flex: 3 },
            { type: 'text', text: pkg.speed, size: 'md', weight: 'bold', color: t.color, align: 'end', flex: 2 }
          ]
        },
        {
          type: 'box', layout: 'vertical', spacing: 'sm', margin: 'md',
          contents: pkg.features.map((f) => ({
            type: 'box', layout: 'horizontal', spacing: 'sm',
            contents: [
              { type: 'text', text: '✓', color: t.color, weight: 'bold', size: 'sm', flex: 0 },
              { type: 'text', text: f, size: 'sm', color: '#333333', wrap: true }
            ]
          }))
        }
      ]
    },
    footer: {
      type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
      contents: [
        {
          type: 'button', style: 'primary', color: t.color, height: 'md',
          action: { type: 'message', label: 'สมัครเลย', text: `สนใจสมัครแพ็กเกจ ${pkg.brand} ${pkg.price} บาท` }
        },
        {
          type: 'button', style: 'link', height: 'sm',
          action: { type: 'message', label: 'สอบถามแอดมิน', text: 'ติดต่อแอดมิน' }
        }
      ]
    }
  };
}

const packageFlex = (pkg) => ({
  type: 'flex',
  altText: `แพ็กเกจ ${pkg.brand} ${pkg.price} บาท / 30 วัน`,
  contents: packageBubble(pkg)
});

const menuFlex = () => ({
  type: 'flex',
  altText: 'เมนูแพ็กเกจเน็ตทั้งหมด',
  contents: { type: 'carousel', contents: PACKAGES.map((p) => packageBubble(p, 'kilo')) }
});

function stepFlex(title, steps) {
  return {
    type: 'flex',
    altText: title,
    contents: {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'md',
        contents: [
          { type: 'text', text: title, weight: 'bold', size: 'lg', wrap: true },
          { type: 'separator' },
          ...steps.map((s, i) => ({
            type: 'box', layout: 'horizontal', spacing: 'md',
            contents: [
              { type: 'text', text: `${i + 1}`, weight: 'bold', color: '#00A651', flex: 0 },
              { type: 'text', text: s, size: 'sm', wrap: true, color: '#333333' }
            ]
          }))
        ]
      }
    }
  };
}

// ===============================
// REPLY LOGIC
// ===============================
function getReplyMessages(rawText) {
  if (!rawText) return null;
  const clean = rawText.toString().trim();
  const text = normalize(clean);
  console.log('🔍 ข้อความที่ได้รับ:', clean);

  // 1) เบอร์โทร 10 หลัก
  const phoneMatch = clean.replace(/[-\s]/g, '').match(/(?<!\d)0\d{9}(?!\d)/);
  if (phoneMatch) {
    const phone = phoneMatch[0];
    return withQuickReply([
      { type: 'text', text: `✅ ได้รับเบอร์ ${phone} แล้วครับ` },
      { type: 'image', originalContentUrl: APP_IMAGE_URL, previewImageUrl: APP_IMAGE_URL },
      stepFlex('ขั้นตอนถัดไป', [
        'ดาวน์โหลดแอปตามรูปด้านบน',
        'ทำเสร็จแล้วพิมพ์แจ้งแอดมินในแชทนี้ได้เลย',
        'แอดมินจะเข้ามาดูแลต่อให้ทันที 🙏'
      ])
    ]);
  }

  // 2) กดสมัคร -> ขอเบอร์โทร
  if (text.includes('สนใจสมัคร')) {
    return withQuickReply([
      { type: 'text', text: '🎉 ยินดีครับ! พิมพ์เบอร์โทรศัพท์ 10 หลักที่ต้องการสมัครส่งมาได้เลยครับ\nเช่น 0812345678' }
    ]);
  }

  // 3) ถามแพ็กเกจเฉพาะรุ่น
  const pkg = PACKAGES.find((p) => p.keywords.some((k) => text.includes(k)));
  if (pkg) return withQuickReply([packageFlex(pkg)]);

  // 4) เมนู / ราคา
  if (['เมนู', 'แพ็กเกจ', 'แพคเกจ', 'ราคา', 'package', 'menu'].some((k) => text.includes(k))) {
    return withQuickReply([{ type: 'text', text: '📦 แพ็กเกจทั้งหมด เลื่อนดูได้เลยครับ 👉' }, menuFlex()]);
  }

  // 5) ติดต่อแอดมิน
  if (['แอดมิน', 'admin', 'ติดต่อ', 'แจ้งปัญหา', 'เจ้าหน้าที่'].some((k) => text.includes(k))) {
    return withQuickReply([
      { type: 'text', text: '👋 รับเรื่องแล้วครับ พิมพ์รายละเอียดปัญหา หรือฝากเบอร์โทรไว้ได้เลย แอดมินจะรีบเข้ามาดูแลครับ' }
    ]);
  }

  // 6) ทักทาย
  if (['สวัสดี', 'hello', 'hi', 'หวัดดี', 'ดีครับ', 'ดีค่ะ'].some((k) => text.includes(k))) {
    return withQuickReply([{ type: 'text', text: 'สวัสดีครับ 👋 สนใจแพ็กเกจเน็ตแบบไหน เลือกจากปุ่มด้านล่างได้เลยครับ' }]);
  }

  return null;
}

// ===============================
// WEBHOOK
// ===============================
function verifySignature(req) {
  if (!CHANNEL_SECRET || !req.rawBody) return false;
  const expected = crypto.createHmac('sha256', CHANNEL_SECRET).update(req.rawBody).digest('base64');
  const given = req.get('x-line-signature') || '';
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.get('/webhook', (req, res) => res.status(200).send('🚀 LINE Bot Server is running!'));

app.post('/webhook', async (req, res) => {
  if (!verifySignature(req)) return res.status(401).end();
  res.status(200).end();

  try {
    for (const event of req.body.events || []) {
      if (!event.replyToken) continue;

      // เพิ่มเพื่อนใหม่
      if (event.type === 'follow') {
        await replyMessage(event.replyToken, withQuickReply([
          { type: 'text', text: 'ยินดีต้อนรับครับ 🎉\nเน็ตแรง ลื่นไหล ไม่สะดุด เลือกดูแพ็กเกจได้จากปุ่มด้านล่างเลยครับ' }
        ]));
        continue;
      }

      let payload = '';
      if (event.type === 'postback' && event.postback?.data) payload = event.postback.data;
      else if (event.type === 'message' && event.message?.type === 'text') payload = event.message.text;

      if (payload) {
        const msgs = getReplyMessages(payload);
        if (msgs) await replyMessage(event.replyToken, msgs);
      }
    }
  } catch (error) {
    console.error('❌ Webhook Processing Error:', error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
