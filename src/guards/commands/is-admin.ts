import { GuardFunction } from 'discordx';
import { CommandInteraction, GuildMember } from 'discord.js';

import GuardCache from '../../types/GuardCache';

export const IsAdmin: GuardFunction<CommandInteraction, GuardCache> = async (
  message,
  client,
  next,
  { server }
) => {
  if (!message.guild || !(message.member instanceof GuildMember)) {
    return;
  }
  if (message.member.id === message.guild.ownerId) {
    await next();
    return;
  }

  const { adminRole } = server.config;
  if (!adminRole || !message.member.roles.cache.has(adminRole)) {
    await message.reply(`You're not my Discord supervisor!`);
    return;
  }

  await next();
};
