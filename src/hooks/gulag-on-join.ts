import { ArgsOf, Client, Discord, Guard, On } from 'discordx';

import ServerExists from '../guards/config/server-exists';
import GuardCache from '../types/GuardCache';
import { Volunteer } from '../db/models/volunteer';

@Discord()
export default class GulagOnJoin {
  @On('guildMemberAdd')
  @Guard(ServerExists)
  async gulagOnJoin(
    [member]: ArgsOf<'guildMemberAdd'>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!server.config.gulagRole) {
      return;
    }
    await member.roles.add(server.config.gulagRole);
    server.gulag.push({
      _id: member.id,
      roles: server.config.memberRole ? [server.config.memberRole] : [],
    } as Volunteer);
    await server.save();
  }
}
