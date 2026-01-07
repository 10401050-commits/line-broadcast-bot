const line = require("@line/bot-sdk");
const cron = require("node-cron");
const express = require("express");

const app = express();
app.use(express.json());

const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

// ====== 設定區 ======
const MESSAGE = "📢 這是自動廣播測試";
const INTERVAL_MINUTES = 20;
const END_TIME = new Date("2026-01-07T23:00:00+08:00");

const GROUP_IDS = [
  "Cxxxxxxxxxxxxxxxx"
];
// ===================

let isBroadcastOn = false;

// 廣播功能
function broadcast() {
  if (!isBroadcastOn) return;

  const now = new Date();
  if (now > END_TIME) {
    isBroadcastOn = false;
    console.log("⏹ 已到結束時間，自動停止");
    return;
  }

  GROUP_IDS.forEach(groupId => {
    client.pushMessage(groupId, {
      type: "text",
      text: MESSAGE
    });
  });

  console.log("✅ 已廣播", now.toLocaleString());
}

// 每 20 分鐘檢查一次
cron.schedule(`*/${INTERVAL_MINUTES} * * * *`, broadcast);

// 接收 LINE 訊息
app.post("/webhook", (req, res) => {
  const event = req.body.events[0];
  if (!event || event.type !== "message") {
    return res.sendStatus(200);
  }

  const text = event.message.text;
  const replyToken = event.replyToken;

  if (text === "/start") {
    isBroadcastOn = true;
    client.replyMessage(replyToken, {
      type: "text",
      text: "▶️ 廣播已啟動"
    });
  }

  if (text === "/stop") {
    isBroadcastOn = false;
    client.replyMessage(replyToken, {
      type: "text",
      text: "⏹ 廣播已停止"
    });
  }

  if (text === "/status") {
    client.replyMessage(replyToken, {
      type: "text",
      text: isBroadcastOn ? "🟢 廣播進行中" : "🔴 廣播已停止"
    });
  }

  res.sendStatus(200);
});

// Render 需要監聽 port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("🚀 Bot server running on port", port);
});
