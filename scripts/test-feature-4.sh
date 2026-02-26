#!/bin/bash

# Feature #4 Testing Script - API Key Configuration Popup
# This script helps test the implemented API key setup modal

echo "🚀 Feature #4: API Key Configuration Popup - Testing Guide"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}1. Testing New User Experience${NC}"
echo "   - Clear localStorage: Open DevTools → Application → Local Storage → Clear All"
echo "   - Remove .env.local file to simulate fresh install"
echo "   - Setup modal should appear automatically"

echo ""
echo -e "${BLUE}2. Testing API Key Validation${NC}"
echo "   - Try invalid API key format (not starting with '1/')"
echo "   - Try empty API key"
echo "   - Try valid format but wrong key"
echo "   - Try valid working API key"

echo ""
echo -e "${BLUE}3. Testing Connection Flow${NC}"
echo "   - Test different regions (US Prod/Staging/Dev)"
echo "   - Verify connection test with real TD API key"
echo "   - Check error handling for network issues"

echo ""
echo -e "${BLUE}4. Testing Storage Options${NC}"
echo "   - Test saving to localStorage only"
echo "   - Test creating .env.local file"
echo "   - Test 'skip future prompts' functionality"

echo ""
echo -e "${BLUE}5. Manual Test Commands${NC}"
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}Error: Please run this script from the feature-4-api-key-popup directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Start Development Server:${NC}"
echo "npm run dev"
echo ""

echo -e "${YELLOW}Clear All Setup Data (Reset for testing):${NC}"
echo "# In browser console:"
echo "localStorage.removeItem('td_api_key')"
echo "localStorage.removeItem('setup_completed')"
echo "localStorage.removeItem('skip_setup')"
echo ""

echo -e "${YELLOW}Simulate Different Environment Conditions:${NC}"
echo "# Remove .env.local to test fresh install:"
echo "rm -f .env.local"
echo ""

echo -e "${YELLOW}Check Setup Status via API:${NC}"
echo "curl http://localhost:3001/api/config/check-env"
echo ""

echo -e "${YELLOW}Test Connection API Directly:${NC}"
echo 'curl -X POST http://localhost:3001/api/config/test-connection \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d '"'"'{"apiKey":"1/your_test_key","baseUrl":"https://llm-api.us01.treasuredata.com"}'"'"
echo ""

echo -e "${GREEN}✅ Feature Implementation Status:${NC}"
echo "   • API Key Setup Modal: COMPLETE"
echo "   • Environment Detection: COMPLETE"
echo "   • Connection Testing: COMPLETE"
echo "   • Storage Management: COMPLETE"
echo "   • Multi-step Wizard: COMPLETE"
echo "   • Error Handling: COMPLETE"
echo ""

echo -e "${GREEN}🎯 Ready for Integration!${NC}"
echo ""

echo "📖 For detailed implementation info, see:"
echo "   docs/FEATURE-4-IMPLEMENTATION-SUMMARY.md"
echo ""
echo "🌐 Test the feature at: http://localhost:3001"
echo "   (after running 'npm run dev')"