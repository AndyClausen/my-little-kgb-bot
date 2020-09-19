import { GuardFunction } from '@typeit/discord';

import GuardCache from '../../types/GuardCache';

export const IsAdmin: GuardFunction<'commandMessage', GuardCache> = async (
  [command],
  client,
  next,
  { server }
) => {
  if (command.author.id === command.guild.ownerID) {
    await next();
    return;
  }
  const adminRole = server.config.adminRole;
  if (!adminRole) {
    await command.reply('The admin role has not been set yet! Please check config.');
    return;
  }
  if (!command.member.roles.cache.has(adminRole)) {
    await command.channel.send(`You're not my Discord supervisor!`);
    return;
  }
  await next();
};
