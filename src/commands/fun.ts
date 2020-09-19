import { Client, Command, CommandMessage, Guard } from '@typeit/discord';

import IsConfigEnabled from '../guards/config/is-config-enabled';
import { getMemberArg } from '../helpers/get-member-arg';
import ServerExists from '../guards/config/server-exists';
import { getOrCreateCitizen } from '../db/get-or-create-citizen';
import GuardCache from '../types/GuardCache';

export default class Fun {
  @Command('ding :user')
  async ding(command: CommandMessage<{ user: string }>): Promise<void> {
    const member = await getMemberArg(command);
    if (!member) {
      await command.reply(`Usage: ${command.prefix}ding <@user|userId>`);
      return;
    }
    const citizen = await getOrCreateCitizen(member.id);
    citizen.dings++;
    await citizen.save();
    await command.reply(
      `DING!\n${member} has now talked ${citizen.dings} times with his mic muted`
    );
  }

  @Command('unding :user')
  async unding(command: CommandMessage): Promise<void> {
    const member = await getMemberArg(command);
    if (!member) {
      await command.reply(`Usage: ${command.prefix}unding <@user|userId>`);
      return;
    }
    const citizen = await getOrCreateCitizen(member.id);
    citizen.dings--;
    await citizen.save();
    await command.reply(
      `Someone did a whoopsie! Ding count for ${member} is now ${citizen.dings}.`
    );
  }

  @Command('rr')
  @Guard(ServerExists, IsConfigEnabled('russianRoulette'))
  async russianRoulette(
    command: CommandMessage,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const mutedSeconds = 30;
    const roll = Math.random();
    const promises: Array<Promise<unknown>> = [];

    const { memberRole, gulagRole } = server.config;

    if (!memberRole || !gulagRole) {
      await command.reply(
        'Both `memberRole` and `gulagRole` must be set up for this to work properly'
      );
      return;
    }

    const hit = roll > 5 / 6;
    const hadMemberRole = command.member.roles.cache.has(memberRole);
    const hadGulagRole = command.member.roles.cache.has(gulagRole);

    let res: string;
    if (hit) {
      if (hadMemberRole) {
        promises.push(command.member.roles.remove(memberRole));
      }
      promises.push(command.member.roles.add(gulagRole), command.member.voice.setMute(true));
      res = `**BANG!** You're dead, ${command.author}.`;
    } else {
      res = `**CLICK!** You lived, ${command.author}! For now...`;
    }
    promises.push(command.channel.send(res));

    await Promise.all(promises);

    // remove role after 10 seconds
    if (hit && command.member) {
      await new Promise((resolve) => setTimeout(resolve, mutedSeconds * 1000));
      if (!hadGulagRole) {
        await command.member.roles.remove(gulagRole);
      }
      if (hadMemberRole) {
        await command.member.roles.add(memberRole);
      }
      await command.member.voice.setMute(false);
    }
  }
}
