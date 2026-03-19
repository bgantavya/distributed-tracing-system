import { getTraces } from "./Tracer/store.js";
import { AppRequest } from "./utils/types.js";
import { Response } from "express";

export const showLogs = async (req: AppRequest, res: Response) => {
    const traces = await getTraces();
    const raw = req.params.code;
    const statusCode = raw ? Number(raw) : undefined;

    if (raw && !Number.isFinite(statusCode)) {
        res.status(400).send("Invalid status code");
        return;
    }

    if (statusCode && Number.isFinite(statusCode)) {
        res.json({ traces: traces.filter((t) => t.statusCode === statusCode) });
        return;
    }

    res.json({ traces });
};

export const showUser = (req: AppRequest, res: Response) => {
    const user = req.user;
    if (!user) {
        res.status(404).send('User not found');
        return;
    }
    res.send(`Viewing user ${user.name}`);
};

export const editUser = (req: AppRequest, res: Response) => {
    const user = req.user;
    if (!user) {
        res.status(404).send('User not found');
        return;
    }
    res.send('Editing user ' + user.name);
};

export const deleteUser = (req: AppRequest, res: Response) => {
    const user = req.user;
    if (!user) {
        res.status(404).send('User not found');
        return;
    }
    res.send('Deleted user ' + user.name);
};

export const showDelay = (req: AppRequest, res: Response) => {
    res.send('Response delayed by seconds: ' + req.delaySeconds);
};

export const showStatus = (req: AppRequest, res: Response) => {
    const raw = req.params.code;
    const code = Number(raw);

    if (!raw || !Number.isFinite(code)) {
        res.status(400).send('Invalid status code');
        return;
    }

    if (code < 100 || code > 599) {
        res.status(400).send('Status code out of range');
        return;
    }

    res.status(code).send('Status set to ' + code);
};

export const notFound = (req: AppRequest, res: Response) => {
    res.status(404).send('Nothing here')
};

export const showTest = (req: AppRequest, res: Response) => {
    res.json({
			method: req.method,
			path: req.originalUrl,
			statusCode: res.statusCode,
			startTime:req.startTime,
			durationMs:(Date.now() - req.startTime!),
			userId: req.user?.id ?? req.authenticatedUser?.id,
			ip: req.ip,
    })
}