import { GuardFunction } from 'discordx';

import GuardCache from '../../types/GuardCache';
import { CommandInteraction, GuildMember } from 'discord.js';

export const IsAdmin: GuardFunction<CommandInteraction, GuardCache> = async (
  interaction,
  client,
  next,
  { server }
) => {
  if (!interaction.guild || !(interaction.member instanceof GuildMember)) {
    return;
  }
  if (interaction.member.id === interaction.guild.ownerId) {
    await next();
    return;
  }

  const adminRole = server.config.adminRole;
  if (!adminRole || !interaction.member.roles.cache.has(adminRole)) {
    await interaction.reply(`You're not my Discord supervisor!`);
    return;
  }

  await next();
};
