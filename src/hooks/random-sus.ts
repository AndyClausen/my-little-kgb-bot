import { Discord, Guard, On } from 'discordx';
import { Message } from 'discord.js';

import IsConfigEnabled from '../guards/config/is-config-enabled';
import ServerExists from '../guards/config/server-exists';

@Discord()
export default class RandomSus {
  @On('messageCreate')
  @Guard(ServerExists, IsConfigEnabled('randomSus'))
  async randomSus([message]: Message[]): Promise<void> {
    const roll = Math.random();
    const threshold = 0.01;

    if (roll < threshold) {
      await message.react(':amongusvote_red:762748488525283368');
    }
  }
}
