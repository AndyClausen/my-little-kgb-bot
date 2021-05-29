import { Client, Discord, Guard, Slash } from '@typeit/discord';
import { CommandInteraction, MessageEmbed } from 'discord.js';

import IsMember from '../guards/commands/is-member';
import ServerExists from '../guards/config/server-exists';
import sendSystemMessage from '../helpers/send-system-message';
import GuardCache from '../types/GuardCache';

@Discord()
export default class Useful {
  @Slash('invite')
  @Guard(ServerExists, IsMember)
  async createInvite(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!interaction.channel.isText() || interaction.channel.type === 'dm') {
      return;
    }

    await sendSystemMessage(
      interaction.guild,
      {
        message: {
          embed: new MessageEmbed({
            description: `An invite link has been created by ${interaction.member}`,
            author: {
              name: interaction.user.tag,
              iconURL: interaction.user.avatarURL({ dynamic: true }),
            },
          }),
        },
      },
      server
    );

    const invite = await interaction.channel.createInvite({
      maxUses: 1,
      maxAge: 3600,
      reason: interaction.user.tag,
    });

    const dmChannel = await interaction.user.createDM();
    await dmChannel.send(invite.url);
    await interaction.reply('Sent you an invite in dm uwu', { ephemeral: true });
  }
}
