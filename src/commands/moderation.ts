import { Client, ContextMenu, Discord, Guard, SlashOption, Slash } from 'discordx';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  CommandInteraction,
  GuildMember,
  MessageContextMenuCommandInteraction,
  PermissionsBitField,
  StageChannel,
  User,
  UserContextMenuCommandInteraction,
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
  @Slash({ name: 'move', description: 'Move all users from one voice channel to another' })
  async bulkMove(
    @SlashOption({
      name: 'to',
      type: ApplicationCommandOptionType.Channel,
      description: 'Channel to move to',
      channelTypes: [ChannelType.GuildVoice, ChannelType.GuildStageVoice],
    })
    channelTo: VoiceChannel | StageChannel,
    @SlashOption({
      name: 'from',
      type: ApplicationCommandOptionType.Channel,
      description: 'Channel to move from',
      channelTypes: [ChannelType.GuildVoice, ChannelType.GuildStageVoice],
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
        if (channelTo.permissionsFor(member).missing(PermissionsBitField.Flags.Connect).length) {
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

  @ContextMenu({ name: 'gulag author', type: ApplicationCommandType.Message })
  async gulagAuthor(
    interaction: MessageContextMenuCommandInteraction,
    client: Client,
    { server }: GuardCache
  ) {
    await gulag(interaction.targetMessage.author.id, server, interaction);
  }

  @ContextMenu({ name: 'ungulag author', type: ApplicationCommandType.Message })
  async ungulagAuthor(
    interaction: MessageContextMenuCommandInteraction,
    client: Client,
    { server }: GuardCache
  ) {
    await ungulag(interaction.targetMessage.author.id, server, interaction);
  }

  @ContextMenu({ name: 'gulag', type: ApplicationCommandType.User })
  async gulagContext(
    interaction: UserContextMenuCommandInteraction,
    client: Client,
    { server }: GuardCache
  ) {
    await gulag(interaction.targetUser, server, interaction);
  }

  @ContextMenu({ name: 'ungulag', type: ApplicationCommandType.User })
  async ungulagContext(
    interaction: UserContextMenuCommandInteraction,
    client: Client,
    { server }: GuardCache
  ) {
    await ungulag(interaction.targetUser, server, interaction);
  }

  @Guard(IsAdmin)
  @Slash({
    name: 'gulag',
    description: 'Strip a traitor of their status and send them to the gulag',
  })
  async gulagCommand(
    @SlashOption({
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'User to gulag',
    })
    user: User,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    await gulag(user, server, interaction);
  }

  @Slash({ name: 'ungulag', description: 'Fetch a comrade from the gulag and return their status' })
  async ungulag(
    @SlashOption({
      name: 'user',
      type: ApplicationCommandOptionType.User,
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
  @Slash({ name: 'purge', description: 'Purge a bunch of messages that are totally not poggers' })
  async purge(
    @SlashOption({
      name: 'amount',
      type: ApplicationCommandOptionType.Number,
      description: 'Amount of messages to delete',
      minValue: 1,
      required: true,
    })
    amount: number,
    interaction: CommandInteraction
  ): Promise<void> {
    if (!interaction.channel.isTextBased()) {
      return;
    }
    if (interaction.channel.isDMBased()) {
      await interaction.reply({
        content: `I can't purge messages in a dm, baka!`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply('Cleaning up...');
    const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
    await interaction.channel.bulkDelete(
      messages.filter((msg) => msg.interaction?.id !== interaction.id && !msg.pinned)
    );
    await interaction.deleteReply();
  }
}
