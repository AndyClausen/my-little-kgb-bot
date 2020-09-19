import { Guard, On } from '@typeit/discord';
import { Message } from 'discord.js';

import { NotBot } from '../guards/messages/not-bot';
import IsConfigEnabled from '../guards/config/is-config-enabled';
import ServerExists from "../guards/config/server-exists";

export default class RandomSus {
  @On('message')
  @Guard(NotBot)
  @Guard(ServerExists, IsConfigEnabled('randomSus'))
  async randomSus([message]: Message[]): Promise<void> {
    const roll = Math.random();
    const threshold = 0.01;

    if (roll < threshold) {
      await message.react(':amongusvote_red:762748488525283368');
    }
  }
}