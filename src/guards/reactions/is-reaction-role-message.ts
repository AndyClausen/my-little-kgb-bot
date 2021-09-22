import { ArgsOf, GuardFunction } from 'discordx';

import GuardCache from '../../types/GuardCache';

const IsReactionRoleMessage: GuardFunction<
  ArgsOf<'messageReactionAdd' | 'messageReactionRemove'>,
  GuardCache
> = async ([reaction], client, next, { server }) => {
  if (reaction.message.id === server.reactionRolesMessageId) {
    await next();
  }
};

export default IsReactionRoleMessage;
