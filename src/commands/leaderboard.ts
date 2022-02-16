import { ButtonComponent, Client, Discord, Slash, SlashGroup } from 'discordx';
import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from 'discord.js';
import CitizenModel from '../db/models/citizen';

type LeaderboardType = 'dings' | 'gulags';

@Discord()
@SlashGroup({ name: 'leaderboard' })
@SlashGroup('leaderboard')
export default class Leaderboard {
  limit = 10;

  @Slash('dings', {
    description: 'See who has talked with their mic muted the most (cross-server)',
  })
  async leaderboardDings(interaction: CommandInteraction, client: Client): Promise<void> {
    const options = await this.generateLeaderboardOptions(client, 'dings');
    await interaction.reply(options);
  }

  @Slash('gulags', {
    description: 'See who has been sent to the gulag the most (cross-server)',
  })
  async leaderboardGulag(interaction: CommandInteraction, client: Client): Promise<void> {
    const options = await this.generateLeaderboardOptions(client, 'gulags');
    await interaction.reply(options);
  }

  @ButtonComponent('prev-leaderboard-btn')
  async prevLeaderboardBtn(interaction: ButtonInteraction, client: Client): Promise<void> {
    const { title } = interaction.message.embeds[0];
    const type = title.includes('dings') ? 'dings' : 'gulags';
    const [, from] = interaction.message.embeds[0].description.match(/Top (\d+)-(\d+)/);
    const skip = Number(from) - (this.limit + 1);
    const options = await this.generateLeaderboardOptions(client, type, skip >= 0 ? skip : 0);
    await interaction.update(options);
  }

  @ButtonComponent('next-leaderboard-btn')
  async nextLeaderboardBtn(interaction: ButtonInteraction, client: Client): Promise<void> {
    const { title } = interaction.message.embeds[0];
    const type = title.includes('dings') ? 'dings' : 'gulags';
    const [, , to] = interaction.message.embeds[0].description.match(/Top (\d+)-(\d+)/);
    const skip = Number(to);
    const options = await this.generateLeaderboardOptions(client, type, skip);
    await interaction.update(options);
  }

  async generateLeaderboardOptions(client: Client, type: LeaderboardType, skip = 0) {
    const key = type === 'dings' ? 'dings' : 'gulagCount';
    const page = await CitizenModel.find({ [key]: { $gt: 0 } })
      .sort({ [key]: -1 })
      .limit(this.limit)
      .skip(skip);

    const embed = new MessageEmbed({
      title: `Top ${type} globally`,
      description: `Top ${skip + 1}-${skip + page.length}`,
      fields: await Promise.all(
        page.map(async (citizen, i) => ({
          name: `${i + skip + 1}: ${
            (client.users.cache.get(citizen._id) || (await client.users.fetch(citizen._id))).tag
          }`,
          value: citizen[key].toString(),
          inline: false,
        }))
      ),
    });
    const prevBtn = new MessageButton()
      .setLabel('Previous')
      .setEmoji('⏮')
      .setStyle('PRIMARY')
      .setDisabled(!skip)
      .setCustomId('prev-leaderboard-btn');
    const nextBtn = new MessageButton()
      .setLabel('Next')
      .setEmoji('⏭')
      .setStyle('PRIMARY')
      .setDisabled((await CitizenModel.count({ [key]: { $gt: 0 } })) <= skip + this.limit)
      .setCustomId('next-leaderboard-btn');

    return {
      embeds: [embed],
      components: [new MessageActionRow().setComponents(prevBtn, nextBtn)],
    };
  }
}
