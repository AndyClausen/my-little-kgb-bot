import {
  APIMessageContentResolvable,
  DMChannel,
  Guild,
  GuildChannel,
  Message,
  MessageOptions,
  TextChannel,
} from 'discord.js';
import { DocumentType } from '@typegoose/typegoose';

import isTextChannel from './is-text-channel';
import { Server } from '../db/models/server';

export default async function sendSystemMessage(
  guild: Guild,
  {
    message,
    options,
  }: { message: APIMessageContentResolvable | MessageOptions; options?: MessageOptions },
  server?: DocumentType<Server>
): Promise<Message | Message[]> {
  const { logChannel: logChannelId } = server?.config || {};
  let logChannel: GuildChannel;
  let textChannel: TextChannel | DMChannel;
  if (logChannelId) {
    logChannel = await guild.channels.cache.get(logChannelId);
    textChannel = isTextChannel(logChannel) && logChannel;
  }
  if (!textChannel) {
    textChannel = guild.publicUpdatesChannel || guild.systemChannel;
  }
  if (!textChannel) {
    [textChannel] = guild.channels.cache
      .array()
      .filter(isTextChannel)
      .filter((c) => c.permissionsFor(guild.client.user).has('SEND_MESSAGES'));
  }
  if (!textChannel) {
    textChannel = await guild.owner.createDM(true);
    await textChannel.send(
      `I had no available channel in ${guild.name} to send this, so I am sending it here instead:`
    );
  }
  return textChannel.send(message, options);
}
