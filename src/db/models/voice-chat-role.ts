import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { getModelForClass, prop } from '@typegoose/typegoose';
import { Snowflake } from 'discord.js';

export class VoiceChatRole extends Base {
  @prop({ type: String, required: true })
  roleId!: Snowflake;

  @prop({ type: String, required: true })
  channelId!: Snowflake;
}

const VoiceChatRoleModel = getModelForClass(VoiceChatRole);

export default VoiceChatRoleModel;
