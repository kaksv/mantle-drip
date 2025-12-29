# Drip Smart Contracts

Smart contracts for the Drip payment streaming and subscription platform on Celo.

## Overview

Drip enables programmable, real-time payment streams and recurring subscriptions for stablecoins on the Celo network. The contracts are built with Solidity ^0.8.20 and follow security best practices.

## Project Structure

```
contracts/
├── interfaces/
│   ├── IDrip.sol              # Core streaming interface
│   ├── ISubscription.sol      # Subscription management interface
│   └── IERC20.sol             # ERC20 token interface
├── libraries/
│   └── DripTypes.sol          # Shared data structures and types
├── utils/
│   └── TokenHelper.sol        # Token transfer utilities (native & ERC20)
└── Lock.sol                   # Example contract (to be removed)

test/
├── Drip.test.ts               # Main test suite
├── fixtures/
│   └── DripFixture.ts         # Test deployment fixtures
└── helpers/
    └── TestHelpers.ts          # Test utility functions

ignition/
└── modules/
    └── Drip.ts                 # Deployment module
```

## Contracts

### Interfaces

- **IDrip**: Defines the interface for payment streaming functionality
  - Stream creation, management, and withdrawal
  - Per-second rate calculation
  - Stream status management (active, paused, cancelled)

- **ISubscription**: Defines the interface for recurring subscription payments
  - Subscription creation with flexible cadences
  - Automatic payment execution
  - Payment history tracking

- **IERC20**: Minimal ERC20 interface for token interactions

### Libraries

- **DripTypes**: Shared data structures including:
  - PaymentSchedule
  - TreasuryConfig
  - Error codes

- **TokenHelper**: Utility library for handling both native CELO and ERC20 tokens
  - Safe transfer functions
  - Balance queries
  - Token validation

## Supported Tokens

- **Native CELO**: Native blockchain currency
- **cUSD**: Celo Dollar stablecoin
- **USDC**: USD Coin on Celo
- **USDT**: Tether on Celo

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
pnpm install
```

### Compile Contracts

```bash
pnpm compile
```

### Run Tests

```bash
pnpm test
```

### Deploy Contracts

#### Local Network
```bash
pnpm deploy
```

#### Celo Alfajores Testnet
```bash
pnpm deploy:alfajores
```

#### Celo Sepolia Testnet
```bash
pnpm deploy:sepolia
```

#### Celo Mainnet
```bash
pnpm deploy:celo
```

### Environment Variables

Create a `.env` file in the contracts directory:

```env
PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_here
```

## Network Configuration

The project is configured for the following Celo networks:

- **Celo Mainnet**: Chain ID 42220
- **Celo Alfajores Testnet**: Chain ID 44787
- **Celo Sepolia Testnet**: Chain ID 11142220
- **Localhost**: Chain ID 31337

## Security

- Contracts use OpenZeppelin libraries for security patterns
- Solidity version ^0.8.20 with compiler optimizations enabled
- Comprehensive test coverage (target: >90%)
- Security audits planned before mainnet deployment

## Documentation

All contracts include NatSpec documentation. Generate documentation:

```bash
# Documentation is embedded in contract source files
# View in your IDE or generate with solc --userdoc/--devdoc
```

## Milestones

- ✅ **Milestone 1**: Project Foundation & Smart Contract Architecture (Current)
- ⏳ **Milestone 2**: Core Smart Contracts (Streaming & Subscriptions)
- ⏳ **Milestone 3**: Frontend Foundation & Wallet Integration
- ⏳ **Milestone 4**: User Interfaces (Streaming & Subscriptions)
- ⏳ **Milestone 5**: Treasury Management, Advanced Features & Production Readiness

## License

MIT
