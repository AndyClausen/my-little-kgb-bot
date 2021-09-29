import 'reflect-metadata';
import { Client } from 'discordx';
import { config, parse } from 'dotenv';
import { promises as fs } from 'fs';

import configMongoose from './db/config-mongoose';
import createScheduledMessage from './helpers/create-scheduled-message';
import ScheduledMessageModel from './db/models/scheduled-message';
import server from './db/models/server';
import { NotBot } from './guards/messages/not-bot';
import { Intents } from 'discord.js';
import * as Path from 'path';

async function start() {
  try {
    const envFile = await fs.readFile('.env');
    config(parse(envFile));
  } catch (err) {
    console.log(err);
    console.log('Failed to read env file, skipping...');
  }

  const client = new Client({
    classes: [
      // language=file-reference
      ...[`bot.ts`].map((s) => `${__dirname}/` + s),
      ...[Path.join(__dirname, 'commands', '*.ts'), Path.join(__dirname, 'hooks', '*.ts')],
    ],
    guards: [NotBot],
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_BANS,
      Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
      Intents.FLAGS.GUILD_INVITES,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.DIRECT_MESSAGES,
    ],
    botGuilds: process.env.TEST_SERVER ? [process.env.TEST_SERVER] : undefined,
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

  client.once('ready', async () => {
    await client.initApplicationCommands();
    await client.initApplicationPermissions();

    console.log('Bot ready!');
  });

  client.on('interaction', async (interaction) => {
    client.executeInteraction(interaction);
  });

  // scheduled messages
  const scheduledMessages = await ScheduledMessageModel.find();
  scheduledMessages.map((msg) => createScheduledMessage(client, msg));

  const servers = await server.find();
  await Promise.all(
    servers
      .filter((s) => s.reactionRolesChannelId)
      .map(async (s) => {
        const c = await client.channels.fetch(s.reactionRolesChannelId);
        if (c.isText()) {
          return c.messages.fetch(s.reactionRolesMessageId);
        }
      })
  );

  client.user.setPresence({
    activities:
      process.env.NODE_ENV === 'development'
        ? [{ type: 'WATCHING', name: 'Andy develop me' }]
        : [{ type: 'LISTENING', name: '/help' }],
  });
}

start().then(() => console.log('Bot is now running!'));
