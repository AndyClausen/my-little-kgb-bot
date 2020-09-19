import { GuardFunction } from '@typeit/discord';

import GuardCache from '../../types/GuardCache';

const IsMember: GuardFunction<'commandMessage', GuardCache> = async (
  [command],
  client,
  next,
  { server }
) => {
  if (command.author.id === command.guild.ownerID) {
    await next();
    return;
  }
  const { memberRole } = server.config;
  if (!memberRole) {
    await command.reply('The member role has not been set yet! Please check config.');
    return;
  }
  if (!command.member.roles.cache.has(memberRole)) {
    await command.channel.send(`You're not my Discord supervisor!`);
    return;
  }
  await next();
};

export default IsMember;
