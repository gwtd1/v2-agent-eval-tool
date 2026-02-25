#!/usr/bin/env node

/**
 * Project Inspector CLI Tool
 * Usage: npm run inspect-projects [options]
 *
 * Quick command-line tool to inspect TD LLM projects and agents
 * using the new API client from Feature #1.
 */

const https = require('https');
const { URL } = require('url');

// Load environment variables
require('dotenv').config();

/**
 * Simple HTTP client for API calls
 */
async function makeApiCall(endpoint) {
  const baseUrl = process.env.TD_LLM_BASE_URL || 'https://llm-api.us01.treasuredata.com';
  const apiKey = process.env.TD_API_KEY;

  if (!apiKey) {
    throw new Error('TD_API_KEY environment variable is required');
  }

  const url = new URL(endpoint, baseUrl);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `TD1 ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'User-Agent': 'agent-eval-tool-cli/1.0.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${parsed.error?.message || data}`));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Fetch projects and agents in parallel
 */
async function fetchProjectsAndAgents() {
  console.log('🔍 Inspecting TD LLM Projects via API...\n');
  const startTime = Date.now();

  try {
    // Parallel API calls for optimal performance
    const [projectsResponse, agentsResponse] = await Promise.all([
      makeApiCall('/api/projects'),
      makeApiCall('/api/agents')
    ]);

    const projects = projectsResponse.data || [];
    const agents = agentsResponse.data || [];

    const duration = Date.now() - startTime;

    // Enhance projects with agent details
    const projectDetails = projects.map(project => {
      const projectAgents = agents.filter(agent => agent.project_id === project.id);
      return {
        ...project,
        agentCount: projectAgents.length,
        agents: projectAgents
      };
    });

    // Sort by agent count (most agents first)
    projectDetails.sort((a, b) => b.agentCount - a.agentCount);

    return {
      projects: projectDetails,
      agents,
      duration,
      totalProjects: projects.length,
      totalAgents: agents.length
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    throw new Error(`Failed to fetch project data after ${duration}ms: ${error.message}`);
  }
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return 'Invalid';
  }
}

/**
 * Display projects in table format
 */
function displayTable(projects) {
  // Prepare table data
  const tableData = projects.map(project => ({
    'Name': project.name.length > 30 ? project.name.substring(0, 27) + '...' : project.name,
    'ID': project.id.substring(0, 8) + '...',
    'Agents': project.agentCount.toString(),
    'Created': formatDate(project.created_at),
    'Description': project.description
      ? (project.description.length > 40 ? project.description.substring(0, 37) + '...' : project.description)
      : 'No description'
  }));

  console.table(tableData);
}

/**
 * Display projects in detailed list format
 */
function displayDetailed(projects) {
  projects.forEach((project, index) => {
    console.log(`\n${index + 1}. ${project.name}`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Agents: ${project.agentCount}`);
    console.log(`   Created: ${formatDate(project.created_at)}`);

    if (project.description) {
      console.log(`   Description: ${project.description}`);
    }

    if (project.agentCount > 0) {
      console.log(`   Agent Names: ${project.agents.map(a => a.name).join(', ')}`);
    }

    console.log(`   ${'─'.repeat(60)}`);
  });
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'table';
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    console.log(`
Project Inspector CLI Tool

Usage: npm run inspect-projects [options]

Options:
  --format=table     Display projects in table format (default)
  --format=list      Display projects in detailed list format
  --format=json      Display raw JSON data
  --help, -h         Show this help message

Examples:
  npm run inspect-projects
  npm run inspect-projects -- --format=list
  npm run inspect-projects -- --format=json

Environment Variables Required:
  TD_API_KEY          Your Treasure Data API key
  TD_LLM_BASE_URL     TD LLM API base URL (optional)
    `);
    return;
  }

  try {
    const data = await fetchProjectsAndAgents();

    // Display summary
    console.log(`📊 Summary:`);
    console.log(`   Total Projects: ${data.totalProjects}`);
    console.log(`   Total Agents: ${data.totalAgents}`);
    console.log(`   Active Projects: ${data.projects.filter(p => p.agentCount > 0).length}`);
    console.log(`   API Response Time: ${data.duration}ms`);
    console.log(`   Performance: ${data.duration < 300 ? '⚡ Fast (3-5x improvement)' : '🐌 Slow (consider using API optimization)'}`);

    if (data.projects.length === 0) {
      console.log('\n⚠️  No projects found. Check your API key permissions.');
      return;
    }

    console.log('\n📂 Projects:\n');

    switch (format) {
      case 'json':
        console.log(JSON.stringify(data, null, 2));
        break;

      case 'list':
        displayDetailed(data.projects);
        break;

      case 'table':
      default:
        displayTable(data.projects);
        break;
    }

    console.log(`\n✅ Inspection completed in ${data.duration}ms`);
    console.log(`💡 Use the web interface at /projects for a richer experience`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);

    console.log('Troubleshooting:');
    console.log('  1. Verify TD_API_KEY is set correctly');
    console.log('  2. Check TD_LLM_BASE_URL configuration');
    console.log('  3. Ensure your API key has project access permissions');
    console.log('  4. Verify network connectivity to Treasure Data API\n');

    process.exit(1);
  }
}

// Run the CLI tool
if (require.main === module) {
  main();
}

module.exports = { fetchProjectsAndAgents, makeApiCall };