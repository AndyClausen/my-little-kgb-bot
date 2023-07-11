import { ArgsOf, Discord, On } from 'discordx';

import ServerModel, { Server } from '../db/models/server';
import sendSystemMessage from '../helpers/send-system-message';
import { Events } from 'discord.js';

@Discord()
export default class RegisterServer {
  @On({ event: Events.GuildCreate })
  async botJoinServer([guild]: ArgsOf<Events.GuildCreate>): Promise<void> {
    try {
      const server = await ServerModel.create({
        _id: guild.id,
        config: {
          susChance: 0.01,
          randomSus: false,
          russianRoulette: false,
        },
        gulag: [],
        roles: [],
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

  @On({ event: Events.GuildDelete })
  async botLeaveServer([guild]: ArgsOf<Events.GuildDelete>): Promise<void> {
    if (!guild.available) {
      return;
    }
    await ServerModel.findByIdAndDelete(guild.id);
  }
}
