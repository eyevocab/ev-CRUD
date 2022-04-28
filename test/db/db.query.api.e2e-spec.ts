import { Test, TestingModule } from '@nestjs/testing';
import { IDatabaseCredentials, IDatabaseDevice } from "../../src/api/db/db.interface";
import { VocabExample } from '../../src/api/entities/vocab';
import { IVocab } from '../../src/api/entities/vocab/vocab.interface';
import { init_rethink } from '../../src/api/db/_rdb/_rdb.client';

const HOST = '192.168.1.235';
const PORT = 28015;
const DB_NAME = 'dbq';
const TABLE_NAME = 'test-table';

const data: IVocab = VocabExample;
const LOG = false;
if(LOG) {
    console.log(`example data: `, data);
}
const target_query_value: string = 'la cuchara';

const CLEAN_UP = false;

describe('db.api query', () => {
    const cred: IDatabaseCredentials = {
        service: 'rethink',
        db: '',
        host: HOST,
        port: PORT
    };

    let client!: IDatabaseDevice;

    it('connecting', async () => {
        expect.assertions(1);
        // connect to the db
        client =  await init_rethink(cred);
        expect(client.getConn()).toBeDefined();
    });

    it('creating a new db', async() => {
        // console.log('create a new db');
        await client.createDb(DB_NAME);
    });

    it('verifying a new db', async() => {
        // expect.assertions(1);
        // console.log('getting dbnames');
        const dbs = await client.getDbNames();
        // console.log(dbs);
        // expect(dbs).toContain(DB_NAME);
    });

    it('creating a new table', async() => {
        // console.log('create a new table');
        await client.createTable(DB_NAME, TABLE_NAME);
    });

    it('verifying a new table', async() => {
        // expect.assertions(1);
        // console.log('get table names');
        const tables = await client.getTableNames(DB_NAME);
        // console.log(tables);
        // expect(tables).toContain(TABLE_NAME);
    });

    it('inserting into a new table', async() => {
        expect.assertions(1);
        // console.log('inserting into a table');
        expect(await client.insert(DB_NAME, TABLE_NAME, data)).toBeTruthy();
    });

    it('querying from a table', async() => {
        expect.assertions(1);
        // console.log('getting from a table');
        const items = await client.query(DB_NAME, TABLE_NAME, {});
        // console.log(items);
        expect(items[0]['value']).toBe(target_query_value);
    });

    it('closing the connection', async() => {
        // close the connection and wait
        client.closeConnection(true);
    });
})
