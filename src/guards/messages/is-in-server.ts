import { GuardFunction } from '@typeit/discord';

export function IsInServer(serverId: string): GuardFunction<'message'> {
  return async (
    [message],
    client,
    next
  ) => {
    if (message.guild && message.guild.id === serverId) {
      await next();
    }
  }
}
