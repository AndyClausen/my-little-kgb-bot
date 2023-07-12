import { Client } from 'discordx';
import { TextChannel, User } from 'discord.js';
import moment from 'moment';

export default async function sendBirthdayMessage(
  client: Client,
  template: string,
  channel: TextChannel,
  user: User,
  age?: number
) {
  let message = template.replace('{name}', user.toString());
  if (age) {
    message = message.replace('{age}', age.toString());
    message = message.replace('{ageth}', moment.localeData().ordinal(age));
  }
  await channel.send(message);
}
