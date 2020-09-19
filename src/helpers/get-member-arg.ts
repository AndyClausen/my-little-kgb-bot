import { CommandMessage } from '@typeit/discord';
import { GuildMember } from 'discord.js';

export async function getMemberArg(command: CommandMessage): Promise<GuildMember | undefined> {
  let member = command.mentions.members.first();
  if (!member) {
    if (!command.args.user) {
      return;
    }
    try {
      member = await command.guild.members.fetch(command.args.user);
    } catch (e) {
      return;
    }
  }
  return member;
}
