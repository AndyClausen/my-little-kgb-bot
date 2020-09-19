import { Client, Command, CommandMessage, Guard } from '@typeit/discord';
import { MessageEmbed } from 'discord.js';

import IsMember from '../guards/commands/is-member';
import isTextChannel from '../helpers/is-text-channel';
import ServerExists from '../guards/config/server-exists';
import sendSystemMessage from '../helpers/send-system-message';
import GuardCache from '../types/GuardCache';

export default class Useful {
  @Command('invite')
  @Guard(ServerExists, IsMember)
  async createInvite(
    command: CommandMessage,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!isTextChannel(command.channel)) {
      return;
    }

    await sendSystemMessage(
      command.guild,
      {
        message: {
          embed: new MessageEmbed({
            description: `An invite link has been created by ${command.member.displayName}`,
            author: {
              name: command.author.tag,
              iconURL: command.author.avatarURL({ dynamic: true }),
            },
          }),
        },
      },
      server
    );

    const invite = await command.channel.createInvite({
      maxUses: 1,
      maxAge: 3600,
      reason: command.author.username,
    });

    const dmChannel = await command.author.createDM();
    await dmChannel.send(invite.url);
  }
}
