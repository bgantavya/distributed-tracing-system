#!/bin/bash

# Trace Correlation Script
# Correlates traces across services using trace IDs

TRACE_ID=$1

if [ -z "$TRACE_ID" ]; then
  echo "Usage: $0 <trace-id>"
  echo "Example: $0 abc123def456"
  exit 1
fi

API_URL="${API_URL:-http://localhost:3000}"

echo "=== Correlating Trace: $TRACE_ID ==="
echo ""

echo "--- Trace Details ---"
curl -s "$API_URL/api/traces/trace/$TRACE_ID" | jq '.trace[]' 2>/dev/null || echo "Failed to fetch trace details"

echo ""
echo "--- Slow Traces (for comparison) ---"
curl -s "$API_URL/api/traces/slow?threshold=1000" | jq '.traces[:5]' 2>/dev/null || echo "No slow traces found"

echo ""
echo "--- Error Traces (for comparison) ---"
curl -s "$API_URL/api/traces/errors" | jq '.traces[:5]' 2>/dev/null || echo "No error traces found"

echo ""
echo "=== Correlation Complete ==="
