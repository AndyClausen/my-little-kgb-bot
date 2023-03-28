import { ArgsOf, GuardFunction } from 'discordx';
import { CommandInteraction, Events } from 'discord.js';

export function FromUser(
  userId: string
): GuardFunction<ArgsOf<Events.MessageCreate> | CommandInteraction> {
  return async (arg, client, next) => {
    const user = arg instanceof CommandInteraction ? arg.user : arg[0].author;
    if (user.id === userId) {
      await next();
    }
  };
}
