import { DocumentType } from '@typegoose/typegoose';

import { Server } from '../db/models/server';

export default interface GuardCache {
  server?: DocumentType<Server>;
}
