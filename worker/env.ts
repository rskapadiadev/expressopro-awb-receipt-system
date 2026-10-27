import type { Me } from '../shared/types';
import type { Db } from './db';

export interface Env {
    DB: D1Database;
}

export interface AppEnv {
    Bindings: Env;
    Variables: {
        db: Db;
        me: Me;
    };
}
