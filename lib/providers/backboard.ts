import { BackboardClient } from 'backboard-sdk';
import { Need } from '../types.ts';

// Initialize the Backboard Client (fails gracefully if API key is not provided yet)
export function getBackboardClient() {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) return null;
  return new BackboardClient({ apiKey });
}

// Tool Definition for extracting metadata
export const extractMetadataTool = {
  type: 'function',
  function: {
    name: 'extract_metadata',
    description: 'Extract urgency and pickup windows from a user request',
    parameters: {
      type: 'object',
      properties: {
        urgency: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'The urgency of the request. Defaults to medium if unspecified.'
        },
        pickupWindows: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['morning', 'afternoon', 'evening']
          },
          description: 'The preferred pickup windows mentioned by the user. E.g., morning, afternoon, evening.'
        }
      },
      required: ['urgency', 'pickupWindows']
    }
  }
};
