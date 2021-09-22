import { ArgsOf, GuardFunction } from 'discordx';

export const NotBotReaction: GuardFunction<ArgsOf<'messageReactionAdd' | 'messageReactionRemove'>> =
  async ([, user], client, next) => {
    if (!user.bot) {
      await next();
    }
  };
