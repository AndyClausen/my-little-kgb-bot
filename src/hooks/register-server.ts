import { ArgsOf, Discord, On } from "@typeit/discord";

import ServerModel, { Server } from '../db/models/server';
import sendSystemMessage from '../helpers/send-system-message';

@Discord()
export default class RegisterServer {
  @On('guildCreate')
  async botJoinServer([guild]: ArgsOf<'guildCreate'>): Promise<void> {
    try {
      const server = await ServerModel.create({
        _id: guild.id,
        config: {
          susChance: 0.01,
          randomSus: false,
          russianRoulette: false,
          reactionRoles: false,
        },
        gulag: [],
        reactionRoles: [],
        voiceChatRoles: [],
      } as Server);
      await sendSystemMessage(
        guild,
        { message: `Hello! Please configure me with \`!config\` so I can start servicing you 😊` },
        server
      );
    } catch (e) {
      console.error(e);
      await sendSystemMessage(guild, {
        message: 'I have already been initialized here! Please contact Andy.',
      });
    }
  }

  @On('guildDelete')
  async botLeaveServer([guild]: ArgsOf<'guildDelete'>): Promise<void> {
    if (!guild.available) {
      return;
    }
    await ServerModel.findByIdAndDelete(guild.id);
  }
}
