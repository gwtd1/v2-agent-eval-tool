interface GeneratedTestCase {
  name: string;
  user_input: string;
  criteria: string;
}

/**
 * Agent type detection based on name and prompt keywords.
 */
type AgentType = 'math' | 'language' | 'fact-check' | 'sentiment' | 'code' | 'qa' | 'animal' | 'general';

function detectAgentType(agentName: string, agentPrompt: string): AgentType {
  const combined = `${agentName} ${agentPrompt}`.toLowerCase();

  if (combined.includes('animal') || combined.includes('sound') && (combined.includes('woof') || combined.includes('meow'))) {
    return 'animal';
  }
  if (combined.includes('math') || combined.includes('calcul') || combined.includes('algebra') || combined.includes('equation')) {
    return 'math';
  }
  if (combined.includes('language') || combined.includes('translat') || combined.includes('detect language')) {
    return 'language';
  }
  if (combined.includes('fact') || combined.includes('verify') || combined.includes('check') && combined.includes('true')) {
    return 'fact-check';
  }
  if (combined.includes('sentiment') || combined.includes('emotion') || combined.includes('positive') && combined.includes('negative')) {
    return 'sentiment';
  }
  if (combined.includes('code') || combined.includes('programming') || combined.includes('debug') || combined.includes('function')) {
    return 'code';
  }
  if (combined.includes('question') || combined.includes('answer') || combined.includes('knowledge')) {
    return 'qa';
  }
  return 'general';
}

/**
 * Generate test cases based on detected agent type.
 */
function getTestCasesForType(agentType: AgentType): GeneratedTestCase[] {
  switch (agentType) {
    case 'math':
      return [
        {
          name: 'Solve linear equation',
          user_input: 'Solve for x: 2x + 5 = 15',
          criteria: 'Agent provides correct solution (x = 5) with step-by-step explanation',
        },
        {
          name: 'Calculate derivative',
          user_input: 'What is the derivative of x^2 + 3x?',
          criteria: 'Agent provides correct answer (2x + 3) with explanation of power rule',
        },
        {
          name: 'Word problem',
          user_input: 'A rectangle has length 8cm and width 5cm. What is its area and perimeter?',
          criteria: 'Agent calculates area (40 sq cm) and perimeter (26 cm) correctly',
        },
      ];

    case 'language':
      return [
        {
          name: 'Detect English',
          user_input: 'Hello, how are you today?',
          criteria: 'Agent correctly identifies the language as English',
        },
        {
          name: 'Detect Spanish',
          user_input: 'Buenos días, ¿cómo estás?',
          criteria: 'Agent correctly identifies the language as Spanish',
        },
        {
          name: 'Detect Japanese',
          user_input: 'こんにちは、元気ですか？',
          criteria: 'Agent correctly identifies the language as Japanese',
        },
      ];

    case 'fact-check':
      return [
        {
          name: 'Verify true fact',
          user_input: 'Is it true that water boils at 100 degrees Celsius at sea level?',
          criteria: 'Agent confirms this is true with scientific explanation',
        },
        {
          name: 'Verify false claim',
          user_input: 'The Great Wall of China is visible from the Moon with naked eye.',
          criteria: 'Agent identifies this as false and provides correct information',
        },
        {
          name: 'Check historical fact',
          user_input: 'Did World War II end in 1945?',
          criteria: 'Agent confirms this is true with relevant historical context',
        },
      ];

    case 'sentiment':
      return [
        {
          name: 'Analyze positive sentiment',
          user_input: 'I absolutely love this product! It exceeded all my expectations.',
          criteria: 'Agent identifies sentiment as positive',
        },
        {
          name: 'Analyze negative sentiment',
          user_input: 'This is the worst experience I have ever had. Completely disappointed.',
          criteria: 'Agent identifies sentiment as negative',
        },
        {
          name: 'Analyze neutral sentiment',
          user_input: 'The meeting is scheduled for 3pm tomorrow in the conference room.',
          criteria: 'Agent identifies sentiment as neutral',
        },
      ];

    case 'code':
      return [
        {
          name: 'Explain function',
          user_input: 'What does this code do? function add(a, b) { return a + b; }',
          criteria: 'Agent explains the function adds two numbers and returns the result',
        },
        {
          name: 'Fix bug',
          user_input: 'Why does this loop never end? while(i < 10) { console.log(i); }',
          criteria: 'Agent identifies that i is never incremented inside the loop',
        },
        {
          name: 'Write function',
          user_input: 'Write a function that checks if a number is even',
          criteria: 'Agent provides correct implementation using modulo operator',
        },
      ];

    case 'qa':
      return [
        {
          name: 'Answer factual question',
          user_input: 'What is the capital of France?',
          criteria: 'Agent correctly answers Paris',
        },
        {
          name: 'Explain concept',
          user_input: 'What is photosynthesis?',
          criteria: 'Agent explains the process of plants converting light to energy',
        },
        {
          name: 'Answer how-to question',
          user_input: 'How do I boil an egg?',
          criteria: 'Agent provides clear step-by-step instructions',
        },
      ];

    case 'animal':
      return [
        {
          name: 'Dog sound',
          user_input: 'Dog',
          criteria: 'Agent responds with dog sound like Woof or Bark',
        },
        {
          name: 'Cat sound',
          user_input: 'Cat',
          criteria: 'Agent responds with cat sound like Meow',
        },
        {
          name: 'Non-animal input',
          user_input: 'Table',
          criteria: 'Agent indicates this is not an animal',
        },
      ];

    default:
      return [
        {
          name: 'Basic capability test',
          user_input: 'What can you help me with?',
          criteria: 'Agent explains its capabilities clearly',
        },
        {
          name: 'Follow instructions',
          user_input: 'Please summarize this in one sentence: The quick brown fox jumps over the lazy dog.',
          criteria: 'Agent provides a concise summary',
        },
        {
          name: 'Handle clarification',
          user_input: 'Can you help me?',
          criteria: 'Agent asks for more details or explains how it can assist',
        },
      ];
  }
}

/**
 * Generate test cases for an agent based on its name and prompt.
 * Uses heuristic detection to create appropriate test cases.
 */
export async function generateTestCases(
  agentName: string,
  agentPrompt: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _apiKey: string
): Promise<GeneratedTestCase[]> {
  console.log(`[TestGenerator] Generating test cases for agent: ${agentName}`);

  const agentType = detectAgentType(agentName, agentPrompt);
  console.log(`[TestGenerator] Detected agent type: ${agentType}`);

  const testCases = getTestCasesForType(agentType);
  console.log(`[TestGenerator] Generated ${testCases.length} test cases`);

  return testCases;
}

/**
 * Format test cases as YAML content for test.yml file.
 */
export function formatTestCasesAsYaml(
  agentName: string,
  testCases: GeneratedTestCase[]
): string {
  const lines = [
    `# Test cases for ${agentName}`,
    `# Auto-generated based on agent prompt`,
    `# Documentation: https://tdx.treasuredata.com/commands/agent.html`,
    ``,
    `tests:`,
  ];

  for (const tc of testCases) {
    lines.push(`  - name: "${escapeYamlString(tc.name)}"`);
    lines.push(`    user_input: "${escapeYamlString(tc.user_input)}"`);
    lines.push(`    criteria: "${escapeYamlString(tc.criteria)}"`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Escape special characters in YAML strings.
 */
function escapeYamlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}
