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
    return;
  }
  return voiceState.channelID;
}
