#!/bin/bash

# CodeAudit Demo Script
# Runs a complete audit demonstration

echo "🚀 CodeAudit Demo Starting..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "${BLUE}[1/5]${NC} Checking backend status..."
if curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend is running"
else
    echo -e "${YELLOW}⚠${NC} Backend not running. Starting..."
    cd backend && npm run dev &
    sleep 5
fi

echo ""
echo -e "${BLUE}[2/5]${NC} Checking MCP tool servers..."
if curl -s http://localhost:8081/health > /dev/null; then
    echo -e "${GREEN}✓${NC} CodeAnalysis MCP running"
else
    echo -e "${YELLOW}⚠${NC} MCP tools not running. Please start them manually."
    echo "  cd backend/mcp-tools && npm run start:all"
    exit 1
fi

echo ""
echo -e "${BLUE}[3/5]${NC} Creating demo repository..."
# Create a sample vulnerable repository
mkdir -p /tmp/demo-repo/auth
cat > /tmp/demo-repo/auth/login.js << 'EOF'
// Vulnerable login endpoint
async function login(username, password) {
  // SQL Injection vulnerability
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  const user = await db.query(query);
  return user;
}

module.exports = { login };
EOF

cat > /tmp/demo-repo/config.js << 'EOF'
// Hardcoded secrets
module.exports = {
  stripeKey: 'sk_test_51234567890abcdef',
  awsAccessKey: 'AKIAIOSFODNN7EXAMPLE',
  dbPassword: 'super_secret_password_123'
};
EOF

cat > /tmp/demo-repo/package.json << 'EOF'
{
  "name": "demo-app",
  "version": "1.0.0",
  "dependencies": {
    "jsonwebtoken": "0.8.2",
    "lodash": "4.17.15",
    "express": "4.17.1"
  }
}
EOF

echo -e "${GREEN}✓${NC} Demo repository created at /tmp/demo-repo"

echo ""
echo -e "${BLUE}[4/5]${NC} Starting audit..."

# Trigger audit via API
RESPONSE=$(curl -s -X POST http://localhost:4000/api/audits \
  -H "Content-Type: application/json" \
  -d '{"repoPath": "/tmp/demo-repo", "options": {"frameworks": ["PCI-DSS"]}}')

SESSION_ID=$(echo $RESPONSE | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
    echo -e "${YELLOW}⚠${NC} Failed to start audit"
    echo "Response: $RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓${NC} Audit started: Session ID = $SESSION_ID"

echo ""
echo -e "${BLUE}[5/5]${NC} Monitoring audit progress..."
echo ""

# Poll for status
for i in {1..30}; do
    STATUS=$(curl -s http://localhost:4000/api/audits/$SESSION_ID | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    
    if [ "$STATUS" = "completed" ]; then
        echo -e "${GREEN}✓${NC} Audit completed!"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo -e "${YELLOW}⚠${NC} Audit failed"
        break
    else
        echo "  Status: $STATUS (${i}s elapsed)"
        sleep 2
    fi
done

echo ""
echo "📊 Fetching results..."
echo ""

# Get results
RESULTS=$(curl -s http://localhost:4000/api/audits/$SESSION_ID)
echo "$RESULTS" | jq '.'

echo ""
echo "🔍 Execution Trace:"
echo ""
TRACE=$(curl -s http://localhost:4000/api/audits/$SESSION_ID/trace)
echo "$TRACE" | jq '.spans[] | {component, action, duration}'

echo ""
echo -e "${GREEN}✅ Demo Complete!${NC}"
echo ""
echo "View full results:"
echo "  Dashboard: http://localhost:3000/audit/$SESSION_ID"
echo "  API: http://localhost:4000/api/audits/$SESSION_ID"
echo "  Trace: http://localhost:4000/api/audits/$SESSION_ID/trace"
