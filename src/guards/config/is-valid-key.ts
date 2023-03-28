import { GuardFunction } from 'discordx';
import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';

import ConfigModel, { Config } from '../../db/models/config';

const IsValidKey: GuardFunction<CommandInteraction> = async (
  interaction: CommandInteraction,
  client,
  next
) => {
  const option = interaction.options.get('key', true);
  if (option.type !== ApplicationCommandOptionType.String) {
    return;
  }
  const key = option.value;
  if (typeof key == 'boolean' || !Config.isValidKey(key)) {
    await interaction.reply(
      `Invalid key '${key}'! Available keys are:\n${Object.keys(ConfigModel.schema.paths)}`
    );
    return;
  }
  await next();
};

export default IsValidKey;
