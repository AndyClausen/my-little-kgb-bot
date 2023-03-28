import { ArgsOf, GuardFunction } from 'discordx';
import { Events } from 'discord.js';

import GuardCache from '../../types/GuardCache';

const IsReactionRoleMessage: GuardFunction<
  ArgsOf<Events.MessageReactionAdd | Events.MessageReactionRemove>,
  GuardCache
> = async ([reaction], client, next, { server }) => {
  if (reaction.message.id === server.reactionRolesMessageId) {
    await next();
  }
};

export default IsReactionRoleMessage;
