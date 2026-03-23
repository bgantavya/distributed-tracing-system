import express from 'express';
import { config } from 'dotenv';
import { traceRequest } from './src/tracer.js';
import { Paths, AppRequest } from './src/utils.js';
import { showLogs, testResults, delayRes } from './src/fns.js';

config();
const app = express();
const PORT = Number(process.env.PORT) || 1234;

app.use(traceRequest);
app.get('/', (req, res) => res.send('Server is Working!'));

app.all(Paths.test(), testResults)
app.all(Paths.delay(), delayRes,(req: AppRequest, res)=> res.send('Response delayed by seconds: ' + req.params.t));
app.all(Paths.status(), (req: AppRequest, res) => res.status(+req.params.code).send('Status set to ' + req.params.code));

app.get(Paths.logs(), showLogs);
app.use((req, res) => res.status(404).send('Nothing here'));

app.listen(PORT, (err) => {
  if (err) {
    console.log("but bhai, I tried!");
    return;
  }
  console.log('Server running at: ' + PORT);
});