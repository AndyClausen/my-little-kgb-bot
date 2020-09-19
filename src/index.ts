import { Client } from '@typeit/discord';
import { config, parse } from 'dotenv';
import { promises as fs } from 'fs';

import configMongoose from './db/config-mongoose';
import createScheduledMessage from './helpers/create-scheduled-message';
import ScheduledMessageModel from './db/models/scheduled-message';
import server from './db/models/server';
import isTextChannel from './helpers/is-text-channel';

async function start() {
  try {
    const envFile = await fs.readFile('.env');
    config(parse(envFile));
  } catch (err) {
    console.log(err);
    console.log('Failed to read env file, skipping...');
  }

  const client = new Client({
    // language=file-reference
    classes: [`bot.ts`].map((s) => `${__dirname}/` + s),
    variablesChar: ':',
  });
  await Promise.all([
    client.login(process.env.DISCORD_TOKEN),
    configMongoose(
      process.env.MONGO_HOST,
      process.env.MONGO_DATABASE,
      process.env.MONGO_USER,
      process.env.MONGO_PASS
    ),
  ]);

  // scheduled messages
  const scheduledMessages = await ScheduledMessageModel.find();
  scheduledMessages.map((msg) => createScheduledMessage(client, msg));

  const servers = await server.find();
  await Promise.all(
    servers
      .filter((s) => s.reactionRolesChannelId)
      .map(async (s) => {
        const c = await client.channels.fetch(s.reactionRolesChannelId);
        if (isTextChannel(c)) {
          return c.messages.fetch(s.reactionRolesMessageId);
        }
      })
  );

  await client.user.setPresence({ activity: { name: '!help', type: 'LISTENING' } });
}

start().then(() => console.log('Bot is now running!'));
