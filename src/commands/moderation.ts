import { Client, Command, CommandMessage, Guard } from '@typeit/discord';
import { DiscordAPIError } from 'discord.js';

import { IsAdmin } from '../guards/commands/is-admin';
import { getMemberArg } from '../helpers/get-member-arg';
import getRandomInt from '../helpers/get-random-int';
import ServerExists from '../guards/config/server-exists';
import { Volunteer } from '../db/models/volunteer';
import { getOrCreateCitizen } from '../db/get-or-create-citizen';
import GuardCache from '../types/GuardCache';
import isTextChannel from '../helpers/is-text-channel';

export default class Moderation {
  @Command('move :channelFromId :channelToId')
  @Guard(ServerExists, IsAdmin)
  async bulkMove(
    command: CommandMessage<{ channelFromId: string; channelToId: string }>
  ): Promise<void> {
    let { channelFromId, channelToId } = command.args;
    if (!channelFromId) {
      await command.reply(`Please give one or two channel IDs as arguments`);
      return;
    }
    if (!channelToId) {
      channelToId = channelFromId;
      channelFromId = command.member.voice.channelID;
    }

    const [channelFrom, channelTo] = [channelFromId, channelToId].map((id) =>
      command.guild.channels.resolve(id)
    );
    if (!channelFrom || channelFrom.type !== 'voice' || !channelTo || channelTo.type !== 'voice') {
      await command.reply(`One or both IDs were not valid voice channel IDs`);
      return;
    }

    try {
      await Promise.all(
        channelFrom.members.mapValues((member) => {
          if (channelTo.permissionsFor(member).missing('CONNECT').length) {
            const err = new Error(member.id);
            err.name = 'missingConnectPerm';
            throw err;
          }
          return member.voice.setChannel(channelToId);
        })
      );
    } catch (e) {
      if (e.name === 'missingConnectPerm') {
        await command.reply(
          `Member <@${e.message}> does not have permission to connect to ${channelTo.name}`
        );
        return;
      }
      await command.reply(`${e.name}: ${e.message}`);
    }
  }

  @Command('gulag :user')
  @Guard(ServerExists, IsAdmin)
  async gulag(
    command: CommandMessage<{ user: string }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const member = await getMemberArg(command);
    if (!member) {
      await command.reply(`Please give a user ID as argument!`);
      return;
    }

    const { gulagRole, adminRole } = server.config;
    if (!gulagRole) {
      await command.reply('You have not set a gulag role in the config!');
      return;
    }

    if (server.gulag.find((volunteer) => volunteer._id === member.id)) {
      await command.channel.send(`${member.nickname} is already in gulag`);
      return;
    }
    const roles = member.roles.cache
      .keyArray()
      .filter((roleId) => ![command.guild.id, adminRole].includes(roleId));
    if (roles.length) {
      try {
        await member.roles.remove(roles, 'gulag');
      } catch (e) {
        if (e instanceof DiscordAPIError && e.message === 'Missing Permissions') {
          await command.reply(
            `I don't have permissions to remove one or more of this person's roles!`
          );
          return;
        }
        throw e;
      }
    }
    try {
      await member.roles.add(gulagRole, 'gulag');
    } catch (e) {
      if (e instanceof DiscordAPIError && e.message === 'Missing Permissions') {
        await command.reply(`I don't have permissions to add the gulag role to this person!`);
        return;
      }
      throw e;
    }

    const volunteer: Volunteer = { _id: member.id, roles: roles };
    server.gulag.push(volunteer);
    await server.save();

    await member.voice?.kick('gulag');

    const messages = [
      `Bend over, ${member}, and get ready for the Glorious Leader`,
      `${member} has ~~been sent to~~ voluntarily signed up for the gulag`,
      `${member} suddenly vanished`,
      `${member} went poof`,
      `${member} dun did a whoopsie and is being spanked in the gulag`,
      `Have a nice vacation, ${member}!`,
      `Congratulation ${member} - you've won an all-inclusive stay at the gulag!`,
    ];

    const citizen = await getOrCreateCitizen(member.id);
    citizen.gulagCount++;
    await citizen.save();
    await command.channel.send(messages[getRandomInt(0, messages.length - 1)]);
  }

  @Command('ungulag :user')
  @Guard(ServerExists, IsAdmin)
  async ungulag(
    command: CommandMessage<{ user: string }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const member = await getMemberArg(command);
    if (!member) {
      await command.reply(`Please give a user ID as argument!`);
      return;
    }

    const { gulagRole, memberRole } = server.config;
    if (!gulagRole) {
      await command.reply('You have not set a gulag role in the config!');
      return;
    }

    const volunteer = server.gulag.find((volunteer) => volunteer._id === member.id);
    if (!volunteer && !member.roles.cache.has(gulagRole)) {
      await command.reply(`${member.nickname} is not in the gulag`);
      return;
    }
    const roles = volunteer?.roles || [memberRole];
    if (roles.filter((r) => !!r).length) {
      await member.roles.add(roles, 'ungulag');
    }
    await member.roles.remove(gulagRole, 'ungulag');

    // remove from db if not new member
    if (volunteer) {
      server.gulag.remove(volunteer);
      await server.save();
    }

    const messages = [
      `Welcome back, ${member.displayName} - hope you enjoyed your stay in the gulag!`,
      `After much hard work in the gulag, ${member.displayName} has been welcomed back into society.`,
      `Hope you learned your lesson, ${member.displayName}. If not, the gulag is always open.`,
      `${member.displayName} has returned from ~~the depths of hell~~ their vacation in the Gulag :)`,
      `${member.displayName} has completed their work quota and has been congratulated on their service for the Union.`,
      `${member.displayName} has served their gulag ~~sentence~~ vacation and been released back into the public. Good luck!`,
    ];

    const citizen = await getOrCreateCitizen(member.id);
    citizen.gulagCount--;
    await citizen.save();
    await command.channel.send(messages[getRandomInt(0, messages.length - 1)]);
  }

  @Command('purge :amount')
  @Guard(ServerExists, IsAdmin)
  async purge(command: CommandMessage<{ amount: string | number }>): Promise<void> {
    if (!isTextChannel(command.channel)) {
      return;
    }
    const { amount } = command.args;
    if (!amount) {
      await command.reply(`Amount must be a number`);
      return;
    }
    if (typeof amount !== 'number') {
      await command.reply(`Usage: ${command.prefix}purge <amount>`);
      return;
    }
    if (amount < 0) {
      await command.reply(`Amount must be greater than 0`);
      return;
    }

    const messages = await command.channel.messages.fetch({ limit: amount + 1 });
    await command.channel.bulkDelete(messages);
  }
}
