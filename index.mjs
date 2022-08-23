import { Client } from "twitter-api-sdk";
import { WebhookClient } from "discord.js";

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const TWITTER_USERNAME = process.env.TWITTER_USERNAME;

const webhookClient = new WebhookClient({
  url: WEBHOOK_URL,
});

const client = new Client(TWITTER_BEARER_TOKEN);

/**
 * This removes the old rules to keep only required filters
 */
async function removeOldRules() {
  const rules = await client.tweets.getRules();

  if (rules.data) {
    const ids = rules.data.map((rule) => rule.id);

    await client.tweets.addOrDeleteRules(
      {
        delete: {
          ids,
        },
      },
      {
        dry_run: false,
      }
    );
  }
}

async function main() {
  await removeOldRules();

  await client.tweets.addOrDeleteRules(
    {
      add: [
        {
          value: "from:" + TWITTER_USERNAME,
        },
      ],
    },
    {
      dry_run: false,
    }
  );

  const stream = client.tweets.searchStream({
    "tweet.fields": ["author_id", "id"],
  });

  for await (const tweet of stream) {
    const uri = `https://twitter.com/${tweet.data.author_id}/status/${tweet.data.id}`;
    webhookClient.send(uri);
  }
}

main();
