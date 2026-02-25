/**
 * Debug Script for Feature #4 API Key Setup Modal
 *
 * Copy and paste this into your browser console at http://localhost:3000
 * to debug why the setup modal isn't appearing.
 */

console.log('🔍 Debug: Feature #4 API Key Setup Modal');
console.log('=========================================');

// 1. Check localStorage for existing setup data
console.log('\n1. Checking localStorage:');
const tdApiKey = localStorage.getItem('td_api_key');
const setupCompleted = localStorage.getItem('setup_completed');
const skipSetup = localStorage.getItem('skip_setup');

console.log('  td_api_key:', tdApiKey ? '***FOUND***' : 'null');
console.log('  setup_completed:', setupCompleted);
console.log('  skip_setup:', skipSetup);

if (tdApiKey || setupCompleted === 'true' || skipSetup === 'true') {
    console.log('  🚨 ISSUE: localStorage contains setup data - modal won\'t show');
    console.log('  💡 SOLUTION: Clear localStorage to see the modal');
}

// 2. Check for environment variables via API
console.log('\n2. Checking environment variables:');
fetch('/api/config/check-env')
    .then(res => res.json())
    .then(data => {
        console.log('  Environment check result:', data);
        if (data.hasEnvKey) {
            console.log('  🚨 ISSUE: Environment variable TD_API_KEY is set - modal won\'t show');
            console.log('  💡 SOLUTION: Remove .env.local or unset TD_API_KEY');
        }
    })
    .catch(err => {
        console.log('  ❌ Failed to check environment:', err);
    });

// 3. Function to clear all setup data and force modal to appear
window.clearSetupData = function() {
    console.log('\n3. Clearing all setup data...');
    localStorage.removeItem('td_api_key');
    localStorage.removeItem('td_proxy_url');
    localStorage.removeItem('setup_completed');
    localStorage.removeItem('skip_setup');
    console.log('✅ Setup data cleared! Refresh the page to see the modal.');
    console.log('🔄 Run: location.reload()');
};

// 4. Function to force show modal (for testing)
window.forceShowModal = function() {
    console.log('\n4. Attempting to force show modal...');
    // Dispatch a custom event that the SetupContext can listen for
    window.dispatchEvent(new CustomEvent('forceShowSetupModal'));
    console.log('📢 Event dispatched. If modal still doesn\'t appear, there may be a React context issue.');
};

// 5. Check if React context is working
console.log('\n5. Checking React DevTools availability:');
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('  ✅ React DevTools detected');
    console.log('  💡 Check Components tab for SetupProvider and ApiKeySetupModal');
} else {
    console.log('  ⚠️  React DevTools not installed');
    console.log('  💡 Install React DevTools browser extension for better debugging');
}

// 6. Instructions
console.log('\n6. Quick Fix Instructions:');
console.log('  1. Run: clearSetupData()');
console.log('  2. Refresh the page: location.reload()');
console.log('  3. The setup modal should now appear');

console.log('\n🛠️  Available debug functions:');
console.log('  • clearSetupData() - Clear all localStorage setup data');
console.log('  • forceShowModal() - Attempt to force show the modal');

// Run automatic check
console.log('\n🔄 Running automatic check...');
if (!tdApiKey && setupCompleted !== 'true' && skipSetup !== 'true') {
    console.log('✅ localStorage looks good for showing modal');
} else {
    console.log('❌ localStorage preventing modal - run clearSetupData()');
}