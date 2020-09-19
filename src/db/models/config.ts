import { getModelForClass, prop, ModelOptions } from '@typegoose/typegoose';
import { Snowflake } from 'discord.js';

import PropsOfType from '../../types/PropsOfType';

@ModelOptions({ schemaOptions: { _id: false, versionKey: false } })
export class Config {
  @prop({ type: () => String, required: false })
  memberRole?: Snowflake;

  @prop({ type: () => String, required: false })
  adminRole?: Snowflake;

  @prop({ type: () => String, required: false })
  gulagRole?: Snowflake;

  @prop({ type: () => String, required: false })
  logChannel?: Snowflake;

  @prop({ default: 0.01, required: true })
  susChance!: number;

  @prop({ default: false, required: true })
  randomSus!: boolean;

  @prop({ default: false, required: true })
  russianRoulette!: boolean;

  @prop({ default: false, required: true })
  reactionRoles!: boolean;

  static isValidKey(key: string): key is keyof Config {
    return key in ConfigModel.schema.paths;
  }

  static isStringProp(key: keyof Config): key is PropsOfType<Config, string> {
    const props: Array<PropsOfType<Config, string> | string> = [
      'memberRole',
      'adminRole',
      'gulagRole',
      'logChannel',
    ];
    return props.includes(key);
  }

  static isNumberProp(key: keyof Config): key is PropsOfType<Config, number> {
    const props: Array<PropsOfType<Config, number> | string> = ['susChance'];
    return props.includes(key);
  }

  static isBooleanProp(key: keyof Config): key is PropsOfType<Config, boolean> {
    const props: Array<PropsOfType<Config, boolean> | string> = [
      'randomSus',
      'russianRoulette',
      'reactionRoles',
    ];
    return props.includes(key);
  }
}

const ConfigModel = getModelForClass(Config);

export default ConfigModel;
