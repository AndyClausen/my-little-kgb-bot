import { GuardFunction } from '@typeit/discord';

export function IsInChannel(channelId: string): GuardFunction<'message'> {
  return async (
    [message],
    client,
    next
  ) => {
    if (message.channel.id === channelId) {
      await next();
    }
  }
}
