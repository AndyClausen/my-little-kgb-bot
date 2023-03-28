import { ArgsOf, Client, Discord, Guard, On } from 'discordx';
import { Events } from 'discord.js';

import ServerExists from '../guards/config/server-exists';
import IsReactionRoleMessage from '../guards/reactions/is-reaction-role-message';
import GuardCache from '../types/GuardCache';

@Discord()
@Guard(ServerExists, IsReactionRoleMessage)
export default abstract class ReactionRoles {
  @On({ event: Events.MessageReactionAdd })
  async addRoleToUser(
    [messageReaction, user]: ArgsOf<Events.MessageReactionAdd>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const emoji = messageReaction.emoji;
    const emojiId = emoji.id ? `<:${emoji.identifier}>` : emoji.name;
    const role = server.reactionRoles.find((role) => role.emoji === emojiId);
    if (!role) {
      return;
    }
    const member = await messageReaction.message.guild.members.fetch(user.id);
    await member.roles.add(role._id);
  }

  @On({ event: Events.MessageReactionRemove })
  async removeRoleFromUser(
    [messageReaction, user]: ArgsOf<Events.MessageReactionRemove>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const emoji = messageReaction.emoji;
    const emojiId = emoji.id ? `<:${emoji.identifier}>` : emoji.name;
    const role = server.reactionRoles.find((role) => role.emoji === emojiId);
    if (!role) {
      return;
    }
    const member = await messageReaction.message.guild.members.fetch(user.id);
    await member.roles.remove(role._id);
  }
}
