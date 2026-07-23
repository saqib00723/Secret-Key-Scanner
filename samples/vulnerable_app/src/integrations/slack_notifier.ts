// Slack Integration Module
export const SLACK_BOT_TOKEN = "xoxb-123456789012-345678901234-abcdefghijklmnopqrstuvwx";
export const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T12345678/B12345678/123456789012345678901234";

export async function sendSlackAlert(message: string) {
  await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
}
