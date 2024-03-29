// this is where the database service gets initialized and prepared with test data

import { init_rethink } from "../../../api"
import { IDatabaseCredentials, IDatabaseDevice } from "../../../api/db/db.interface"
import { IDBMeta } from "../../../api/db/db.interface";
import { CreatorExample } from "../../../api/entities/users/creator/creator.example";
import { CreatorExampleCollections } from "../../../api/entities/users/creator/creator.example";
import { ExampleVocabs } from "../../../api/entities/users/creator/creator.example";

// TODO add to .env file
const DB_HOST = 'localhost'; // 'DOCKER_DB_SERVICE' for docker
const DB_PORT = 28015;

const betaDeployment: IDBMeta = {
    dbName: 'betaDb',
    tableNames: [ 'vocab', 'collections', 's3', 'courses', 'users' ]
}

import { test1, test2, test3, test4 } from './db.examples';
const PREPARE_DBS = [
    betaDeployment
    // test1,
    // test2,
    // test3,
    // ... 
]

// injects the interface for the database service to be accessable for the whole application
export const DBProvider = {
    provide: 'DBProvider',
    useFactory: async () => {
        const credentials: IDatabaseCredentials = {
            service: "rethink",
            host: DB_HOST,
            port: DB_PORT,
            db: ""
        }
        
        const client: IDatabaseDevice = await init_rethink(credentials);
        try {
            // implemented on db device which is _rdb for p1 (creator interface)
            await client.prepare(PREPARE_DBS);
            
            // insert the creator into users table
            await client.insert(betaDeployment.dbName, 'users', [ CreatorExample ]);

            // insert collections
            await client.insert(betaDeployment.dbName, 'collections', CreatorExampleCollections);

            // insert vocabs
            console.log(`inserting ${ExampleVocabs.length} vocab seeds`);
            await client.insert(betaDeployment.dbName, 'vocab', ExampleVocabs);

        } catch(err) {
            console.log(`the was an error setting up the betaDb`);
        }
        return client;
    }
}