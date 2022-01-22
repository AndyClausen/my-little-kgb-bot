import {
  Guild,
  Message,
  MessageOptions,
  MessagePayload,
  NewsChannel,
  TextBasedChannel,
  TextChannel,
} from 'discord.js';
import { DocumentType } from '@typegoose/typegoose';

import { Server } from '../db/models/server';

export default async function sendSystemMessage(
  guild: Guild,
  message: string | MessagePayload | MessageOptions,
  server?: DocumentType<Server>
): Promise<Message | Message[]> {
  const { logChannel: logChannelId } = server?.config ?? {};
  const logChannel = logChannelId && guild.channels.cache.get(logChannelId);
  let textChannel: TextBasedChannel = logChannel?.isText() && logChannel;
  if (!textChannel) {
    textChannel = guild.publicUpdatesChannel || guild.systemChannel;
  }
  if (!textChannel) {
    textChannel = guild.channels.cache
      .filter((c) => c.permissionsFor(guild.client.user).has('SEND_MESSAGES'))
      .filter((c): c is TextChannel | NewsChannel => c.isText())
      .first();
  }
  if (!textChannel) {
    textChannel = await (await guild.fetchOwner()).createDM(true);
    await textChannel.send(
      `I had no available channel in ${guild.name} to send this, so I am sending it here instead:`
    );
  }
  return textChannel.send(message);
}
