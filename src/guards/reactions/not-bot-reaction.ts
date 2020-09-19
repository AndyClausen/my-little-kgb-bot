import { GuardFunction } from '@typeit/discord';

export const NotBotReaction:
  | GuardFunction<'messageReactionAdd'>
  | GuardFunction<'messageReactionRemove'> = async ([, user], client, next) => {
  if (!user.bot) {
    await next();
  }
};
