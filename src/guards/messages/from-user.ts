import { GuardFunction } from '@typeit/discord';

export function FromUser(userId: string): GuardFunction<"message"> {
  return async (
    [message],
    client,
    next
  ) => {
    if (message.author.id === userId) {
      await next();
    }
  }
}
