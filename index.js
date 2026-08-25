const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();

// เพิ่มส่วนนี้เพื่อให้ปุ่ม Verify ของ LINE กดแล้วตอบกลับ status 200 (ไม่ติด 404)
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

  if (
    userMessage === 'โปรโมชั่น AIS 300 ลดสปีด' ||
    userMessage === 'โปรโมชั่น AIS 350 ไม่ลดสปีด' ||
    userMessage === 'โปรโมชั่น TRUE 300 ลดสปีด' ||
    userMessage === 'โปรโมชั่น TRUE 350 ไม่ลดสปีด'
  ) {
    replyText = 'หากลูกค้าสนใจแจ้งเบอร์ได้เลย แอดมินจะตอบกลับตามคิวนะครับ/ค่ะ';
  } 
  else if (userMessage === 'สอบถามโปรโมชั่น') {
    replyText = 'สามารถเลือกดูโปรโมชั่นด้านบนได้เลยครับ/ค่ะ';
  } 
  else if (userMessage === 'แจ้งปัญหา/สอบถาม') {
    replyText = 'กำลังติดต่อแอดมิน ให้รอสักครู่นะครับ/ค่ะ';
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
