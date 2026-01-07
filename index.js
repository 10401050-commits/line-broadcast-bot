const line = require("@line/bot-sdk");
const express = require("express");

const app = express();
app.use(express.json());

const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

// ====== 廣播設定 ======
const MESSAGE = "📢 這是連續廣播測試";
const BROADCAST_DURATION_MINUTES = 20; // 總共廣播 20 分鐘
const BROADCAST_INTERVAL_SECONDS = 10;  // 每 10 秒廣播一次
const GROUP_IDS = [
  "Cxxxxxxxxxxxxxxxx" // 改成你的群組 ID
];

let broadcastInterval = null; // 定時器
let broadcastEndTimeout = null; // 停止計時器

// 廣播函數
function broadcastMessage() {
  GROUP_IDS.forEach(groupId => {
    client.pushMessage(groupId, { type: "text", text: MESSAGE })
      .then(() => console.log("✅ 廣播訊息到", groupId))
      .catch(err => console.error(err));
  });
}

// ====== LINE 指令控制 ======
app.post("/webhook", (req, res) => {
  const events = req.body.events;
  if (!events || events.length === 0) return res.sendStatus(200);

  events.forEach(event => {
    if (event.type !== "message" || !event.message) return;

    const text = event.message.text;
    const replyToken = event.replyToken;

    if (text === "/start") {
      // 如果已經在廣播就先清掉
      if (broadcastInterval) clearInterval(broadcastInterval);
      if (broadcastEndTimeout) clearTimeout(broadcastEndTimeout);

      broadcastMessage(); // 立即廣播一次

      // 每 10 秒廣播
      broadcastInterval = setInterval(broadcastMessage, BROADCAST_INTERVAL_SECONDS * 1000);

      // 20 分鐘後自動停止
      broadcastEndTimeout = setTimeout(() => {
        clearInterval(broadcastInterval);
        broadcastInterval = null;
        broadcastEndTimeout = null;
        GROUP_IDS.forEach(groupId => {
          client.pushMessage(groupId, { type: "text", text: "⏹ 連續廣播 20 分鐘結束" })
            .catch(err => console.error(err));
        });
        console.log("⏹ 廣播結束");
      }, BROADCAST_DURATION_MINUTES * 60 * 1000);

      client.replyMessage(replyToken, { type: "text", text: "▶️ 開始連續廣播 20 分鐘，每 10 秒發送一次" });
    }

    if (text === "/stop") {
      if (broadcastInterval) clearInterval(broadcastInterval);
      if (broadcastEndTimeout) clearTimeout(broadcastEndTimeout);
      broadcastInterval = null;
      broadcastEndTimeout = null;
      client.replyMessage(replyToken, { type: "text", text: "⏹ 廣播已停止" });
    }

    if (text === "/status") {
      const status = broadcastInterval ? "🟢 廣播進行中" : "🔴 廣播已停止";
      client.replyMessage(replyToken, { type: "text", text: status });
    }
  });

  res.sendStatus(200);
});

// ====== Render 監聽 port ======
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("🚀 Bot server running on port", port));
