import { Client, Discord, SlashGroup, Guard, SlashOption, Slash } from 'discordx';
import { CommandInteraction, Role } from 'discord.js';

import { ReactionRole } from '../db/models/reaction-role';
import ServerExists from '../guards/config/server-exists';
import IsConfigEnabled from '../guards/config/is-config-enabled';
import GuardCache from '../types/GuardCache';
import upsertReactionMessage from '../helpers/upsert-reaction-message';

@Discord()
@Guard(ServerExists, IsConfigEnabled('reactionRoles'))
@SlashGroup('roles', 'Like normal roles, but, like, automated', {
  reaction: 'React to a message to get a role! How neat is that?',
  voicechat: 'Roles that are given to users when they join a specific voice channel',
})
export default abstract class Roles {
  @Slash('register', { description: 'Register a channel to post the reaction roles message' })
  @SlashGroup('reaction')
  async register(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    server.reactionRolesChannelId = interaction.channel.id;
    await server.save();
    await upsertReactionMessage(client, server);
    await interaction.reply({ content: 'Channel successfully registered!', ephemeral: true });
  }

  @Slash('add')
  @SlashGroup('reaction')
  async add(
    @SlashOption('role', { type: 'ROLE', description: 'Role to add' })
    role: Role,
    @SlashOption('name', { description: 'The name of the role' })
    name: string,
    @SlashOption('emoji', { description: 'An emoji to use as reaction' })
    emoji: string,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!interaction.guild.emojis.resolveIdentifier(emoji)) {
      await interaction.reply({ content: `Could not resolve emoji '${emoji}'`, ephemeral: true });
      return;
    }

    const reactionRole: ReactionRole = {
      _id: role.id,
      name,
      emoji,
    };
    server.reactionRoles.push(reactionRole);
    await server.save();
    await upsertReactionMessage(client, server);

    await interaction.reply(
      server.config.reactionRoles
        ? 'Role added!'
        : 'Role was added, but reaction roles are turned off'
    );
  }

  @Slash('remove')
  @SlashGroup('reaction')
  async remove(
    @SlashOption('role', { type: 'ROLE', description: 'Role to remove' })
    role: Role,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const reactionRole = server.reactionRoles.find((rr) => rr._id === role.id);
    if (!reactionRole) {
      await interaction.reply({
        content: `Could not find reaction role with id '${role.id}'`,
        ephemeral: true,
      });
      return;
    }

    server.reactionRoles.remove(reactionRole);
    await server.save();
    await upsertReactionMessage(client, server);

    await interaction.reply(
      server.config.reactionRoles
        ? 'Role removed!'
        : 'Role was removed, but reaction roles are turned off'
    );
  }

  @Slash('list')
  @SlashGroup('reaction')
  async list(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    let msg = 'Roles: \n```\n';
    server.reactionRoles.forEach((role) => (msg += `${role._id} | ${role.name} | ${role.emoji}\n`));
    msg += '```';
    await interaction.reply({ content: msg, ephemeral: true });
  }

  @Slash('add')
  @SlashGroup('voicechat')
  @Guard(ServerExists)
  async addVoiceChatRole(
    @SlashOption('role', { type: 'ROLE' })
    roleId: string,
    @SlashOption('channel', { type: 'ROLE' })
    channelId: string,
    command: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!command.guild.roles.cache.has(roleId)) {
      await command.reply({ content: `Could not find role with id '${roleId}'`, ephemeral: true });
      return;
    }
    if (!command.guild.channels.cache.has(channelId)) {
      await command.reply({
        content: `Could not find channel with id '${channelId}'`,
        ephemeral: true,
      });
      return;
    }
    const channelType = command.guild.channels.cache.get(channelId).type;
    if (!['voice', 'category'].includes(channelType)) {
      await command.reply({
        content: `Channel is of type '${channelType}' - it must be either voice or category`,
        ephemeral: true,
      });
      return;
    }
    if (server.voiceChatRoles.find((r) => r.roleId === roleId && r.channelId === channelId)) {
      await command.reply({ content: 'That voice chat role already exists!', ephemeral: true });
      return;
    }

    server.voiceChatRoles.push({
      roleId,
      channelId,
    });
    await server.save();
    await command.reply('Voice chat role has been added');
  }

  @Slash('remove')
  @SlashGroup('voicechat')
  @Guard(ServerExists)
  async removeVoiceChatRole(
    @SlashOption('role', { type: 'ROLE' })
    roleId: string,
    @SlashOption('channel', { type: 'CHANNEL' })
    channelId: string,
    command: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!command.guild.roles.cache.has(roleId)) {
      await command.reply({ content: `Could not find role with id '${roleId}'`, ephemeral: true });
      return;
    }
    if (!command.guild.channels.cache.has(channelId)) {
      await command.reply({
        content: `Could not find channel with id '${channelId}'`,
        ephemeral: true,
      });
      return;
    }
    const voiceChatRole = server.voiceChatRoles.find(
      (r) => r.roleId === roleId && r.channelId === channelId
    );
    if (!voiceChatRole) {
      await command.reply({ content: 'Could not find that voicechat role...', ephemeral: true });
      return;
    }

    server.voiceChatRoles.remove(voiceChatRole);
    await server.save();
    await command.reply('Voice chat role has been removed');
  }

  @Slash('list')
  @SlashGroup('voicechat')
  @Guard(ServerExists)
  async listVoiceChatRole(
    command: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    let msg = '```\n';
    server.voiceChatRoles.forEach((r) => (msg += `Role: ${r.roleId}, Channel: ${r.channelId}\n`));
    msg += '```';
    await command.reply({ content: msg, ephemeral: true });
  }
}
