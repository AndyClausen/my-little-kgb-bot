import { EmbedField, Message, EmbedBuilder, TextChannel } from 'discord.js';
import { Client } from 'discordx';
import { DocumentType } from '@typegoose/typegoose';

import { Server } from '../db/models/server';

export default async function upsertReactionMessage(
  client: Client,
  server: DocumentType<Server>
): Promise<void> {
  const { reactionRolesMessageId, reactionRoles, reactionRolesChannelId } = server;
  let roleChannel;
  try {
    roleChannel = (await client.channels.fetch(reactionRolesChannelId)) as TextChannel;
  } catch (e) {
    return;
  }
  if (!roleChannel) {
    return;
  }

  const roleEmbed = new EmbedBuilder({
    title: 'Role Assignment',
    description: 'React to this to receive a role!',
    fields: reactionRoles.map<EmbedField>((role) => ({
      name: role.emoji,
      value: role.name,
      inline: false,
    })),
  });

  let roleMessage: Message;
  if (reactionRolesMessageId) {
    roleMessage = await roleChannel.messages.fetch(reactionRolesMessageId);
    await roleMessage.edit({ embeds: [roleEmbed] });
  } else {
    roleMessage = await roleChannel.send({ embeds: [roleEmbed] });
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
