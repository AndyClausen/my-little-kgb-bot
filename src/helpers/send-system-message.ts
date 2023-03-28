import {
  Guild,
  Message,
  BaseMessageOptions,
  MessagePayload,
  NewsChannel,
  TextBasedChannel,
  TextChannel,
  PermissionsBitField,
} from 'discord.js';
import { DocumentType } from '@typegoose/typegoose';

import { Server } from '../db/models/server';

export default async function sendSystemMessage(
  guild: Guild,
  message: string | MessagePayload | BaseMessageOptions,
  server?: DocumentType<Server>
): Promise<Message | Message[]> {
  const { logChannel: logChannelId } = server?.config ?? {};
  const logChannel = logChannelId && guild.channels.cache.get(logChannelId);
  let textChannel: TextBasedChannel = logChannel?.isTextBased() && logChannel;
  if (!textChannel) {
    textChannel = guild.publicUpdatesChannel || guild.systemChannel;
  }
  if (!textChannel) {
    textChannel = guild.channels.cache
      .filter((c) =>
        c.permissionsFor(guild.client.user).has(PermissionsBitField.Flags.SendMessages)
      )
      .filter((c): c is TextChannel | NewsChannel => c.isTextBased())
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
