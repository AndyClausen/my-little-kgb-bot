import { ArgsOf, Client, Guard, On } from '@typeit/discord';

import { JoinVoiceChannel } from '../guards/voicestate/join-voice-channel';
import { LeaveVoiceChannel } from '../guards/voicestate/leave-voice-channel';
import mapVoiceChatRoles from '../helpers/map-voice-chat-role';
import GuardCache from '../types/GuardCache';
import ServerExists from "../guards/config/server-exists";

export default class VoiceChatRoles {
  @On('voiceStateUpdate')
  @Guard(ServerExists, JoinVoiceChannel(mapVoiceChatRoles))
  async addVoiceChatRoleToUser(
    [, after]: ArgsOf<'voiceStateUpdate'>,
    client: Client,
    { voiceChatRoles }: GuardCache
  ): Promise<void> {
    await after.member.roles.add(voiceChatRoles.map((r) => r.roleId));
  }

  @On('voiceStateUpdate')
  @Guard(ServerExists, LeaveVoiceChannel(mapVoiceChatRoles))
  async removeVoiceChatRoleFromUser(
    [before]: ArgsOf<'voiceStateUpdate'>,
    client: Client,
    { voiceChatRoles }: GuardCache
  ): Promise<void> {
    await before.member.roles.remove(voiceChatRoles.map((r) => r.roleId));
  }
}
