import dotenv from 'dotenv';
import {EventStoreDBClient, jsonEvent, JSONType} from "@eventstore/db-client";
import {Client} from "@eventstore/db-client/dist/Client";
import pino from "pino";

let logger: pino.Logger;

type Event = {
    type: string,
    data: JSONType,
    metadata?: any,
}

function publishEvent(client: Client, stream: string, events: Event[]) {
    const jsonEvents = events.map((d) => jsonEvent(d))
    client.appendToStream(stream, jsonEvents)
}

async function batchTest(client: Client, batchSize: number, batchCount: number): Promise<void> {
    logger.info(`running test with ${JSON.stringify({size: batchSize, parallel: batchCount})}`);
    const timerKey = `batchTest-${batchSize}-${batchCount}`

    console.time(timerKey);
    const streamName = process.env.TEST_STREAM || 'test_stream';

    for (let i = 0; i < batchCount; i++) {
        const events = [];
        for (let j = 0; j < batchSize; j++) {
            events.push({type: 'SampleEvent', data: {sampleData: Date.now()}, metadata: {i, j}})
        }
        await publishEvent(client, streamName, events);
    }
    console.timeEnd(timerKey);
}

async function run(): Promise<void> {
    dotenv.config({path: `.env`});

    logger = pino({
        level: process.env.LOGLEVEL,
        transport: {
            target : 'pino-pretty'
        },
    });

    logger.info('starting up');
    const connectionString = process.env.EVENTSTORE_CONNECTION_STRING || 'esdb://localhost';
    logger.info(`connecting to eventstore : ${connectionString}`);
    const client = EventStoreDBClient.connectionString(connectionString);
    logger.info(`connected`);

    await batchTest(client, 200, 50);
}

run().then(r => {
    process.exit(0)
})