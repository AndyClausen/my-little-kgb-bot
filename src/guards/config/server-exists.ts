import { GuardFunction } from '@typeit/discord';

import ServerModel from '../../db/models/server';
import sendSystemMessage from '../../helpers/send-system-message';
import GuardCache from '../../types/GuardCache';
import isMessageReaction from '../../helpers/is-message-reaction';

const ServerExists: GuardFunction<
  'message' | 'voiceStateUpdate' | 'messageReactionAdd' | 'messageReactionRemove',
  GuardCache
> = async ([message], client, next, nextObj) => {
  const guild = isMessageReaction(message) ? message.message.guild : message.guild;
  if (!guild) {
    return;
  }
  const server = await ServerModel.findById(guild.id);
  if (!server) {
    await sendSystemMessage(guild, {
      message: `I may not have been configured properly! Please re-add me to your server or contact Andy.`,
    });
    return;
  }
  nextObj.server = server;
  await next();
};

export default ServerExists;
