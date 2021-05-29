import { ArgsOf, GuardFunction } from '@typeit/discord';

import GuardCache from '../../types/GuardCache';
import { CommandInteraction, GuildMember } from 'discord.js';

const IsMember: GuardFunction<ArgsOf<'message'> | CommandInteraction, GuardCache> = async (
  arg,
  client,
  next,
  { server }
) => {
  const messageOrInteraction = arg instanceof CommandInteraction ? arg : arg[0];
  if (!(messageOrInteraction.member instanceof GuildMember)) {
    return;
  }
  if (messageOrInteraction.member.id === messageOrInteraction.guild.ownerID) {
    await next();
    return;
  }
  const { memberRole } = server.config;
  if (!memberRole) {
    await messageOrInteraction.reply('The member role has not been set yet! Please check config.');
    return;
  }
  if (!messageOrInteraction.member.roles.cache.has(memberRole)) {
    await messageOrInteraction.reply(`You're not my Discord supervisor!`);
    return;
  }
  await next();
};

export default IsMember;
