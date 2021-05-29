import { GuardFunction } from '@typeit/discord';

import { Config } from '../../db/models/config';
import PropsOfType from '../../types/PropsOfType';
import GuardCache from '../../types/GuardCache';
import { CommandInteraction } from 'discord.js';

export default function IsConfigEnabled(
  key: PropsOfType<Config, boolean>
): GuardFunction<CommandInteraction | unknown[], GuardCache> {
  return async (interaction, client, next, { server }) => {
    if (!server.config[key]) {
      if (interaction instanceof CommandInteraction) {
        await interaction.reply(`${key} is disabled...`, { ephemeral: true });
      }
      return;
    }
    await next();
  };
}
