import { ArgsOf, GuardFunction } from '@typeit/discord';
import { CommandInteraction } from 'discord.js';

export function FromUser(userId: string): GuardFunction<ArgsOf<'message'> | CommandInteraction> {
  return async (arg, client, next) => {
    const user = arg instanceof CommandInteraction ? arg.user : arg[0].author;
    if (user.id === userId) {
      await next();
    }
  };
}
