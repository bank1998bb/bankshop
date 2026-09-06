const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();

app.get('/webhook', (req, res) => {
  res.status(200).send('OK');
});

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

const client = new line.Client(config);

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text.trim();
  let replyText = '';

  // กลุ่มโปรโมชั่นทั้งหมด (รองรับทั้งแบบใหม่และแบบเดิม)
  if (
    userMessage === 'AIS 300 บาท ลดสปีด' ||
    userMessage === 'AIS 350 บาท ไม่ลดสปีด' ||
    userMessage === 'TRUE 307 บาท ลดสปีด' ||
    userMessage === 'TRUE 357 บาท ไม่ลดสปีด' ||
    userMessage === 'โปรโมชั่น AIS 300 ลดสปีด' ||
    userMessage === 'โปรโมชั่น AIS 350 ไม่ลดสปีด' ||
    userMessage === 'โปรโมชั่น TRUE 300 ลดสปีด' ||
    userMessage === 'โปรโมชั่น TRUE 350 ไม่ลดสปีด'
  ) {
    replyText = '🤖 AI สมาร์ทรับเรื่องแพ็กเกจนี้เรียบร้อยค่ะ! หากลูกค้าสนใจ รบกวนแจ้งเบอร์โทรศัพท์ไว้ได้เลยนะคะ เดี๋ยวระบบประสานงานส่งต่อให้แอดมินดูแลต่อตามคิวให้ทันทีค่า ✨📱';
  } 
  // เมนูต่อโปรโมชั่น
  else if (userMessage === 'ต่อโปรโมชั่น' || userMessage === 'สอบถามโปรโมชั่น') {
    replyText = '🤖 AI สมาร์ทพร้อมช่วยดูแลเรื่องการต่อโปรโมชั่นให้ค่ะ 💡 กรุณารอสักครู่นะคะ กำลังส่งเรื่องประสานงานเจ้าหน้าที่ติดต่อกลับเพื่อดูแลให้อย่างด่วนที่สุดเลยค่ะ ⏳💼';
  } 
  // เมนูติดต่อแอดมิน / แจ้งปัญหา
  else if (userMessage === 'ติดต่อแอดมิน' || userMessage === 'แจ้งปัญหา/สอบถาม') {
    replyText = '🤖 AI สมาร์ทรับทราบข้อมูลค่ะ! มีปัญหาติดขัดตรงไหนหรือต้องการสอบถามเรื่องอะไรเป็นพิเศษ ทิ้งข้อความรายละเอียดไว้ให้แอดมินได้เลยนะคะ กำลังรีบติดต่อเจ้าหน้าที่เข้ามาดูแลให้กรุณารอสักครู่ค่ะ 🛠️💬';
  } 
  else {
    return Promise.resolve(null);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText,
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
