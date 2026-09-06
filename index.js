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

  // กลุ่มโปรโมชั่น
  if (
    userMessage === 'TRUE 357 ไม่ลดสปีด' ||
    userMessage === 'AIS 350 ไม่ลดสปีด' ||
    userMessage === 'AIS 300 บาท ลดสปีด' ||
    userMessage === 'AIS 350 บาท ไม่ลดสปีด' ||
    userMessage === 'TRUE 307 บาท ลดสปีด' ||
    userMessage === 'TRUE 357 บาท ไม่ลดสปีด' ||
    userMessage === 'โปรโมชั่น AIS 300 ลดสปีด' ||
    userMessage === 'โปรโมชั่น AIS 350 ไม่ลดสปีด' ||
    userMessage === 'โปรโมชั่น TRUE 300 ลดสปีด' ||
    userMessage === 'โปรโมชั่น TRUE 350 ไม่ลดสปีด'
  ) {
    replyText = '🤖 AI สมาร์ท: สนใจแพ็กเกจนี้ แจ้งเบอร์โทรไว้ได้เลยค่ะ เดี๋ยวแอดมินดูแลต่อตามคิวให้นะคะ ✨📱';
  } 
  // เมนูต่อโปรโมชั่น
  else if (
    userMessage === 'ต่อโปรโปรโมชั่น' ||
    userMessage === 'ต่อโปรโมชั่น' ||
    userMessage === 'สอบถามโปรโมชั่น'
  ) {
    replyText = '🤖 AI สมาร์ท: กำลังติดต่อแอดมินเพื่อต่อโปรให้ค่ะ กรุณารอสักครู่นะคะ ⏳📅';
  } 
  // เมนูติดต่อแอดมิน / แจ้งปัญหา
  else if (
    userMessage === 'ติดต่อแอดมิน' ||
    userMessage === 'แจ้งปัญหา/สอบถาม'
  ) {
    replyText = '🤖 AI สมาร์ท: แจ้งรายละเอียดปัญหาไว้ได้เลยค่ะ กำลังตามแอดมินให้ด่วนเลยค่ะ 🛠️💬';
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
