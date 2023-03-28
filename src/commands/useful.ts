import { Client, Discord, Guard, Slash } from 'discordx';
import { CommandInteraction, EmbedBuilder } from 'discord.js';

import IsMember from '../guards/commands/is-member';
import ServerExists from '../guards/config/server-exists';
import sendSystemMessage from '../helpers/send-system-message';
import GuardCache from '../types/GuardCache';

@Discord()
export default class Useful {
  @Slash({
    name: 'invite',
    description: 'Create a temporary, single-use invite - usage of this command is logged',
  })
  @Guard(ServerExists, IsMember)
  async createInvite(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (
      !interaction.channel.isTextBased() ||
      interaction.channel.isThread() ||
      interaction.channel.isDMBased()
    ) {
      return;
    }

    await sendSystemMessage(
      interaction.guild,
      {
        embeds: [
          new EmbedBuilder({
            description: `An invite link has been created by ${interaction.member}`,
            author: {
              name: interaction.user.tag,
              iconURL: interaction.user.avatarURL(),
            },
          }),
        ],
      },
      server
    );

    const invite = await interaction.channel.createInvite({
      maxUses: 1,
      maxAge: 3600,
      reason: interaction.user.tag,
    });
    await interaction.reply({ content: invite.url, ephemeral: true });
  }
}
