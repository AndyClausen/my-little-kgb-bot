import { VoiceState } from 'discord.js';

import GuardCache from '../types/GuardCache';

export default function mapVoiceChatRoles(
  voiceState: VoiceState,
  cache: GuardCache
): string | null {
  if (!cache.server) {
    return;
  }
  cache.voiceChatRoles = cache.server.voiceChatRoles.filter(
    (r) => r.channelId === voiceState.channelID
  );
  if (!cache.voiceChatRoles.length) {
    if (!voiceState.channel?.parent) {
      return;
    }
    cache.voiceChatRoles = cache.server.voiceChatRoles.filter(
      (r) => r.channelId === voiceState.channel.parent.id
    );
    if (!cache.voiceChatRoles.length) {
      return;
    }
    return voiceState.channel.parent.id;
  }
  return voiceState.channelID;
}
