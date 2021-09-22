import { ArgsOf, Client, Discord, Guard, On } from 'discordx';

import { JoinVoiceChannel } from '../guards/voicestate/join-voice-channel';
import { LeaveVoiceChannel } from '../guards/voicestate/leave-voice-channel';
import mapVoiceChatRoles from '../helpers/map-voice-chat-roles';
import GuardCache from '../types/GuardCache';
import ServerExists from '../guards/config/server-exists';

@Discord()
@Guard(ServerExists)
export default class VoiceChatRoles {
  currentOp: Promise<void>;

  @On('voiceStateUpdate')
  @Guard(JoinVoiceChannel(mapVoiceChatRoles))
  async addVoiceChatRoleToUser(
    [, after]: ArgsOf<'voiceStateUpdate'>,
    client: Client,
    { voiceChatRoles }: GuardCache
  ): Promise<void> {
    await this.currentOp;
    let res: () => void;
    this.currentOp = new Promise((resolve) => {
      res = resolve;
    });
    try {
      const member = await after.member.fetch(true);
      await member.roles.add(voiceChatRoles.map((r) => r.roleId));
    } finally {
      res();
    }
  }

  @On('voiceStateUpdate')
  @Guard(LeaveVoiceChannel(mapVoiceChatRoles))
  async removeVoiceChatRoleFromUser(
    [before]: ArgsOf<'voiceStateUpdate'>,
    client: Client,
    { voiceChatRoles }: GuardCache
  ): Promise<void> {
    await this.currentOp;
    let res: () => void;
    this.currentOp = new Promise((resolve) => {
      res = resolve;
    });
    try {
      const member = await before.member.fetch(true);
      await member.roles.remove(voiceChatRoles.map((r) => r.roleId));
    } finally {
      res();
    }
  }
}
