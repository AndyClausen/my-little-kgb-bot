import { Client, Discord, SlashGroup, Guard, SlashOption, Slash } from 'discordx';
import { CategoryChannel, CommandInteraction, Role, StageChannel, VoiceChannel } from 'discord.js';

import { ReactionRole } from '../db/models/reaction-role';
import ServerExists from '../guards/config/server-exists';
import GuardCache from '../types/GuardCache';
import upsertReactionMessage from '../helpers/upsert-reaction-message';

@Discord()
@Guard(ServerExists)
@SlashGroup({
  name: 'roles',
  description: 'Like normal roles, but, like, automated',
})
@SlashGroup({
  name: 'reaction',
  description: 'React to a message to get a role! How neat is that?',
  root: 'roles',
})
@SlashGroup({
  name: 'voicechat',
  description: 'Roles that are given to users when they join a specific voice channel',
  root: 'roles',
})
@SlashGroup('reaction', 'roles')
export abstract class ReactionRoles {
  @Slash('register', { description: 'Register a channel to post the reaction roles message' })
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

    await interaction.reply('Role added!');
  }

  @Slash('remove')
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

    await interaction.reply('Role removed!');
  }

  @Slash('list')
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
}

@Discord()
@Guard(ServerExists)
@SlashGroup('voicechat', 'roles')
export abstract class VoiceChatRoles {
  @Slash('add')
  @Guard(ServerExists)
  async addVoiceChatRole(
    @SlashOption('role', { type: 'ROLE' })
    role: Role,
    @SlashOption('channel', {
      type: 'CHANNEL',
      channelTypes: ['GUILD_VOICE', 'GUILD_STAGE_VOICE', 'GUILD_CATEGORY'],
    })
    channel: VoiceChannel | StageChannel | CategoryChannel,
    command: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (server.voiceChatRoles.find((r) => r.roleId === role.id && r.channelId === channel.id)) {
      await command.reply({ content: 'That voice chat role already exists!', ephemeral: true });
      return;
    }

    server.voiceChatRoles.push({
      roleId: role.id,
      channelId: channel.id,
    });
    await server.save();
    await command.reply('Voice chat role has been added');
  }

  @Slash('remove')
  @Guard(ServerExists)
  async removeVoiceChatRole(
    @SlashOption('role', { type: 'ROLE' })
    role: Role,
    @SlashOption('channel', {
      type: 'CHANNEL',
      channelTypes: ['GUILD_VOICE', 'GUILD_STAGE_VOICE', 'GUILD_CATEGORY'],
    })
    channel: VoiceChannel | StageChannel | CategoryChannel,
    command: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const voiceChatRole = server.voiceChatRoles.find(
      (r) => r.roleId === role.id && r.channelId === channel.id
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
