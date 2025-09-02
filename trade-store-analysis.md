# TradeStore Analysis - Complete Breakdown

## Overview

The `TradeStore` is a MobX-based state management store that handles all trading-related functionality in the derivatives trading application. It manages contract types, symbols, barriers, proposals, purchases, and WebSocket communications.

## Core Architecture

### Store Structure

- **Base Class**: Extends `BaseStore` which provides common functionality
- **State Management**: Uses MobX observables, actions, and computed properties
- **Storage**: Integrates with localStorage and sessionStorage for persistence
- **WebSocket Integration**: Handles real-time data through WebSocket subscriptions

## Key State Categories

### 1. Control States

```typescript
// Component lifecycle and trading enablement
is_trade_component_mounted: boolean; // Component mount status
is_purchase_enabled: boolean; // Purchase button state
is_trade_enabled: boolean; // Trading availability (v1)
is_trade_enabled_v2: boolean; // Trading availability (v2)
is_equal: number; // Equal barrier option
has_equals_only: boolean; // Only equal contracts available
```

### 2. Symbol & Market States

```typescript
// Symbol management
symbol: string                        // Current trading symbol
previous_symbol: string               // Previous symbol for comparison
active_symbols: ActiveSymbols[]       // Available trading symbols
is_market_closed: boolean             // Market status
has_symbols_for_v2: boolean           // V2 symbols availability
```

### 3. Contract Type States

```typescript
// Contract configuration
contract_type: string; // Current contract type
prev_contract_type: string; // Previous contract type
contract_types_list: TContractTypesList; // Available contracts (v1)
contract_types_list_v2: TContractTypesList; // Available contracts (v2)
trade_type_tab: string; // Active trade type tab
```

### 4. Amount & Currency States

```typescript
// Financial parameters
amount: number; // Stake amount
basis: string; // Stake/payout basis
currency: string; // Trading currency
default_stake: number; // Default stake value
stake_boundary: TStakeBoundary; // Min/max stake limits
```

### 5. Duration & Expiry States

```typescript
// Time-based parameters
duration: number; // Contract duration
duration_unit: string; // Duration unit (m/h/d/t)
duration_min_max: TDurationMinMax; // Duration limits
expiry_date: string; // Expiry date
expiry_time: string; // Expiry time
expiry_type: string; // 'duration' or 'endtime'
start_date: number; // Start date (0 = now)
```

### 6. Barrier States

```typescript
// Barrier management
barrier_1: string                     // Primary barrier
barrier_2: string                     // Secondary barrier
barrier_count: number                 // Number of barriers
barriers: TBarriers[]                 // Chart barriers array
barrier_choices: string[]             // Available barrier options
main_barrier: ChartBarrierStore       // Main chart barrier
```

### 7. Proposal & Purchase States

```typescript
// Trading execution
proposal_info: TProposalInfo; // Proposal responses
purchase_info: BuyContractResponse; // Purchase response
proposal_requests: Record<string, PriceProposalRequest>; // Active proposals
is_purchasing_contract: boolean; // Purchase in progress
```

## WebSocket Integration

### 1. Proposal Subscriptions

```typescript
// Real-time price proposals
requestProposal() {
    const requests = createProposalRequests(this);
    Object.keys(requests).forEach(type => {
        WS.subscribeProposal(requests[type], this.onProposalResponse);
    });
}

onProposalResponse(response) {
    // Handles proposal updates
    // Updates barriers, validation, purchase enablement
}
```

### 2. Tick Data Subscriptions

```typescript
// Real-time tick data
wsSubscribe(req: TicksHistoryRequest, callback) {
    if (req.subscribe === 1) {
        const subscriber = WS.subscribeTicksHistory(req, callback);
        g_subscribers_map[key] = subscriber;
    }
}
```

### 3. Active Symbols & Contract Data

```typescript
// Market data fetching
async setActiveSymbols() {
    const { active_symbols, error } = await WS.authorized.activeSymbols();
    // Updates available trading symbols
}

async setContractTypes() {
    await Symbol.onChangeSymbolAsync(this.symbol);
    // Updates available contract types for symbol
}
```

## Key Functions & Methods

### 1. Lifecycle Management

```typescript
onMount() {
    // Component initialization
    // Sets up WebSocket listeners
    // Loads active symbols and contract types
    // Initializes trading state
}

onUnmount() {
    // Cleanup WebSocket subscriptions
    // Reset states
    // Clear contracts and proposals
}
```

### 2. State Updates

```typescript
async onChange(e) {
    // Handles form field changes
    // Validates inputs
    // Updates dependent states
    // Triggers new proposals
}

async onChangeMultiple(values) {
    // Batch state updates
    // Efficient for multiple related changes
}

updateStore(new_state) {
    // Core state update mechanism
    // Handles localStorage persistence
    // Manages state synchronization
}
```

### 3. Purchase Flow

```typescript
async onPurchaseV2(trade_type, isMobile, callback) {
    // V2 purchase flow
    // Waits for valid proposals
    // Handles CALL/PUT to HIGHER/LOWER mapping
    // Executes purchase
}

processPurchase(proposal_id, price, type) {
    // Core purchase logic
    // Handles purchase API call
    // Manages success/error states
    // Updates portfolio and notifications
}
```

### 4. Validation & Error Handling

```typescript
changeDurationValidationRules() {
    // Updates validation rules based on duration limits
    // Handles min/max duration constraints
}

onProposalResponse(response) {
    // Handles proposal errors
    // Updates validation messages
    // Manages barrier choices and stake boundaries
}
```

## Contract Type Specific Logic

### 1. Accumulator Contracts

```typescript
get is_accumulator() {
    return this.contract_type === TRADE_TYPES.ACCUMULATOR;
}

// Accumulator-specific states
growth_rate: number
maximum_payout: number
maximum_ticks: number
ticks_history_stats: object
```

### 2. Multiplier Contracts

```typescript
get is_multiplier() {
    return this.contract_type === TRADE_TYPES.MULTIPLIER;
}

// Multiplier-specific states
multiplier: number
stop_loss: string
take_profit: string
has_stop_loss: boolean
has_take_profit: boolean
commission: number
```

### 3. Turbos Contracts

```typescript
get is_turbos() {
    return isTurbosContract(this.contract_type);
}

// Turbos-specific states
long_barriers: TBarriersData
short_barriers: TBarriersData
payout_per_point: string
```

### 4. Vanilla Options

```typescript
get is_vanilla() {
    return isVanillaContract(this.contract_type);
}

// Vanilla-specific states
strike_price_choices: TBarriersData
```

## Event Listeners & Reactions

### 1. MobX Reactions

```typescript
// Symbol change reaction
reaction(
    () => this.symbol,
    () => {
        // Reset expiry dates for volatility indices
        // Update growth rate
        // Clear notifications
    }
);

// Contract type change reaction
reaction(
    () => [this.contract_type],
    () => {
        // Update portfolio contract type
        // Apply validation rules
        // Reset accumulator data
    }
);
```

### 2. WebSocket Event Listeners

```typescript
accountSwitcherListener() {
    // Handle account switching
    // Reload symbols and contract types
    // Update currency
}

logoutListener() {
    // Handle user logout
    // Clear contracts and proposals
    // Reset trading state
}

networkStatusChangeListener(is_online) {
    // Handle network connectivity
    // Enable/disable trading
}
```

## Chart Integration

### 1. Barrier Management

```typescript
setMainBarrier(proposal_info) {
    // Creates chart barriers
    // Handles draggable barriers
    // Updates barrier colors and styles
}

onChartBarrierChange(barrier_1, barrier_2) {
    // Handles barrier drag events
    // Updates proposal requests
}
```

### 2. Chart State Synchronization

```typescript
chartStateChange(state, option) {
    // Handles chart mode changes
    // Updates granularity and chart type
    // Manages market state changes
}

exportLayout(layout) {
    // Saves chart layout
    // Handles chart restoration
}
```

## URL Parameter Management

### 1. URL Synchronization

```typescript
setChartModeFromURL() {
    // Reads URL parameters
    // Sets chart type and granularity
    // Updates contract type from URL
}

// URL parameters handled:
// - symbol: Trading symbol
// - trade_type: Contract type
// - chart_type: Chart display type
// - granularity: Chart time interval
```

### 2. URL Validation

```typescript
// Validates URL parameters against available options
// Shows unavailable modal for invalid parameters
// Fallback to default values
```

## Mobile vs Desktop (V1 vs V2)

### 1. Version Detection

```typescript
get is_dtrader_v2() {
    // Simple device detection: V2 for mobile, V1 for desktop
    return this.root_store.ui.is_mobile;
}
```

### 2. Version-Specific Features

```typescript
// V2 specific states
v2_params_initial_values: TV2ParamsInitialValues;
saved_expiry_date_v2: string;
unsaved_expiry_date_v2: string;

// V2 specific methods
setV2ParamsInitialValues();
setSavedExpiryDateV2();
setUnsavedExpiryDateV2();
```

## Error Handling & Validation

### 1. Proposal Error Handling

```typescript
onProposalResponse(response) {
    if (response.error) {
        // Set validation error messages
        // Handle specific error codes
        // Update barrier choices from error details
        // Manage stake boundaries
    }
}
```

### 2. Purchase Error Handling

```typescript
processPurchase() {
    // Handle purchase errors
    // Show error notifications
    // Reset purchase state
    // Clear purchase info on mobile
}
```

## Performance Optimizations

### 1. Debounced Operations

```typescript
debouncedProposal = debounce(this.requestProposal, 500);
debouncedSetChartStatus = debounce(status => {
    this.is_chart_loading = status;
});
```

### 2. Conditional Updates

```typescript
updateStore(new_state) {
    // Only update changed values
    // Skip unnecessary re-renders
    // Optimize localStorage writes
}
```

## Integration Points

### 1. Root Store Dependencies

- `client`: User authentication and account data
- `ui`: UI state and modal management
- `portfolio`: Open positions and contract management
- `contract_trade`: Chart and contract execution
- `notifications`: Trade notifications and alerts

### 2. External Services

- WebSocket API for real-time data
- localStorage/sessionStorage for persistence
- GTM for analytics tracking
- Chart library for technical analysis

## Key Computed Properties

```typescript
// Market availability checks
get is_symbol_in_active_symbols()
get is_synthetics_available()
get is_synthetics_trading_market_available()

// Contract type checks
get is_accumulator()
get is_multiplier()
get is_turbos()
get is_vanilla()

// Barrier and chart data
get barrier_pipsize()
get barriers_flattened()
get main_barrier_flattened()

// Trading state
get has_open_accu_contract()
get show_digits_stats()
```

This TradeStore serves as the central hub for all trading operations, managing complex state interactions, real-time data flows, and user interactions while maintaining performance and reliability across different contract types and trading scenarios.
