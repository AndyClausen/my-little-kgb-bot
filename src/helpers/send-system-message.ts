import {
  APIMessageContentResolvable,
  DMChannel,
  Guild,
  GuildChannel,
  Message,
  MessageOptions,
  NewsChannel,
  TextChannel,
} from 'discord.js';
import { DocumentType } from '@typegoose/typegoose';

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
  let textChannel: TextChannel | NewsChannel | DMChannel;
  if (logChannelId) {
    logChannel = await guild.channels.cache.get(logChannelId);
    textChannel = logChannel.isText() && logChannel;
  }
  if (!textChannel) {
    textChannel = guild.publicUpdatesChannel || guild.systemChannel;
  }
  if (!textChannel) {
    [textChannel] = guild.channels.cache
      .filter((c) => c.permissionsFor(guild.client.user).has('SEND_MESSAGES'))
      .array()
      .filter((c): c is TextChannel | NewsChannel => c.isText());
  }
  if (!textChannel) {
    textChannel = await (await guild.fetchOwner()).createDM(true);
    await textChannel.send(
      `I had no available channel in ${guild.name} to send this, so I am sending it here instead:`
    );
  }
  return textChannel.send(message, options);
}
