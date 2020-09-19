import { Channel, TextChannel } from "discord.js";

export default function isTextChannel(channel: Channel): channel is TextChannel {
  return channel.type === 'text';
}
