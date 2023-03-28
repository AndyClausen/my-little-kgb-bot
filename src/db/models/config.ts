import Typegoose from '@typegoose/typegoose';
const { getModelForClass, prop, ModelOptions } = Typegoose;
import { Snowflake } from 'discord.js';

import PropsOfType from '../../types/PropsOfType';

@ModelOptions({ schemaOptions: { _id: false, versionKey: false } })
export class Config {
  @prop({ type: () => String, required: false })
  memberRole?: Snowflake;

  @prop({ type: () => String, required: false })
  adminRole?: Snowflake;

  @prop({ type: () => String, required: false })
  modRole?: Snowflake;

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

  static isValidKey(key: string | number | symbol | null): key is keyof Config {
    return key && key in ConfigModel.schema.paths;
  }

  static isStringProp(key: keyof Config): key is PropsOfType<Config, string> {
    const props: Array<string> = ['memberRole', 'adminRole', 'modRole', 'gulagRole', 'logChannel'];
    return props.includes(key);
  }

  static isNumberProp(key: keyof Config): key is PropsOfType<Config, number> {
    const props: Array<string> = ['susChance'];
    return props.includes(key);
  }

  static isBooleanProp(this: void, key: keyof Config): key is PropsOfType<Config, boolean> {
    const props: Array<string> = ['randomSus', 'russianRoulette'];
    return props.includes(key);
  }
}

const ConfigModel = getModelForClass(Config);

export default ConfigModel;
