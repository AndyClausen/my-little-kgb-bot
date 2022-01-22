import { GuardFunction } from 'discordx';
import { CommandInteraction, GuildMember } from 'discord.js';

import GuardCache from '../../types/GuardCache';

export const IsMod: GuardFunction<CommandInteraction, GuardCache> = async (
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

  const { modRole, adminRole } = server.config;
  if (
    (!modRole || !message.member.roles.cache.has(modRole)) &&
    (!adminRole || !message.member.roles.cache.has(adminRole))
  ) {
    await message.reply(`You're not my Discord supervisor!`);
    return;
  }

  await next();
};
