#!/bin/bash

# Process Trace Analyzer
# Groups and analyzes traces by Process ID (PID)

PID=$1

if [ -z "$PID" ]; then
  echo "Usage: $0 <process-id>"
  echo "Example: $0 12345"
  exit 1
fi

API_URL="${API_URL:-http://localhost:3000}"

echo "=== Process Trace Analysis ==="
echo "Process ID: $PID"
echo ""

echo "--- Traces from Process $PID ---"
curl -s "$API_URL/api/traces/process/$PID" | jq '.spans' 2>/dev/null || echo "No traces found for process $PID"

echo ""
echo "=== Analysis Complete ==="
