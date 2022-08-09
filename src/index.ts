import dotenv from 'dotenv';
import {AppendResult, EventStoreDBClient, jsonEvent, JSONType} from "@eventstore/db-client";
import {Client} from "@eventstore/db-client/dist/Client";
import pino from "pino";

let logger: {
    debug: Function,
    info: Function,
};

type Event = {
    type: string,
    data: JSONType,
    metadata?: any,
}

async function time(f: Function): Promise<{ time: number, result: any }> {
    const t0 = performance.now();
    const result = await f();
    const t1 = performance.now();
    return {time: t1 - t0, result};
}


async function publishEvent(client: Client, stream: string, events: Event[]): Promise<AppendResult> {
    const jsonEvents = events.map((d) => jsonEvent(d))
    return client.appendToStream(stream, jsonEvents)
}

async function batchTest(client: Client, batchSize: number, batchCount: number): Promise<void> {
    logger.debug(`batch test with ${JSON.stringify({batchSize, batchCount})}`);
    const streamName = process.env.TEST_STREAM || 'my_sample_stream';

    for (let i = 0; i < batchCount; i++) {
        const events = [];
        for (let j = 0; j < batchSize; j++) {
            events.push({type: 'SampleEvent', data: {sampleData: Date.now()}, metadata: {i, j}})
        }
        await publishEvent(client, streamName, events);
    }
}

async function parallelTest(client: Client, batchSize: number, batchCount: number, parallelCount: number): Promise<void> {
    logger.debug(`parallel test with ${JSON.stringify({batchSize, batchCount, parallelCount})}`);

    const testRuns = [];

    for (let h = 0; h < parallelCount; h++) {
        testRuns.push(batchTest(client, batchSize, batchCount));
    }
    await Promise.all(testRuns);
}

async function run(): Promise<void> {
    dotenv.config({path: `.env`});

    /*    logger = pino({
            level: process.env.LOGLEVEL,
            transport: {
                target: 'pino-pretty'
            },
        });*/

    logger = {
        debug: console.log,
        info: console.log,
    };

    logger.info('starting up');
    const connectionString = process.env.EVENTSTORE_CONNECTION_STRING || 'esdb://localhost';
    logger.info(`connecting to eventstore : ${connectionString}`);
    const client = EventStoreDBClient.connectionString(connectionString);
    logger.info(`connected`);


    const testParams = [
        [50, 100, 100],
        [50, 100, 1000],
    ]

    for (const params of testParams) {
        const [batchSize, batchCount, parallelCount] = params;
        const timeResult = await time(async () => await parallelTest(client, batchSize, batchCount, parallelCount))
        logger.info(`ran parallel test with ${JSON.stringify({
            batchSize,
            batchCount,
            parallelCount,
            totalItems: batchSize * batchCount * parallelCount
        })} in ${timeResult.time}, items/s : ${(batchSize * batchCount * parallelCount) / (timeResult.time / 1000)}`)
    }

    // 2917899 -> 3417899
}

run().then(r => {
    process.exit(0)
})