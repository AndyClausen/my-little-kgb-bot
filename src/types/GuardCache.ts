import { DocumentType } from '@typegoose/typegoose';

import { Server } from '../db/models/server';
import { VoiceChatRole } from '../db/models/voice-chat-role';

export default interface GuardCache {
  server?: DocumentType<Server>;
  voiceChatRoles?: VoiceChatRole[];
}
