import { ArgsOf, GuardFunction } from 'discordx';
import { CommandInteraction, Events } from 'discord.js';

export const IsDMChannel: GuardFunction<ArgsOf<Events.MessageCreate> | CommandInteraction> = async (
  arg,
  client,
  next
) => {
  const messageOrInteraction = arg instanceof CommandInteraction ? arg : arg[0];
  const user =
    messageOrInteraction instanceof CommandInteraction
      ? messageOrInteraction.user
      : messageOrInteraction.author;
  if (!messageOrInteraction.guild && !user.bot) {
    await next();
  }
};
