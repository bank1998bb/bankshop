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

  // กลุ่มโปรโมชั่นทั้งหมด (รองรับรูปแบบที่เพิ่มเข้ามาและรูปแบบเดิม)
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
    replyText = '🤖 AI สมาร์ทรับทราบข้อมูลแพ็กเกจดังกล่าวค่ะ หากท่านสนใจสมัครใช้งาน กรุณาแจ้งหมายเลขโทรศัพท์ที่ต้องการสมัครไว้ได้เลยนะคะ ระบบจะทำการส่งเรื่องให้เจ้าหน้าที่ดูแลต่อตามลำดับคิวค่ะ ✨📱';
  } 
  // เมนูต่อโปรโมชั่น (รองรับคำว่า "ต่อโปรโปรโมชั่น" และ "ต่อโปรโมชั่น" รวมถึง "สอบถามโปรโมชั่น")
  else if (
    userMessage === 'ต่อโปรโปรโมชั่น' ||
    userMessage === 'ต่อโปรโมชั่น' ||
    userMessage === 'สอบถามโปรโมชั่น'
  ) {
    replyText = '🤖 AI สมาร์ทกำลังดำเนินการตรวจสอบข้อมูลการต่อโปรโมชั่นให้ท่านค่ะ กรุณารอสักครู่ ระหว่างนี้ระบบกำลังประสานงานให้เจ้าหน้าที่ติดต่อกลับเพื่อให้บริการโดยเร็วที่สุดค่ะ ⏳💼';
  } 
  // เมนูติดต่อแอดมิน / แจ้งปัญหา
  else if (
    userMessage === 'ติดต่อแอดมิน' ||
    userMessage === 'แจ้งปัญหา/สอบถาม'
  ) {
    replyText = '🤖 AI สมาร์ทรับเรื่องเรียบร้อยค่ะ ท่านมีข้อสงสัยหรือพบปัญหาการใช้งานด้านใด สามารถพิมพ์ข้อความทิ้งไว้ได้เลยนะคะ กำลังเร่งประสานงานให้เจ้าหน้าที่เข้ามาดูแลค่ะ กรุณารอสักครู่นะคะ 🛠️💬';
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
