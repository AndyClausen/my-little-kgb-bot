import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import Typegoose from '@typegoose/typegoose';
const { getModelForClass, prop } = Typegoose;
import { Snowflake } from 'discord.js';
import { Types } from 'mongoose';

export class VoiceChatRole implements Base {
  _id: Types.ObjectId;

  get id(): string {
    return this._id.toString();
  }

  @prop({ type: String, required: true })
  roleId!: Snowflake;

  @prop({ type: String, required: true })
  channelId!: Snowflake;
}

const VoiceChatRoleModel = getModelForClass(VoiceChatRole);

export default VoiceChatRoleModel;
