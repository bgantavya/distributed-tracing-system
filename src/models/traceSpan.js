import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  message: { type: String },
  fields: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { _id: false });

const spanSchema = new mongoose.Schema({
  traceId: {
    type: String,
    required: true,
    index: true
  },
  spanId: {
    type: String,
    required: true,
    unique: true
  },
  parentSpanId: {
    type: String,
    default: null,
    index: true
  },
  serviceName: {
    type: String,
    required: true,
    index: true
  },
  processId: {
    type: Number,
    required: true,
    index: true
  },
  operationName: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    index: true
  },
  tags: [tagSchema],
  logs: [logSchema],
  status: {
    type: String,
    default: 'ok',
    index: true
  },
  httpStatusCode: {
    type: Number,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  samplingDecision: {
    type: Boolean,
    default: true
  },
  samplingReason: {
    type: String,
    default: 'sampled'
  },
  resource: {
    type: String,
    default: null
  },
  serviceVersion: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'spans'
});

spanSchema.index({ traceId: 1, startTime: -1 });
spanSchema.index({ serviceName: 1, status: 1, startTime: -1 });
spanSchema.index({ 'tags.key': 1, 'tags.value': 1 });

export default mongoose.model('TraceSpan', spanSchema);
