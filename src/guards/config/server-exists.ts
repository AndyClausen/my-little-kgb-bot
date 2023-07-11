import { ArgsOf, GuardFunction, SimpleCommandMessage } from 'discordx';
import { BaseInteraction, Events, Message, VoiceState } from 'discord.js';

import ServerModel from '../../db/models/server';
import GuardCache from '../../types/GuardCache';

const ServerExists: GuardFunction<
  | ArgsOf<
      | Events.MessageCreate
      | Events.VoiceStateUpdate
      | Events.MessageReactionAdd
      | Events.MessageReactionRemove
    >
  | BaseInteraction
  | SimpleCommandMessage,
  GuardCache
> = async (arg, client, next, nextObj) => {
  const messageOrInteraction = arg instanceof Array ? arg[0] : arg;
  const guild =
    messageOrInteraction instanceof BaseInteraction ||
    messageOrInteraction instanceof Message ||
    messageOrInteraction instanceof VoiceState
      ? messageOrInteraction.guild
      : messageOrInteraction.message.guild;
  if (!guild) {
    return;
  }
  const server = await ServerModel.findById(guild.id);
  if (!server) {
    if (messageOrInteraction instanceof BaseInteraction && messageOrInteraction.isRepliable()) {
      await messageOrInteraction.reply(
        `I may not have been configured properly! Please re-add me to your server or contact Andy.`
      );
    }
    return;
  }
  nextObj.server = server;
  await next();
};

export default ServerExists;
