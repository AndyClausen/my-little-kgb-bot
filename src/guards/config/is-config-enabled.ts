import { GuardFunction } from 'discordx';

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
        await interaction.reply({ ephemeral: true, content: `${key} is disabled...` });
      }
      return;
    }
    await next();
  };
}
