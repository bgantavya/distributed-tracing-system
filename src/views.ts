import type { AppRequest, ViewProps } from "../utils/types";
import type { Response } from "express";

export const showLogs = ({req, res}: ViewProps) => {
  const traces = req.traces ?? [];
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

export const showUser = ({req, res}: ViewProps) => {
  const user = req.user;
  if (!user) {
    res.status(404).send('User not found');
    return;
  }
  res.send(`Viewing user  + ${user.name}`);
}

export const editUser = ({req, res}: ViewProps) => {
  const user = req.user;
  if (!user) {
    res.status(404).send('User not found');
    return;
  }
  res.send('Editing user ' + user.name);
}

export const deleteUser = ({req, res}: ViewProps) => {
  const user = req.user;
  if (!user) {
    res.status(404).send('User not found');
    return;
  }
  res.send('Deleted user ' + user.name);
}

export const showDelay = ({req, res}: ViewProps) =>{
  res.send('Response delayed by seconds: ' + req.delaySeconds);
}

export const showStatus = ({req, res}: ViewProps) => {
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

export const notFound = ({req, res}: ViewProps) => {
  res.status(404).send('Nothing here')
};