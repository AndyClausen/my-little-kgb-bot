import { ArgsOf, Discord, On } from 'discordx';

import ServerModel, { Server } from '../db/models/server';
import sendSystemMessage from '../helpers/send-system-message';

@Discord()
export default class RegisterServer {
  @On({ event: 'guildCreate' })
  async botJoinServer([guild]: ArgsOf<'guildCreate'>): Promise<void> {
    try {
      const server = await ServerModel.create({
        _id: guild.id,
        config: {
          susChance: 0.01,
          randomSus: false,
          russianRoulette: false,
        },
        gulag: [],
        reactionRoles: [],
      } as Server);
      await sendSystemMessage(
        guild,
        `Hello! Please configure me with \`/config\` so I can start servicing you 😊`,
        server
      );
    } catch (e) {
      console.error(e);
      await sendSystemMessage(guild, 'I have already been initialized here! Please contact Andy.');
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
