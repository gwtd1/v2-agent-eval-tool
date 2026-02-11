import type { EvaluatorInput } from './types';

/**
 * Format the evaluation prompt for the LLM judge.
 * This prompt instructs the evaluator agent to assess the agent's response
 * against the given criteria.
 */
export function formatEvaluationPrompt(input: EvaluatorInput): string {
  return `You are evaluating an AI agent's response. Please analyze the following conversation and determine if the agent's response meets the evaluation criteria.

## Test Name
${input.testName}

## Evaluation Criteria
${input.criteria}

## Conversation History
${input.conversationHistory}

## Instructions
Based on the conversation above and the evaluation criteria, provide your assessment in the following JSON format:

\`\`\`json
{
  "verdict": "pass" or "fail",
  "reasoning": "Your detailed explanation of why the response passes or fails the criteria"
}
\`\`\`

Be thorough in your reasoning. Consider:
1. Does the response directly address the user's query?
2. Is the information accurate and relevant?
3. Does it meet the specific criteria outlined above?
4. Are there any issues with the response that would cause it to fail?

Provide your evaluation now.`;
}

/**
 * Parse the evaluator's response to extract verdict and reasoning.
 * Handles various response formats with fallbacks.
 */
export function parseEvaluatorResponse(content: string): { verdict: 'pass' | 'fail'; reasoning: string } {
  // Try to extract JSON from the response
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      const verdict = parsed.verdict?.toLowerCase() === 'pass' ? 'pass' : 'fail';
      const reasoning = parsed.reasoning || 'No reasoning provided';
      return { verdict, reasoning };
    } catch {
      // JSON parsing failed, continue to fallback
    }
  }

  // Try to find JSON without code blocks
  const jsonObjectMatch = content.match(/\{[\s\S]*"verdict"[\s\S]*"reasoning"[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      const parsed = JSON.parse(jsonObjectMatch[0]);
      const verdict = parsed.verdict?.toLowerCase() === 'pass' ? 'pass' : 'fail';
      const reasoning = parsed.reasoning || 'No reasoning provided';
      return { verdict, reasoning };
    } catch {
      // JSON parsing failed, continue to fallback
    }
  }

  // Fallback: Try to infer verdict from text
  const lowerContent = content.toLowerCase();
  const hasPass = lowerContent.includes('verdict: pass') ||
                  lowerContent.includes('verdict": "pass') ||
                  lowerContent.includes('passes the criteria') ||
                  lowerContent.includes('meets the criteria');

  const hasFail = lowerContent.includes('verdict: fail') ||
                  lowerContent.includes('verdict": "fail') ||
                  lowerContent.includes('fails the criteria') ||
                  lowerContent.includes('does not meet');

  // Default to fail if we can't determine
  const verdict = hasPass && !hasFail ? 'pass' : 'fail';

  return {
    verdict,
    reasoning: content.trim() || 'Unable to parse evaluator response',
  };
}
