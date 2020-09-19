import { EmbedFieldData, Message, MessageEmbed, TextChannel } from 'discord.js';
import { Client } from '@typeit/discord';
import { DocumentType } from '@typegoose/typegoose';

import { Server } from '../db/models/server';

export default async function upsertReactionMessage(
  client: Client,
  server: DocumentType<Server>
): Promise<void> {
  const { reactionRolesMessageId, reactionRoles, reactionRolesChannelId } = server;
  const roleChannel = (await client.channels.fetch(reactionRolesChannelId)) as TextChannel;

  const roleEmbed = new MessageEmbed({
    title: 'Role Assignment',
    description: 'React to this to receive a role!',
    fields: reactionRoles.map<EmbedFieldData>((role) => ({
      name: role.emoji,
      value: role.name,
    })),
  });

  let roleMessage: Message;
  if (reactionRolesMessageId) {
    roleMessage = await roleChannel.messages.fetch(reactionRolesMessageId);
    await roleMessage.edit({ embed: roleEmbed });
  } else {
    roleMessage = await roleChannel.send({ embed: roleEmbed });
    server.reactionRolesMessageId = roleMessage.id;
    await server.save();
  }
  await Promise.all(
    reactionRoles
      .map((role) => role.emoji)
      .map((s) => s.replace('>', ''))
      .map((reaction) => roleMessage.react(reaction))
  );
}
