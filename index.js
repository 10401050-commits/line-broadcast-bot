const cron = require("node-cron");
const line = require("@line/bot-sdk");

const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

// ====== 設定區 ======
const MESSAGE = "📢 這是自動廣播測試";
const INTERVAL_MINUTES = 20;
const END_TIME = new Date("2026-01-07T23:00:00+08:00");

// 群組 ID（之後再填）
const GROUP_IDS = [
  "Cxxxxxxxxxxxxxxxx"
];
// ===================

function broadcast() {
  const now = new Date();
  if (now > END_TIME) {
    console.log("⏹ 已超過結束時間，停止廣播");
    process.exit(0);
  }

  GROUP_IDS.forEach(groupId => {
    client.pushMessage(groupId, {
      type: "text",
      text: MESSAGE
    });
  });

  console.log("✅ 已廣播", now.toLocaleString());
}

// 每 20 分鐘跑一次
cron.schedule(`*/${INTERVAL_MINUTES} * * * *`, broadcast);

console.log("🚀 廣播機器人啟動");
