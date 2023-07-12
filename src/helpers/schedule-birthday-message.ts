import { Client } from 'discordx';
import { ChannelType, Snowflake } from 'discord.js';

import getMillisUntilTime from './get-millis-until-time';
import { Server } from '../db/models/server';
import sendBirthdayMessage from './send-birthday-message';
import getCitizensWithBirthday from './get-citizens-with-birthday';

const serverTimers = new Map<Snowflake, NodeJS.Timer>();

export default function scheduleBirthdayMessage(client: Client, server: Server): void {
  if (!server.birthdayChannel || server.config.birthdayHour == null) {
    return null;
  }

  if (serverTimers.has(server._id)) {
    clearTimeout(serverTimers.get(server._id));
    clearInterval(serverTimers.get(server._id));
  }

  async function fn(): Promise<void> {
    const now = new Date();

    const channel = await client.channels.fetch(server.birthdayChannel);
    if (channel.type !== ChannelType.GuildText) {
      return null;
    }
    const s = await client.guilds.fetch(server._id);
    const citizens = await getCitizensWithBirthday(now.getMonth() + 1, now.getDate());
    const sends = citizens.map(async (c) => {
      const member = await s.members.fetch(c._id);
      if (!member) {
        return null;
      }

      const age = c.birthdayYear && now.getFullYear() - c.birthdayYear;
      const template = age
        ? server.config.birthdayTemplateWithAge ?? server.config.birthdayTemplate
        : server.config.birthdayTemplate;
      return sendBirthdayMessage(client, template, channel, member.user, age);
    });
    await Promise.all(sends);
  }

  const timeout = setTimeout(() => {
    void fn();
    const timer = setInterval(() => {
      void fn();
    }, 1000 * 60 * 60 * 24); // 24 hours in millis
    serverTimers.set(server._id, timer);
  }, getMillisUntilTime(server.config.birthdayHour, 6));
  console.log(getMillisUntilTime(server.config.birthdayHour, 6));
  serverTimers.set(server._id, timeout);
}
