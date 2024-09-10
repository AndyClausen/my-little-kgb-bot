import { ButtonComponent, Client, Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  BaseGuildTextChannel,
  BaseGuildVoiceChannel,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  Message,
  MessageActionRowComponentBuilder,
  Role,
  ThreadChannel,
} from 'discord.js';
import { DocumentType } from '@typegoose/typegoose';

import { Role as DBRole } from '../db/models/role';
import ServerExists from '../guards/config/server-exists';
import GuardCache from '../types/GuardCache';
import { Server } from '../db/models/server';

export const roleButtonPrefix = 'toggle-role-';
export const roleButtonRegex = new RegExp(`^${roleButtonPrefix}([0-9]+)$`);

@Discord()
@Guard(ServerExists)
@SlashGroup({
  name: 'roles',
  description: 'Get a role at the click of a button! How neat is that?',
})
@SlashGroup('roles')
export default abstract class Roles {
  @Slash({ name: 'register', description: 'Register a channel to post the roles message' })
  async register(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    server.rolesChannelId = interaction.channel.id;
    await server.save();
    await this.upsertRolesMessage(client, server);
    await interaction.reply({ content: 'Channel successfully registered!', ephemeral: true });
  }

  @Slash({ name: 'add', description: 'add a role' })
  async add(
    @SlashOption({
      name: 'role',
      type: ApplicationCommandOptionType.Role,
      description: 'Role to add',
    })
    role: Role,
    @SlashOption({
      name: 'emoji',
      type: ApplicationCommandOptionType.String,
      description: 'An emoji to display on the button',
    })
    emoji: string,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!interaction.guild.emojis.resolveIdentifier(emoji)) {
      await interaction.reply({ content: `Could not resolve emoji '${emoji}'`, ephemeral: true });
      return;
    }

    const dbRole: DBRole = {
      _id: role.id,
      emoji,
    };
    server.roles.push(dbRole);
    await server.save();
    await this.upsertRolesMessage(client, server);

    await interaction.reply('Role added!');
  }

  @Slash({ name: 'remove', description: 'remove a role' })
  async remove(
    @SlashOption({
      name: 'role',
      type: ApplicationCommandOptionType.Role,
      description: 'Role to remove',
    })
    role: Role,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const dbRole = server.roles.find((rr) => rr._id === role.id);
    if (!dbRole) {
      await interaction.reply({
        content: `Could not find role with id '${role.id}'`,
        ephemeral: true,
      });
      return;
    }

    server.roles.remove(dbRole);
    await server.save();
    await this.upsertRolesMessage(client, server);

    await interaction.reply('Role removed!');
  }

  @Slash({ name: 'list', description: 'list registered roles' })
  async list(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const rolesMapped = await Promise.all(
      server.roles.toObject<DBRole[]>().map(async (role) => ({
        ...role,
        name: (await interaction.guild.roles.fetch(role._id))?.name,
      }))
    );
    const msg = `Roles:\n\`\`\`\n${rolesMapped.reduce(
      (acc, role) => acc + `${role._id} | ${role.name ?? 'could not find role'} | ${role.emoji}\n`,
      ''
    )}\n\`\`\``;
    await interaction.reply({ content: msg, ephemeral: true });
  }

  @ButtonComponent({ id: roleButtonRegex })
  async toggleRole(interaction: ButtonInteraction, client: Client, { server }: GuardCache) {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.customId.match(roleButtonRegex)?.[1];
    if (!id) {
      await interaction.followUp(`Failed to get role ID in "${interaction.customId}"`);
      return;
    }
    const role = server.roles.find((role) => role._id === id);
    if (!role) {
      await interaction.followUp(`Could not resolve ID "${id}" to a role`);
      return;
    }
    const member = await interaction.guild.members.fetch(interaction.user);
    if (member.roles.cache.has(role._id)) {
      await member.roles.remove(role._id);
      await interaction.followUp(
        `Got rid of the "${(await interaction.guild.roles.fetch(role._id)).name}" role for you`
      );
    } else {
      await member.roles.add(role._id);
      await interaction.followUp(
        `Gave you the "${(await interaction.guild.roles.fetch(role._id)).name}" role`
      );
    }
  }

  async upsertRolesMessage(client: Client, server: DocumentType<Server>): Promise<void> {
    let rolesChannel: BaseGuildTextChannel | BaseGuildVoiceChannel | ThreadChannel;
    try {
      const channel = await client.channels.fetch(server.rolesChannelId);
      if (!channel || !channel.isTextBased() || channel.isDMBased()) {
        return;
      }
      rolesChannel = channel;
    } catch (e) {
      return;
    }

    const roleEmbed = new EmbedBuilder({
      title: 'Role Assignment',
      description: 'Click a button to receive or remove a role!',
    });

    const rolesMapped = await Promise.all(
      server.roles.toObject<DBRole[]>().map(async (role) => ({
        ...role,
        name: (await rolesChannel.guild.roles.fetch(role._id))?.name,
        emoji:
          role.emoji.length > 5
            ? rolesChannel.guild.emojis.resolveIdentifier(role.emoji)
            : role.emoji,
      }))
    );
    const roleButtons = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      rolesMapped
        .filter((roles) => roles.name)
        .map((role) =>
          new ButtonBuilder()
            .setEmoji(role.emoji)
            .setCustomId(roleButtonPrefix + role._id)
            .setStyle(ButtonStyle.Secondary)
            .setLabel(role.name)
        )
    );
    let roleMessage: Message;
    if (server.rolesMessageId) {
      try {
        roleMessage = await rolesChannel.messages.fetch(server.rolesMessageId);
      } catch {
        // ignore
      }
    }
    if (roleMessage) {
      await roleMessage.edit({ embeds: [roleEmbed], components: [roleButtons] });
    } else {
      roleMessage = await rolesChannel.send({ embeds: [roleEmbed], components: [roleButtons] });
      server.rolesMessageId = roleMessage.id;
      await server.save();
    }
  }
}
