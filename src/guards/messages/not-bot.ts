import { ArgsOf, GuardFunction, SimpleCommandMessage } from 'discordx';
import { BaseInteraction, Events, Message, VoiceState } from 'discord.js';

export const NotBot: GuardFunction<
  | ArgsOf<
      | Events.MessageCreate
      | Events.MessageReactionAdd
      | Events.MessageReactionRemove
      | Events.VoiceStateUpdate
    >
  | BaseInteraction
  | SimpleCommandMessage
> = async (arg, client, next) => {
  const argObj = arg instanceof Array ? arg[1] : arg;
  const user =
    argObj instanceof BaseInteraction
      ? argObj.user
      : argObj instanceof Message
      ? argObj.author
      : argObj instanceof SimpleCommandMessage
      ? argObj.message?.author
      : argObj instanceof VoiceState
      ? argObj.member?.user
      : argObj;
  if (!user?.bot) {
    await next();
  }
};
