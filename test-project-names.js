#!/usr/bin/env node

/**
 * Test script to validate project names are correctly displayed
 * instead of "Unnamed Project"
 */

const http = require('http');

async function testProjectNames() {
  console.log('🧪 Testing Project Names Fix...\n');

  try {
    // Test projects API
    console.log('1. Testing /api/projects endpoint...');
    const projectsData = await makeRequest('http://localhost:3000/api/projects');

    if (!projectsData.projects || !Array.isArray(projectsData.projects)) {
      throw new Error('Invalid projects data structure');
    }

    const sampleProjects = projectsData.projects.slice(0, 5);
    console.log(`   Found ${projectsData.projects.length} total projects`);
    console.log(`   Method: ${projectsData.method}`);

    console.log('\n   Sample project names:');
    sampleProjects.forEach((project, index) => {
      // Use same logic as our fixed components
      const projectName = project.attributes?.name || project.name || 'Unnamed Project';
      const isFixed = projectName !== 'Unnamed Project';
      const status = isFixed ? '✅' : '❌';

      console.log(`   ${status} Project ${index + 1}: "${projectName}"`);

      if (!isFixed) {
        console.log(`       Raw data: name="${project.name}", attributes.name="${project.attributes?.name}"`);
      }
    });

    // Test agents API (which should group by project names)
    console.log('\n2. Testing /api/agents endpoint for project grouping...');
    const agentsData = await makeRequest('http://localhost:3000/api/agents');

    if (!agentsData.byProject || typeof agentsData.byProject !== 'object') {
      throw new Error('Invalid agents byProject data structure');
    }

    const projectNames = Object.keys(agentsData.byProject);
    const namedProjects = projectNames.filter(name => name !== 'Unnamed Project');

    console.log(`   Total project groups: ${projectNames.length}`);
    console.log(`   Named projects: ${namedProjects.length}`);
    console.log(`   Unnamed projects: ${projectNames.length - namedProjects.length}`);

    console.log('\n   Project names from agent grouping:');
    projectNames.slice(0, 5).forEach(name => {
      const status = name !== 'Unnamed Project' ? '✅' : '❌';
      const agentCount = agentsData.byProject[name].length;
      console.log(`   ${status} "${name}" (${agentCount} agents)`);
    });

    // Summary
    const totalProjectsChecked = sampleProjects.length;
    const namedProjectsFromAPI = sampleProjects.filter(p =>
      (p.attributes?.name || p.name) && (p.attributes?.name || p.name) !== 'Unnamed Project'
    ).length;

    console.log('\n📊 Results Summary:');
    console.log(`   ✅ Projects API working: ${projectsData.method === 'direct_api' ? 'Yes' : 'No'}`);
    console.log(`   ✅ Named projects from API: ${namedProjectsFromAPI}/${totalProjectsChecked}`);
    console.log(`   ✅ Agent grouping working: ${namedProjects.length}/${projectNames.length} named`);

    if (namedProjectsFromAPI === totalProjectsChecked && namedProjects.length > 0) {
      console.log('\n🎉 SUCCESS: Project names are working correctly!');
      return true;
    } else {
      console.log('\n⚠️  PARTIAL: Some projects may still show as unnamed');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = '';

      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    });

    request.on('error', reject);
    request.setTimeout(10000, () => {
      reject(new Error('Request timeout'));
    });
  });
}

// Run the test
if (require.main === module) {
  testProjectNames().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testProjectNames };