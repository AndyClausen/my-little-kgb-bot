import { Snowflake } from 'discord.js';
import Typegoose from '@typegoose/typegoose';
const { getModelForClass, prop } = Typegoose;
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import Mongoose from 'mongoose';

import { Volunteer } from './volunteer';
import { Config } from './config';
import { ReactionRole } from './reaction-role';

export class Server extends TimeStamps {
  @prop({ type: String, required: true })
  _id!: Snowflake;

  @prop({ type: Config, default: {}, _id: false, required: true })
  config!: Config;

  @prop({ type: Volunteer, default: [], required: true })
  gulag!: Mongoose.Types.Array<Volunteer>;

  @prop({ type: ReactionRole, default: [], required: true })
  reactionRoles!: Mongoose.Types.Array<ReactionRole>;

  @prop({ type: String, required: false })
  reactionRolesMessageId?: Snowflake;

  @prop({ type: String, required: false })
  reactionRolesChannelId?: Snowflake;
}

const ServerModel = getModelForClass(Server);

export default ServerModel;
