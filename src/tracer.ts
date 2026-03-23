import { Collection, MongoClient, ServerApiVersion } from "mongodb";
import policy from "../tracing-policy.json" with { type: "json" };
import { AppRequest, Paths, Trace } from "./utils.js";
import { NextFunction, Response } from "express";
import { randomUUID } from "node:crypto";


let mongoClientPromise: Promise<MongoClient> | null = null;
let mongoCollectionPromise: Promise<Collection<Trace> | null> | null = null;

const getMongoCollection = async (): Promise<Collection<Trace> | null> => {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) return null;

    if (!mongoCollectionPromise) {
        mongoCollectionPromise = (async () => {
            if (!mongoClientPromise) {
                mongoClientPromise = MongoClient.connect(mongoUri, {
                    serverApi: {
                        version: ServerApiVersion.v1,
                        strict: true,
                        deprecationErrors: true,
                    },
                    serverSelectionTimeoutMS: 5000,
                    connectTimeoutMS: 30000,
                });
            }

            const client = await mongoClientPromise;
            return client.db(policy.projectName).collection<Trace>(policy.branchName);
        })().catch((error) => {
            console.error("Unable to connect to MongoDB", error);
            mongoClientPromise = null;
            mongoCollectionPromise = null;
            return null;
        });
    } return mongoCollectionPromise;
};

export const getTraces = async () => {
    const collection = await getMongoCollection();
    if (!collection) return [];

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

export const addTrace = async (trace: Trace) => {
    const collection = await getMongoCollection();
    if (process.env.NODE_ENV !== 'prod') console.log(trace);
    if (!collection) return;

    const isCode = policy.captureCodes;
    const isSlow = trace.durationMs > policy.captureSlow;
    const isErr = isCode.includes(+trace.statusCode.toString().charAt(0))
    
    if( isSlow || isErr){
        try {
            await collection.insertOne(trace);
        } catch (error) {
            console.error("Unable to persist trace to MongoDB", error);
        }
    }
};

export const traceRequest = (req: AppRequest, res: Response, next: NextFunction) => {
    if (req.path === "/favicon.ico" || req.path.startsWith(Paths.logs())) {
        next();
        return;
    }

    const startTime = Date.now();
    const traceId = randomUUID();
    req.startTime = startTime;
    res.setHeader("X-Trace-Id", traceId);
    
    res.on("finish", () => {
        const durationMs = Date.now() - startTime;
        addTrace({
            id: traceId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            startTime,
            durationMs,
            ip: req.ip,
        });
    });
    
    next();
};
