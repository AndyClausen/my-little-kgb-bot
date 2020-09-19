import { getModelForClass, prop } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { Snowflake } from 'discord.js';

export class ScheduledMessage extends Base {
  @prop({ type: String, required: true })
  userId!: Snowflake;

  @prop({ required: true })
  message!: string;

  @prop({ required: true })
  hour!: number;

  @prop({ required: true })
  minute!: number;

  @prop({ required: false })
  onlyWorkdays?: boolean;
}

const ScheduledMessageModel = getModelForClass(ScheduledMessage);

export default ScheduledMessageModel;
