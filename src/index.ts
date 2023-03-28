import 'reflect-metadata';
import { Client } from 'discordx';
import { importx, dirname } from '@discordx/importer';
import { config, parse } from 'dotenv';
import { promises as fs } from 'fs';
import { ActivityType, IntentsBitField } from 'discord.js';

import configMongoose from './db/config-mongoose';
import createScheduledMessage from './helpers/create-scheduled-message';
import ScheduledMessageModel from './db/models/scheduled-message';
import server from './db/models/server';
import { NotBot } from './guards/messages/not-bot';

async function start() {
  console.log('Reading env...');
  try {
    const envFile = await fs.readFile('.env');
    config(parse(envFile));
  } catch (err) {
    console.log(err);
    console.log('Failed to read env file, skipping...');
  }

  console.log('Creating client...');
  const client = new Client({
    guards: [NotBot],
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildBans,
      IntentsBitField.Flags.GuildEmojisAndStickers,
      IntentsBitField.Flags.GuildInvites,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.GuildMessageReactions,
      IntentsBitField.Flags.GuildVoiceStates,
      IntentsBitField.Flags.DirectMessages,
    ],
    botGuilds: process.env.TEST_SERVER ? [process.env.TEST_SERVER] : undefined,
    ...(process.env.NODE_ENV === 'development' && { silent: false }),
  });
  await importx(
    `${dirname(import.meta.url)}/bot.{ts,js}`,
    `${dirname(import.meta.url)}/{hooks,commands}/**/*.{ts,js}`
  );

  console.log('Initializing listeners...');
  client.once('ready', async () => {
    console.log('Initializing commands...');
    await client.initApplicationCommands();
    console.log('Commands are ready.');
  });

  client.on('interactionCreate', async (interaction) => {
    await client.executeInteraction(interaction);
  });

  console.log('Logging into discord and mongodb...');
  await Promise.all([
    client.login(process.env.DISCORD_TOKEN),
    configMongoose(
      process.env.MONGO_HOST,
      process.env.MONGO_DATABASE,
      process.env.MONGO_USER,
      process.env.MONGO_PASS
    ),
  ]);

  console.log('Scheduling messages...');
  // scheduled messages
  const scheduledMessages = await ScheduledMessageModel.find();
  scheduledMessages.map((msg) => createScheduledMessage(client, msg));

  console.log('Initializing reaction roles...');
  const servers = await server.find();
  await Promise.all(
    servers
      .filter((s) => s.reactionRolesChannelId)
      .map(async (s) => {
        const c = await client.channels.fetch(s.reactionRolesChannelId);
        if (c.isTextBased()) {
          return c.messages.fetch(s.reactionRolesMessageId);
        }
      })
  );

  console.log('Setting presence...');
  client.user.setPresence({
    activities:
      process.env.NODE_ENV === 'development'
        ? [{ type: ActivityType.Watching, name: 'Andy develop me' }]
        : [{ type: ActivityType.Watching, name: 'over the Gulag' }],
  });
}

await start().then(() => console.log('Bot is now running!'));
