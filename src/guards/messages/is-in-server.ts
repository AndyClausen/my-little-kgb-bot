import { ArgsOf, GuardFunction } from 'discordx';
import { CommandInteraction, Events } from 'discord.js';

export function IsInServer(
  serverId: string
): GuardFunction<ArgsOf<Events.MessageCreate> | CommandInteraction> {
  return async (arg, client, next) => {
    const messageOrInteraction = arg instanceof CommandInteraction ? arg : arg[0];
    if (messageOrInteraction.guild?.id === serverId) {
      await next();
    }
  };
}
