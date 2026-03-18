import { Collection, MongoClient, ServerApiVersion } from "mongodb";
import { DeployT } from "../utils/constant.js";
import { Trace } from "../utils/types.js";

let mongoClientPromise: Promise<MongoClient> | null = null;
let mongoCollectionPromise: Promise<Collection<Trace> | null> | null = null;

const getMongoCollection = async (): Promise<Collection<Trace> | null> => {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
        return null;
    }

    if (!mongoCollectionPromise) {
        mongoCollectionPromise = (async () => {
            if (!mongoClientPromise) {
                mongoClientPromise = MongoClient.connect(mongoUri, {
                    serverApi: {
                        version: ServerApiVersion.v1,
                        strict: true,
                        deprecationErrors: true,
                    },
                });
            }

            const client = await mongoClientPromise;
            return client.db('dts').collection<Trace>('traces');
        })().catch((error) => {
            console.error("Unable to connect to MongoDB", error);
            mongoClientPromise = null;
            mongoCollectionPromise = null;
            return null;
        });
    }

    return mongoCollectionPromise;
};

const addToMemory = async (trace: Trace) => {
    const collection = await getMongoCollection();
    if (!collection) {
        return;
    }

    try {
        await collection.insertOne(trace);
    } catch (error) {
        console.error("Unable to persist trace to MongoDB", error);
    }
};

export const getTraces = async () => {
    const collection = await getMongoCollection();
    if (!collection) {
        return [];
    }

    try {
        return await collection
            .find({}, { projection: { _id: 0 } })
            .sort({ startTime: -1 })
            .limit(100)
            .toArray();
    } catch (error) {
        console.error("Unable to fetch traces from MongoDB, using memory store", error);
        return [];
    }
};

export const addTrace = (trace: Trace) => {
    if (process.env.NODE_ENV !== DeployT.Dev) {
        console.log(trace);
    } 
    void addToMemory(trace);
};

