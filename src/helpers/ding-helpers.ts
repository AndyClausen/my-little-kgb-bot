import { BaseCommandInteraction, User } from 'discord.js';
import { getOrCreateCitizen } from '../db/get-or-create-citizen';

export async function ding(user: User, interaction: BaseCommandInteraction): Promise<void> {
  const member = await interaction.guild.members.fetch(user);
  if (!member) {
    await interaction.reply(`Could not find that member`);
    return;
  }
  const citizen = await getOrCreateCitizen(member.id);
  citizen.dings++;
  await citizen.save();
  await interaction.reply(
    `DING!\n${member} has now talked ${citizen.dings} times with their mic muted`
  );
}

export async function unding(user: User, interaction: BaseCommandInteraction): Promise<void> {
  const member = await interaction.guild.members.fetch(user);
  if (!member) {
    await interaction.reply(`Could not find that member`);
    return;
  }
  const citizen = await getOrCreateCitizen(member.id);
  citizen.dings--;
  await citizen.save();
  await interaction.reply(
    `Someone did a whoopsie! Ding count for ${member} is now ${citizen.dings}.`
  );
}
