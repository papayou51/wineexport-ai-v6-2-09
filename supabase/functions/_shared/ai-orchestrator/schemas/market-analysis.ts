// Zod schemas for market analysis responses

export const MarketSizeSchema = {
  type: 'object',
  properties: {
    total_market_value: { type: 'string' },
    annual_growth_rate: { type: 'string' },
    market_segments: {
      type: 'array',
      items: { type: 'string' }
    },
    key_indicators: { type: 'string' }
  },
  required: ['total_market_value', 'annual_growth_rate', 'key_indicators']
};

export const CompetitiveLandscapeSchema = {
  type: 'object',
  properties: {
    main_competitors: {
      type: 'array',
      items: { type: 'string' }
    },
    market_share_distribution: { type: 'string' },
    competitive_advantages: {
      type: 'array',
      items: { type: 'string' }
    },
    barriers_to_entry: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['main_competitors', 'market_share_distribution']
};

export const PriceAnalysisSchema = {
  type: 'object',
  properties: {
    average_price_range: { type: 'string' },
    pricing_factors: {
      type: 'array',
      items: { type: 'string' }
    },
    recommended_pricing_strategy: { type: 'string' },
    price_sensitivity: { type: 'string' }
  },
  required: ['average_price_range', 'recommended_pricing_strategy']
};

export const DistributionChannelsSchema = {
  type: 'object',
  properties: {
    primary_channels: {
      type: 'array',
      items: { type: 'string' }
    },
    channel_effectiveness: { type: 'string' },
    distribution_costs: { type: 'string' },
    recommended_approach: { type: 'string' }
  },
  required: ['primary_channels', 'recommended_approach']
};

export const ConsumerPreferencesSchema = {
  type: 'object',
  properties: {
    key_preferences: {
      type: 'array',
      items: { type: 'string' }
    },
    buying_patterns: { type: 'string' },
    seasonal_trends: { type: 'string' },
    cultural_considerations: { type: 'string' }
  },
  required: ['key_preferences', 'buying_patterns']
};

export const MarketAnalysisSchema = {
  type: 'object',
  properties: {
    market_size: MarketSizeSchema,
    competitive_landscape: CompetitiveLandscapeSchema,
    price_analysis: PriceAnalysisSchema,
    distribution_channels: DistributionChannelsSchema,
    consumer_preferences: ConsumerPreferencesSchema,
    opportunities: {
      type: 'array',
      items: { type: 'string' }
    },
    risks: {
      type: 'array',
      items: { type: 'string' }
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          action: { type: 'string' },
          timeline: { type: 'string' },
          impact: { type: 'string' }
        },
        required: ['priority', 'action', 'timeline', 'impact']
      }
    }
  },
  required: [
    'market_size',
    'competitive_landscape', 
    'price_analysis',
    'distribution_channels',
    'consumer_preferences',
    'opportunities',
    'risks',
    'recommendations'
  ]
};