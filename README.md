# 💧 Drip - Programmable Payment Streams on Mantle Testnet

**Drip** is a programmable payment streaming and recurring subscription platform built on Mantle, enabling real-time stablecoin payments with autonomous smart contract execution.

---

## 🎯 Mission Summary

**Our Mission:** To democratize programmable payments by enabling autonomous, transparent, and cost-effective payment streams and subscriptions on the Mantle blockchain.

**Vision:** A world where creators, collectives, and service platforms can automate continuous payouts and usage-based billing without the friction, costs, and delays of traditional payment systems.

**Core Values:**
- **Autonomy** - Smart contracts execute payments automatically, eliminating manual intervention
- **Transparency** - All transactions are on-chain, providing full auditability and trust
- **Accessibility** - Low gas costs and mobile-first design make programmable payments available to everyone
- **Efficiency** - Real-time streaming and automated subscriptions save time and reduce operational overhead
- **Innovation** - Leveraging blockchain technology to solve real-world payment challenges

**Impact:** Drip empowers treasury managers to automate payment distribution, enables creators to receive real-time payments, and provides service platforms with programmable billing infrastructure—all while maintaining complete transparency and reducing costs compared to legacy systems.

---

## 🎯 Pitch Deck

### The Problem

**Creators, collectives, and service platforms struggle to automate continuous payouts or usage-based billing.**

- **Treasury managers waste hours** reconciling spreadsheets and processing manual bulk transfers
- **Contributors wait** for delayed manual payments, creating cash flow issues
- **Legacy payroll systems** are expensive across borders and lack transparency or programmable logic
- **No real-time payment streaming** - payments are batch-based, not continuous
- **Recurring subscriptions** require manual intervention and lack on-chain auditability

### The Solution: Drip

Drip offers **programmable, real-time payment streams** and **recurring subscriptions** for stablecoins on the Mantle network.

**Treasury teams define per-second rates or subscription cadences once** - the smart contract enforces distribution autonomously. Recipients can withdraw accrued balances instantly with on-chain proofs and full auditability.

### ✨ Key Features

#### 💸 Real-Time Payment Streaming
- **Per-second rate calculation** - Define payment rates that accrue continuously
- **Instant withdrawals** - Recipients can withdraw accrued balances at any time
- **Autonomous execution** - Smart contracts handle distribution automatically
- **Full transparency** - All transactions are on-chain and auditable

#### 🔄 Recurring Subscriptions
- **Flexible cadences** - Daily, weekly, monthly, or custom intervals
- **Automatic execution** - Payments process without manual intervention
- **Easy management** - Create, modify, or cancel subscriptions anytime
- **Payment history** - Complete on-chain record of all transactions

#### 📊 Treasury Management
- **Multi-token support** - Manage USDC, USDT, and MANTLE
- **Bulk operations** - Create multiple streams/subscriptions at once
- **Analytics dashboard** - Track total outflow, active payments, and spending
- **Export functionality** - CSV/JSON export for reconciliation
- **Budget controls** - Set spending limits and monitor treasury health

### 🚀 How It Works

1. **Create a Stream or Subscription**
   - Treasury manager connects wallet and selects recipients
   - Defines payment amount, duration (for streams), or cadence (for subscriptions)
   - Chooses stablecoin ( USDC, USDT)
   - Smart contract locks funds and begins distribution

2. **Autonomous Execution**
   - **Streams**: Balance accrues per second based on defined rate
   - **Subscriptions**: Payments execute automatically at specified intervals
   - All logic enforced by smart contracts - no manual intervention needed

3. **Recipient Withdrawal**
   - Recipients see real-time accrued balance
   - One-click withdrawal to their wallet
   - Instant settlement on Mantle test network

4. **Transparency & Auditability**
   - All transactions recorded on-chain
   - Complete payment history available
   - Export data for accounting and reconciliation

### 💼 Use Cases

- **Content Creators**: Stream payments to collaborators, editors, or team members
- **DAOs & Collectives**: Automate contributor payouts and recurring grants
- **Service Platforms**: Usage-based billing for API calls, compute, or storage
- **Payroll**: Automated salary payments with real-time streaming
- **Subscriptions**: Recurring payments for SaaS, memberships, or services
- **Treasury Management**: Efficient multi-recipient payment distribution

### 🛠 Technology Stack

- **Blockchain**: MANTLE TESTNET (EVM-compatible, mobile-first)
- **Smart Contracts**: Solidity ^0.8.20 with OpenZeppelin
- **Frontend**: Next.js 14, TypeScript, React
- **Wallet Integration**: RainbowKit, wagmi, viem
- **UI Components**: shadcn/ui, Tailwind CSS
- **Development**: Hardhat, Turborepo, PNPM

### 📈 Why Mantle?

- **Low gas costs** - Critical for frequent per-second operations
- **Stablecoin ecosystem** - Native support for USDC, USDT
- **Reliable Data availability** - Integrated with EigenDA to provide reliable data availability.
- **EVM-compatible** - Familiar development experience
- **Fast transactions** - Sub-second finality for real-time payments

### 🎯 Project Status

Drip is currently in active development. See [MILESTONES.md](./MILESTONES.md) for detailed progress tracking.

**5 Milestones Planned:**
1. ⏳ Project Foundation & Smart Contract Architecture
2. ⏳ Core Smart Contracts (Streaming & Subscriptions)
3. ⏳ Frontend Foundation & Wallet Integration
4. ⏳ User Interfaces (Streaming & Subscriptions)
5. ⏳ Treasury Management, Advanced Features & Production Readiness

---

## 💼 Business Model

### Revenue Streams

#### 1. **Platform Fee (Primary Revenue)**
- **Transaction Fee**: 0.5% - 2% fee on all stream and subscription transactions
- **Fee Structure**:
  - **Free Tier**: 2% fee (up to $1,000/month in transaction volume)
  - **Pro Tier**: 1% fee ($1,000 - $10,000/month)
  - **Enterprise Tier**: 0.5% fee ($10,000+/month)
- **Collection**: Fees are automatically deducted from stream/subscription amounts
- **Rationale**: Aligns incentives - we only earn when users transact, ensuring value delivery

#### 2. **Subscription Plans (Recurring Revenue)**
- **Free Plan**: Basic features, 2% platform fee
  - Up to 10 active streams/subscriptions
  - Basic analytics
  - Community support
  
- **Pro Plan**: $29/month or $290/year (17% discount)
  - Unlimited streams/subscriptions
  - 1% platform fee
  - Advanced analytics & reporting
  - Priority support
  - Bulk operations
  - API access (limited)
  
- **Enterprise Plan**: Custom pricing
  - 0.5% platform fee
  - White-label options
  - Dedicated support
  - Custom integrations
  - Advanced security features
  - SLA guarantees
  - Multi-signature treasury controls

#### 3. **API Access & Developer Tools**
- **API Access**: Tiered pricing for programmatic access
  - Developer: $99/month (10,000 API calls)
  - Business: $299/month (100,000 API calls)
  - Enterprise: Custom pricing (unlimited)
- **SDK & Integration Tools**: Revenue share or licensing fees
- **Webhook Services**: Premium webhook delivery with guaranteed delivery

#### 4. **Premium Features & Add-ons**
- **Advanced Analytics**: $19/month add-on for Pro users
- **Custom Branding**: White-label solution for Enterprise
- **Payment Notifications**: Email/SMS notifications ($9/month)
- **Multi-currency Support**: Additional token support beyond stablecoins
- **Automated Reconciliation**: AI-powered reconciliation tools ($49/month)

#### 5. **Treasury Management Services**
- **Treasury Consulting**: Custom implementation and optimization services
- **Training & Onboarding**: Paid workshops and training programs
- **Compliance Tools**: KYC/AML integration services for Enterprise clients

### Target Market Segments

#### Primary Segments

1. **DAOs & Decentralized Collectives**
   - **Pain Point**: Manual contributor payouts, treasury management overhead
   - **Value Prop**: Automate recurring grants and contributor payments
   - **Market Size**: 10,000+ active DAOs globally
   - **Pricing**: Enterprise plans, volume discounts

2. **Content Creators & Creator Economy**
   - **Pain Point**: Delayed payments, cash flow issues, manual reconciliation
   - **Value Prop**: Real-time streaming payments to collaborators
   - **Market Size**: $104B+ creator economy market
   - **Pricing**: Pro plans, transaction-based fees

3. **SaaS & Service Platforms**
   - **Pain Point**: Usage-based billing complexity, subscription management
   - **Value Prop**: Programmable recurring subscriptions with on-chain proof
   - **Market Size**: $200B+ SaaS market
   - **Pricing**: Enterprise plans, API access fees

4. **Web3 Projects & Protocols**
   - **Pain Point**: Treasury management, multi-recipient payments
   - **Value Prop**: Automated treasury distribution, multi-token support
   - **Market Size**: 5,000+ active Web3 projects
   - **Pricing**: Enterprise plans, custom integrations

5. **Traditional Businesses (Cross-border)**
   - **Pain Point**: High fees, slow settlements, lack of transparency
   - **Value Prop**: Low-cost, fast, transparent cross-border payments
   - **Market Size**: $150T+ global payments market
   - **Pricing**: Enterprise plans, volume-based discounts

### Pricing Strategy

#### Freemium Model
- **Free tier** to drive adoption and network effects
- **Low barrier to entry** encourages experimentation
- **Upgrade path** based on usage and feature needs

#### Value-Based Pricing
- Fees scale with transaction volume (lower fees for higher volume)
- Aligns platform success with customer success
- Enterprise pricing based on value delivered, not just usage

#### Competitive Positioning
- **vs. Traditional Payment Processors**: 50-80% lower fees
- **vs. Other Streaming Platforms**: Lower fees, better UX, Mantle-native
- **vs. Manual Processes**: Time savings worth 10x the platform cost

### Unit Economics

#### Customer Acquisition
- **CAC (Customer Acquisition Cost)**: $50-200 depending on segment
- **Channels**: Content marketing, partnerships, developer community, DAO integrations

#### Customer Lifetime Value (LTV)
- **Free Users**: $0-50 (conversion to paid)
- **Pro Users**: $348/year average (29% annual retention)
- **Enterprise Users**: $5,000-50,000/year (90% retention)

#### LTV:CAC Ratio
- **Target**: 3:1 minimum, 5:1+ for sustainable growth
- **Pro Users**: ~7:1 LTV:CAC
- **Enterprise**: 10:1+ LTV:CAC

### Growth Strategy

#### Phase 1: Product-Market Fit (Months 1-6)
- **Focus**: Free tier adoption, community building
- **Goal**: 1,000+ active users, 10,000+ transactions/month
- **Revenue**: Minimal (primarily platform fees from free tier)

#### Phase 2: Monetization (Months 6-12)
- **Focus**: Convert free users to Pro, acquire Enterprise clients
- **Goal**: 100+ Pro subscribers, 10+ Enterprise clients
- **Revenue**: $10K-50K MRR

#### Phase 3: Scale (Months 12-24)
- **Focus**: API access, partnerships, international expansion
- **Goal**: 1,000+ Pro subscribers, 100+ Enterprise clients
- **Revenue**: $100K-500K MRR

### Competitive Advantages

1. **Mantle-Native**: Built specifically for Mantle's low-cost, mobile-first ecosystem
2. **Smart Contract Automation**: True autonomous execution vs. manual processes
3. **Multi-Token Support**: Native support for USDC, USDT, MNT
4. **Developer-Friendly**: Open APIs, SDKs, comprehensive documentation
5. **Transparency**: All transactions on-chain, full auditability
6. **Cost Efficiency**: Lower fees than traditional payment processors

### Risk Mitigation

- **Regulatory Compliance**: Working with legal advisors, KYC/AML options for Enterprise
- **Smart Contract Security**: Multiple audits, bug bounty program, insurance
- **Market Competition**: Focus on Mantle ecosystem, superior UX, network effects
- **Adoption Risk**: Freemium model, strong developer relations, DAO partnerships

---

## 🏗 Project Structure

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

This is a monorepo managed by Turborepo with the following structure:

- `apps/web` - Next.js frontend application with Drip UI
- `apps/contracts` - Hardhat smart contract development environment
  - `contracts/` - Solidity smart contracts (DripCore, SubscriptionManager)
  - `test/` - Contract test suite
  - `ignition/` - Deployment scripts

## Available Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint all packages and apps
- `pnpm type-check` - Run TypeScript type checking

### Smart Contract Scripts

- `pnpm contracts:compile` - Compile smart contracts
- `pnpm contracts:test` - Run smart contract tests
- `pnpm contracts:deploy` - Deploy contracts to local network
- `pnpm contracts:deploy:mantletestnet` - Deploy to Mantle testnet
- `pnpm contracts:deploy:sepolia` - Deploy to Sepolia testnet
- `pnpm contracts:deploy:mantle` - Deploy to Mantle dmainnet

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Smart Contracts**: Hardhat with Viem
- **Monorepo**: Turborepo
- **Package Manager**: PNPM

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Celo Documentation](https://docs.celo.org/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [wagmi Documentation](https://wagmi.sh/)

## 🤝 Contributing

Drip is an open-source project. Contributions are welcome! Please see our development guidelines and code of conduct.

## 📄 License

[Add your license here]

---

**Built with ❤️ on Mantle testnetwork**
