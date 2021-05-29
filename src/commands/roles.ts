import { Client, Discord, Group, Guard, Option, OptionType, Slash } from '@typeit/discord';

import { ReactionRole } from '../db/models/reaction-role';
import ServerExists from '../guards/config/server-exists';
import IsConfigEnabled from '../guards/config/is-config-enabled';
import GuardCache from '../types/GuardCache';
import upsertReactionMessage from '../helpers/upsert-reaction-message';
import { CommandInteraction } from 'discord.js';

@Discord()
@Guard(ServerExists, IsConfigEnabled('reactionRoles'))
@Group('roles', 'Like normal roles, but, like, automated', {
  reaction: 'React to a message to get a role! How neat is that?',
  voicechat: 'Roles that are given to users when they join a specific voice channel',
})
export default abstract class Roles {
  @Slash('register', { description: 'Register a channel to post the reaction roles message' })
  async register(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    server.reactionRolesChannelId = interaction.channel.id;
    await server.save();
    await upsertReactionMessage(client, server);
    await interaction.reply('Channel successfully registered!', { ephemeral: true });
  }

  @Slash('add')
  @Group('reaction')
  async add(
    @Option('role', OptionType.ROLE, { description: 'Role to add' })
    roleId: string,
    @Option('name', { description: 'The name of the role' })
    name: string,
    @Option('emoji', { description: 'An emoji to use as reaction' })
    emoji: string,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!interaction.guild.emojis.resolveIdentifier(emoji)) {
      await interaction.reply(`Could not resolve emoji '${emoji}'`, { ephemeral: true });
      return;
    }

    const reactionRole: ReactionRole = {
      _id: roleId,
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
  @Group('reaction')
  async remove(
    @Option('role', OptionType.ROLE, { description: 'Role to remove' })
    roleId: string,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const role = server.reactionRoles.find((rr) => rr._id === roleId);
    if (!role) {
      await interaction.reply(`Could not find role with id '${roleId}'`, { ephemeral: true });
      return;
    }

    server.reactionRoles.remove(role);
    await server.save();
    await upsertReactionMessage(client, server);

    await interaction.reply(
      server.config.reactionRoles
        ? 'Role removed!'
        : 'Role was removed, but reaction roles are turned off'
    );
  }

  @Slash('list')
  @Group('reaction')
  async list(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    let msg = 'Roles: \n```\n';
    server.reactionRoles.forEach((role) => (msg += `${role._id} | ${role.name} | ${role.emoji}\n`));
    msg += '```';
    await interaction.reply(msg, { ephemeral: true });
  }

  @Slash('add')
  @Group('voicechat')
  @Guard(ServerExists)
  async addVoiceChatRole(
    @Option('role', OptionType.ROLE, { required: true })
    roleId: string,
    @Option('channel', OptionType.CHANNEL, { required: true })
    channelId: string,
    command: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!command.guild.roles.cache.has(roleId)) {
      await command.reply(`Could not find role with id '${roleId}'`, { ephemeral: true });
      return;
    }
    if (!command.guild.channels.cache.has(channelId)) {
      await command.reply(`Could not find channel with id '${channelId}'`, { ephemeral: true });
      return;
    }
    if (server.voiceChatRoles.find((r) => r.roleId === roleId && r.channelId === channelId)) {
      await command.reply('That voice chat role already exists!', { ephemeral: true });
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
  @Group('voicechat')
  @Guard(ServerExists)
  async removeVoiceChatRole(
    @Option('role', OptionType.ROLE, { required: true })
    roleId: string,
    @Option('channel', OptionType.CHANNEL, { required: true })
    channelId: string,
    command: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!command.guild.roles.cache.has(roleId)) {
      await command.reply(`Could not find role with id '${roleId}'`, { ephemeral: true });
      return;
    }
    if (!command.guild.channels.cache.has(channelId)) {
      await command.reply(`Could not find channel with id '${channelId}'`, { ephemeral: true });
      return;
    }
    const voiceChatRole = server.voiceChatRoles.find(
      (r) => r.roleId === roleId && r.channelId === channelId
    );
    if (!voiceChatRole) {
      await command.reply('Could not find that voicechat role...', { ephemeral: true });
      return;
    }

    server.voiceChatRoles.remove(voiceChatRole);
    await server.save();
    await command.reply('Voice chat role has been removed');
  }

  @Slash('list')
  @Group('voicechat')
  @Guard(ServerExists)
  async listVoiceChatRole(
    command: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    let msg = '```\n';
    server.voiceChatRoles.forEach((r) => (msg += `Role: ${r.roleId}, Channel: ${r.channelId}\n`));
    msg += '```';
    await command.reply(msg, { ephemeral: true });
  }
}
