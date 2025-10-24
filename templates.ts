import { Scenario } from './types';

export const BLANK_SCENARIO: Scenario = {
  title: 'New Scenario',
  description: 'A blank canvas for your new conversation.',
  speaker1Name: 'Agent',
  speaker2Name: 'Customer',
  globalContext: '',
  nodes: [
    {
      id: 'start',
      nodeType: 'dialogue',
      speaker: 1,
      dialogue: 'This is the beginning of your scenario. Double-click to edit.',
      options: [],
      isStartNode: true,
      isEndNode: false,
      position: { x: 100, y: 150 },
    },
  ],
};

export const COMPLEX_EXAMPLE_SCENARIO: Scenario = {
  title: 'Customer Support - Billing Dispute',
  description: 'A training scenario for a support agent handling a customer who was unexpectedly overcharged.',
  speaker1Name: 'Support Agent',
  speaker2Name: 'Angry Customer',
  globalContext: 'The customer is very frustrated and believes they were overcharged. The agent must remain calm, empathetic, and follow company policy to de-escalate the situation and find a resolution.',
  nodes: [
    {
      id: 'start',
      nodeType: 'dialogue',
      speaker: 2,
      dialogue: "I can't believe this! My bill is double what it normally is. This is outrageous!",
      options: [{ id: 'opt_start', text: 'Continue', nextNodeId: 'agent_intro' }],
      isStartNode: true,
      isEndNode: false,
      position: { x: 50, y: 200 },
    },
    {
      id: 'agent_intro',
      nodeType: 'dialogue',
      speaker: 1,
      dialogue: "I understand your frustration, and I'm very sorry for the surprise on your bill. My name is Alex, and I want to help you sort this out.",
      options: [
        { id: 'opt_agent1', text: "Can you please provide me with your account number so I can look into this?", nextNodeId: 'customer_provides_info' },
        { id: 'opt_agent2', text: "I see the charge. It looks like you went over your data limit.", nextNodeId: 'customer_denies' }
      ],
      isStartNode: false,
      isEndNode: false,
      position: { x: 400, y: 100 },
    },
    {
        id: 'customer_provides_info',
        nodeType: 'dialogue',
        speaker: 2,
        dialogue: "Fine. My account number is 555-1234. Just fix it.",
        options: [{id: 'opt_cust_info', text: 'Continue', nextNodeId: 'agent_investigates'}],
        isStartNode: false,
        isEndNode: false,
        position: {x: 750, y: 50}
    },
    {
        id: 'agent_investigates',
        nodeType: 'dialogue',
        speaker: 1,
        dialogue: "Thank you. Let me pull that up... Okay, I see the issue. It seems there was a one-time charge for a premium service that was added last month. Sometimes these are added during a trial period and aren't cancelled.",
        options: [
            {id: 'opt_agent_invest1', text: "I can remove that service for you and apply a credit for the charge. Would that work?", nextNodeId: 'customer_accepts'},
            {id: 'opt_agent_invest2', text: "Since you used the service, I can't refund it, but I can remove it to prevent future charges.", nextNodeId: 'customer_escalates'}
        ],
        isStartNode: false,
        isEndNode: false,
        position: {x: 1100, y: -50}
    },
    {
        id: 'customer_accepts',
        nodeType: 'dialogue',
        speaker: 2,
        dialogue: "Yes, that would be great. Thank you for your help. I was really worried.",
        options: [{id: 'opt_cust_accept', text: 'Continue', nextNodeId: 'agent_resolution'}],
        isStartNode: false,
        isEndNode: false,
        position: {x: 1450, y: -100}
    },
    {
        id: 'agent_resolution',
        nodeType: 'dialogue',
        speaker: 1,
        dialogue: "You're very welcome. I've removed the service and the credit should appear on your next bill. Is there anything else I can help you with today?",
        options: [],
        isStartNode: false,
        isEndNode: true,
        position: {x: 1800, y: -100}
    },
    {
        id: 'customer_denies',
        nodeType: 'dialogue',
        speaker: 2,
        dialogue: "Data limit? No way. I'm always on Wi-Fi. Your system must be broken. This is not my fault!",
        options: [{id: 'opt_cust_denies', text: 'Continue', nextNodeId: 'coach_feedback_1'}],
        isStartNode: false,
        isEndNode: false,
        position: {x: 750, y: 300}
    },
    {
        id: 'coach_feedback_1',
        nodeType: 'coach',
        dialogue: "Coach: This is a critical point. Accusing the customer directly can make them defensive. It's better to investigate first before stating a cause. Try asking for the account number to investigate collaboratively.",
        options: [{id: 'opt_coach_1', text: 'Continue', nextNodeId: 'agent_intro'}],
        isStartNode: false,
        isEndNode: false,
        position: {x: 1100, y: 300}
    },
    {
        id: 'customer_escalates',
        nodeType: 'dialogue',
        speaker: 2,
        dialogue: "Unacceptable! I never agreed to that. I want to speak to your manager right now!",
        options: [{id: 'opt_cust_esc', text: 'Continue', nextNodeId: 'agent_escalates'}],
        isStartNode: false,
        isEndNode: false,
        position: {x: 1450, y: 100}
    },
    {
        id: 'agent_escalates',
        nodeType: 'dialogue',
        speaker: 1,
        dialogue: "I understand your frustration. I will transfer you to my supervisor immediately. Please hold.",
        options: [],
        isStartNode: false,
        isEndNode: true,
        position: {x: 1800, y: 100}
    }
  ],
};
