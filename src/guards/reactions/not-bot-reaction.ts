import { ArgsOf, GuardFunction } from '@typeit/discord';

export const NotBotReaction: GuardFunction<ArgsOf<'messageReactionAdd' | 'messageReactionRemove'>> =
  async ([, user], client, next) => {
    if (!user.bot) {
      await next();
    }
  };
