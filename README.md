# test_collector_worload

This repo simulates our workload to allow to replicate issues :

### Memory leak ?

This seems to be a problem that happens when we make too many concurrent queries to eventstore

    (node:76960) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 drain listeners added to [ClientDuplexStreamImpl]. Use emitter.setMaxListeners() to increase limit
    (node:76960) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 drain listeners added to [ClientDuplexStreamImpl]. Use emitter.setMaxListeners() to increase limit
    (node:76960) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 drain listeners added to [ClientDuplexStreamImpl]. Use emitter.setMaxListeners() to increase limit

### insert locking up

When the eventstore is hammered for too long, inserts crawl to a hald without any information.