import { ButtonComponent, Client, Discord, Slash, SlashGroup } from 'discordx';
import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from 'discord.js';
import CitizenModel from '../db/models/citizen';

@Discord()
@SlashGroup('leaderboard')
export default class Leaderboard {
  limit = 10;

  @Slash('dings', {
    description: 'See who has talked with their mic muted the most (cross-server)',
  })
  async leaderboardDings(interaction: CommandInteraction, client: Client): Promise<void> {
    const options = await this.generateLeaderboardOptions(client);
    await interaction.reply(options);
  }

  @ButtonComponent('prev-dings-btn')
  async prevDingsBtn(interaction: ButtonInteraction, client: Client): Promise<void> {
    const [, from] = interaction.message.embeds[0].description.match(/Top (\d+)-(\d+)/);
    const skip = Number(from) - (this.limit + 1);
    const options = await this.generateLeaderboardOptions(client, skip >= 0 ? skip : 0);
    await interaction.update(options);
  }

  @ButtonComponent('next-dings-btn')
  async nextDingsBtn(interaction: ButtonInteraction, client: Client): Promise<void> {
    const [, , to] = interaction.message.embeds[0].description.match(/Top (\d+)-(\d+)/);
    const skip = Number(to);
    const options = await this.generateLeaderboardOptions(client, skip);
    await interaction.update(options);
  }

  async generateLeaderboardOptions(client: Client, skip = 0) {
    const topDings = await CitizenModel.find({ dings: { $gt: 0 } })
      .sort({ dings: -1 })
      .limit(this.limit)
      .skip(skip);

    const embed = new MessageEmbed({
      title: 'Top dings globally',
      description: `Top ${skip + 1}-${skip + topDings.length}`,
      fields: await Promise.all(
        topDings.map(async (citizen, i) => ({
          name: `${i + skip + 1}: ${
            (client.users.cache.get(citizen._id) || (await client.users.fetch(citizen._id))).tag
          }`,
          value: citizen.dings.toString(),
          inline: false,
        }))
      ),
    });
    const prevBtn = new MessageButton()
      .setLabel('Previous')
      .setEmoji('⏮')
      .setStyle('PRIMARY')
      .setDisabled(!skip)
      .setCustomId('prev-dings-btn');
    const nextBtn = new MessageButton()
      .setLabel('Next')
      .setEmoji('⏭')
      .setStyle('PRIMARY')
      .setDisabled((await CitizenModel.count({ dings: { $gt: 0 } })) <= skip + this.limit)
      .setCustomId('next-dings-btn');

    return {
      embeds: [embed],
      components: [new MessageActionRow().setComponents(prevBtn, nextBtn)],
    };
  }
}
