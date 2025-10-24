import { GoogleGenAI, Type } from "@google/genai";
import { Scenario, DialogueNode, AiSuggestion, DialogueOption } from '../types';

if (!process.env.API_KEY) {
  // A placeholder check. The actual key is expected to be in the environment.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper function to find the parent node and triggering option
function findParentNodeAndOption(scenario: Scenario, childNodeId: string): { parentNode: DialogueNode, triggeringOption: DialogueOption } | null {
    for (const node of scenario.nodes) {
        for (const option of node.options) {
            if (option.nextNodeId === childNodeId) {
                return { parentNode: node, triggeringOption: option };
            }
        }
    }
    return null;
}

function buildBasePrompt(scenario: Scenario, specificContext?: string): string {
    const globalContext = scenario.globalContext ? `
    Global Instructions for the entire scenario:
    ${scenario.globalContext}
    ` : '';

    const turnContext = specificContext ? `
    Specific Instructions for this turn:
    ${specificContext}
    ` : '';

    return `
    You are an expert scriptwriter for customer service training scenarios. Your goal is to create realistic and coherent dialogue.

    Scenario Title: ${scenario.title}
    Scenario Goal: ${scenario.description}
    
    Characters:
    - Agent: ${scenario.speaker1Name}
    - Customer: ${scenario.speaker2Name}
    ${globalContext}
    ${turnContext}
    `;
}

function buildAgentPrompt(scenario: Scenario, currentNodeId: string, specificContext?: string): string {
    const parentInfo = findParentNodeAndOption(scenario, currentNodeId);
    
    let conversationContext = "The conversation is just starting. The agent needs to give an opening line and choices.";
    if (parentInfo) {
        conversationContext = `The customer, ${scenario.speaker2Name}, just said: "${parentInfo.parentNode.dialogue}".`;
    }

    const basePrompt = buildBasePrompt(scenario, specificContext);

    return `${basePrompt}
    Conversation Context:
    ${conversationContext}
    
    Based on all the information above, generate the Agent's (${scenario.speaker1Name}) turn. The turn MUST consist of two parts that flow together logically:

    1.  A "Lead-In Dialogue": This is a brief, introductory statement or acknowledgement. It should set up the choices but NOT ask the main question itself. It is what the agent says *before* presenting the options. For example: "I understand, I can certainly look into that for you." or "Okay, thank you for providing that information."

    2.  "Actionable Choices": Generate 2 to 3 distinct, alternative full-sentence responses that the agent could say *immediately after* the lead-in dialogue. These are the choices the learner will make. Each choice should be a complete, ready-to-use sentence that continues the conversation, often by asking for information or proposing an action.

    The dialogue and options must flow together as a single, coherent turn for the agent.
    
    Return ONLY a JSON object matching the specified schema. Do not include any other text or markdown.
    `;
}


function buildCustomerPrompt(scenario: Scenario, currentNodeId: string, specificContext?: string): string {
    const currentNode = scenario.nodes.find(n => n.id === currentNodeId);
    if (!currentNode) throw new Error("Current node not found");

    const parentInfo = findParentNodeAndOption(scenario, currentNodeId);
    
    let conversationContext = `The agent, ${scenario.speaker1Name}, just said: "${parentInfo?.parentNode.dialogue}" and chose the response: "${parentInfo?.triggeringOption.text}".`;
    
    if (!parentInfo) {
        if(currentNode.isStartNode && currentNode.speaker === 2) {
            conversationContext = `The conversation is just beginning. The customer, ${scenario.speaker2Name}, is initiating the conversation with the goal of: "${scenario.description}".`;
        } else {
            conversationContext = "The agent just finished their turn."; // Fallback
        }
    }

    const basePrompt = buildBasePrompt(scenario, specificContext);

    return `${basePrompt}
    Conversation Context:
    ${conversationContext}
    
    Based on all the information above, generate a natural and relevant response for the Customer (${scenario.speaker2Name}). The response should be just the dialogue text.
    
    Return ONLY a JSON object matching the specified schema. Do not include any other text or markdown.
    `;
}

export async function suggestAgentResponse(scenario: Scenario, currentNodeId:string, specificContext?: string): Promise<AiSuggestion> {
    const prompt = buildAgentPrompt(scenario, currentNodeId, specificContext);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        dialogue: {
                            type: Type.STRING,
                            description: `The introductory, lead-in statement for the agent, ${scenario.speaker1Name}. This should NOT be a question, but a statement that sets up the options.`,
                        },
                        options: {
                            type: Type.ARRAY,
                            description: "An array of 2-3 distinct, full-sentence alternative choices the agent could say immediately after the lead-in dialogue. These are the actions or questions.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["dialogue", "options"],
                },
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (typeof result.dialogue === 'string' && Array.isArray(result.options)) {
            return { dialogue: result.dialogue, options: result.options };
        } else {
            throw new Error("AI response does not match the expected format.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate dialogue suggestion from the AI model.");
    }
}

export async function suggestCustomerResponse(scenario: Scenario, currentNodeId: string, specificContext?: string): Promise<AiSuggestion> {
  const prompt = buildCustomerPrompt(scenario, currentNodeId, specificContext);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogue: {
              type: Type.STRING,
              description: `The suggested line of dialogue for the customer, ${scenario.speaker2Name}.`,
            },
          },
          required: ["dialogue"],
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    
    if (typeof result.dialogue === 'string') {
        return { dialogue: result.dialogue };
    } else {
        throw new Error("AI response does not match the expected format.");
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate dialogue suggestion from the AI model.");
  }
}