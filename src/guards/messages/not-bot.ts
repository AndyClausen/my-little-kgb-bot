import { ArgsOf, GuardFunction, SimpleCommandMessage } from 'discordx';
import {
  ButtonInteraction,
  CommandInteraction,
  ContextMenuCommandInteraction,
  Events,
  Message,
  SelectMenuInteraction,
  VoiceState,
} from 'discord.js';

// Example by @AndyClausen
// Modified @oceanroleplay

export const NotBot: GuardFunction<
  | ArgsOf<
      | Events.MessageCreate
      | Events.MessageReactionAdd
      | Events.MessageReactionRemove
      | Events.VoiceStateUpdate
    >
  | CommandInteraction
  | ContextMenuCommandInteraction
  | SelectMenuInteraction
  | ButtonInteraction
  | SimpleCommandMessage
> = async (arg, client, next) => {
  const argObj = arg instanceof Array ? arg[1] : arg;
  const user =
    argObj instanceof CommandInteraction
      ? argObj.user
      : argObj instanceof Message
      ? argObj.author
      : argObj instanceof SimpleCommandMessage
      ? argObj.message?.author
      : argObj instanceof CommandInteraction ||
        argObj instanceof ContextMenuCommandInteraction ||
        argObj instanceof SelectMenuInteraction ||
        argObj instanceof ButtonInteraction ||
        argObj instanceof VoiceState
      ? argObj.member?.user
      : argObj;
  if (!user?.bot) {
    await next();
  }
};
