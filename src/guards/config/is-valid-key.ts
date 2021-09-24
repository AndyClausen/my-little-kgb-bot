import ConfigModel, { Config } from '../../db/models/config';
import { GuardFunction } from 'discordx';
import { CommandInteraction } from 'discord.js';

const IsValidKey: GuardFunction<CommandInteraction> = async (
  interaction: CommandInteraction,
  client,
  next
) => {
  const key = interaction.options.getString('key');
  if (!Config.isValidKey(key)) {
    await interaction.reply(
      `Invalid key '${key}'! Available keys are:\n${Object.keys(ConfigModel.schema.paths)}`
    );
    return;
  }
  await next();
};

export default IsValidKey;
