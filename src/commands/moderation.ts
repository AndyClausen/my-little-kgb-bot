import { Client, ContextMenu, Discord, Guard, SlashOption, Slash } from 'discordx';
import {
  CommandInteraction,
  GuildMember,
  MessageContextMenuInteraction,
  StageChannel,
  User,
  UserContextMenuInteraction,
  VoiceChannel,
} from 'discord.js';

import { IsAdmin } from '../guards/commands/is-admin';
import ServerExists from '../guards/config/server-exists';
import GuardCache from '../types/GuardCache';
import { IsMod } from '../guards/commands/is-mod';
import { gulag, ungulag } from '../helpers/gulag-helpers';

@Discord()
@Guard(ServerExists, IsMod)
export default abstract class Moderation {
  @Guard(IsAdmin)
  @Slash('move', { description: 'Move all users from one voice channel to another' })
  async bulkMove(
    @SlashOption('to', {
      type: 'CHANNEL',
      description: 'Channel to move to',
      channelTypes: ['GUILD_VOICE', 'GUILD_STAGE_VOICE'],
    })
    channelTo: VoiceChannel | StageChannel,
    @SlashOption('from', {
      type: 'CHANNEL',
      description: 'Channel to move from',
      channelTypes: ['GUILD_VOICE', 'GUILD_STAGE_VOICE'],
      required: false,
    })
    channelFrom: VoiceChannel | StageChannel,
    interaction: CommandInteraction
  ): Promise<void> {
    if (!(interaction.member instanceof GuildMember)) {
      return;
    }
    if (!channelFrom) {
      channelFrom = interaction.member.voice.channel;
      if (!channelFrom) {
        await interaction.reply(
          `You must be in a voice channel to call this command with only one parameter`
        );
        return;
      }
    }

    const channelSize = channelFrom.members.size;
    try {
      channelFrom.members.mapValues((member) => {
        if (channelTo.permissionsFor(member).missing('CONNECT').length) {
          const err = new Error(member.id);
          err.name = 'missingConnectPerm';
          throw err;
        }
      });
      await Promise.all(
        channelFrom.members.mapValues((member) => {
          return member.voice.setChannel(channelTo);
        })
      );
    } catch (e) {
      if (!(e instanceof Error)) {
        throw e;
      }
      if (e.name === 'missingConnectPerm') {
        await interaction.reply({
          content: `Member <@${e.message}> does not have permission to connect to ${channelTo.name}`,
          ephemeral: true,
        });
        return;
      }
      await interaction.reply({ content: `${e.name}: ${e.message}`, ephemeral: true });
      return;
    }
    await interaction.reply({
      content: `Done! Moved ${channelSize} user${channelSize > 1 ? 's' : ''}.`,
      ephemeral: true,
    });
  }

  @ContextMenu('MESSAGE', 'gulag author')
  async gulagAuthor(
    interaction: MessageContextMenuInteraction,
    client: Client,
    { server }: GuardCache
  ) {
    await gulag(interaction.targetMessage.author.id, server, interaction);
  }

  @ContextMenu('MESSAGE', 'ungulag author')
  async ungulagAuthor(
    interaction: MessageContextMenuInteraction,
    client: Client,
    { server }: GuardCache
  ) {
    await ungulag(interaction.targetMessage.author.id, server, interaction);
  }

  @ContextMenu('USER', 'gulag')
  async gulagContext(
    interaction: UserContextMenuInteraction,
    client: Client,
    { server }: GuardCache
  ) {
    await gulag(interaction.targetUser, server, interaction);
  }

  @ContextMenu('USER', 'ungulag')
  async ungulagContext(
    interaction: UserContextMenuInteraction,
    client: Client,
    { server }: GuardCache
  ) {
    await ungulag(interaction.targetUser, server, interaction);
  }

  @Guard(IsAdmin)
  @Slash('gulag')
  async gulagCommand(
    @SlashOption('user', {
      type: 'USER',
      description: 'User to gulag',
    })
    user: User,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    await gulag(user, server, interaction);
  }

  @Slash('ungulag')
  async ungulag(
    @SlashOption('user', {
      type: 'USER',
      description: 'User to gulag',
    })
    user: User,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    await ungulag(user, server, interaction);
  }

  @Guard(IsAdmin)
  @Slash('purge', { description: 'Purge a bunch of messages that are totally not poggers' })
  async purge(
    @SlashOption('amount', {
      type: 'NUMBER',
      description: 'Amount of messages to delete',
      minValue: 1,
    })
    amount: number,
    interaction: CommandInteraction
  ): Promise<void> {
    if (!interaction.channel.isText()) {
      return;
    }
    if (interaction.channel.type === 'DM') {
      await interaction.reply({
        content: `I can't purge messages in a dm, baka!`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply('Cleaning up...');
    const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
    await interaction.channel.bulkDelete(
      messages.filter((msg) => msg.interaction?.id !== interaction.id)
    );
    await interaction.deleteReply();
  }
}
