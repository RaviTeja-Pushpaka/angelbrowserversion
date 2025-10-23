// Credit costs for different operations
export const CREDIT_COSTS = {
  text: 1,      // Text chat response
  image: 4,     // Image analysis (4 credits)
  audio: 1,     // Audio transcription
  setup: 0      // Profile setup (free)
};

// Credit service functions
export const creditService = {
  // Calculate total cost for a request
  calculateCost: (type: keyof typeof CREDIT_COSTS) => {
    return CREDIT_COSTS[type] || 0;
  },

  // Check if user has enough credits
  hasEnoughCredits: (userCredits: number, cost: number) => {
    return userCredits >= cost;
  },

  // Deduct credits from user balance
  deductCredits: (userCredits: number, cost: number) => {
    return Math.max(0, userCredits - cost);
  }
};
