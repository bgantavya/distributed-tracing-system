#!/bin/bash

# Analyze Traces by Service
# Groups and analyzes traces by service name

SERVICE_NAME="${1:-distributed-tracing-service}"
START_DATE="${2:-$(date -d '24 hours ago' +%Y-%m-%dT%H:%M:%S)}"
END_DATE="${3:-$(date +%Y-%m-%dT%H:%M:%S)}"

API_URL="${API_URL:-http://localhost:3000}"

echo "=== Service Trace Analysis ==="
echo "Service: $SERVICE_NAME"
echo "Time Range: $START_DATE to $END_DATE"
echo ""

echo "--- Fetching traces for service ---"
curl -s "$API_URL/api/traces/service/$SERVICE_NAME?startDate=$START_DATE&endDate=$END_DATE" | jq '.spans | length' 2>/dev/null || echo "0 traces"

echo ""
echo "--- Statistics ---"
curl -s "$API_URL/api/traces/stats?serviceName=$SERVICE_NAME&startDate=$START_DATE&endDate=$END_DATE" | jq '.stats' 2>/dev/null || echo "No stats available"

echo ""
echo "--- Slow Traces (>1s) ---"
curl -s "$API_URL/api/traces/slow?threshold=1000" | jq '.traces | map(select(.serviceName == "'$SERVICE_NAME'")) | .[:5]' 2>/dev/null || echo "No slow traces"

echo ""
echo "=== Analysis Complete ==="
