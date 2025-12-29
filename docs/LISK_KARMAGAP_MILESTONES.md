# Drip on Lisk - Karmagap Campaign Milestones

## Overview
Drip is expanding to Lisk mainnet, bringing programmable payment streaming and recurring subscriptions to the Lisk ecosystem. This campaign focuses on achieving feature parity with Celo mainnet and building a strong presence on Lisk.

---

## Milestone 1: Lisk Network Integration & Contract Deployment
**Status:** ✅ Complete  
**Estimated Time:** 1-2 days

### Description
This milestone establishes the foundation for Drip on Lisk by deploying the core smart contracts to Lisk mainnet. It involves configuring the development environment for Lisk's EVM-compatible network, deploying DripCore and SubscriptionManager contracts using the upgradeable proxy pattern, and ensuring the frontend can interact with the deployed contracts. This is the critical first step that enables all subsequent features on Lisk.

### Objectives
- Configure Lisk mainnet network in Hardhat
- Deploy DripCore and SubscriptionManager contracts to Lisk mainnet
- Set up upgradeable proxy pattern for future contract upgrades
- Verify contracts on Lisk block explorer
- Update frontend configuration with deployed addresses

### Deliverables
- [x] Hardhat configuration for Lisk mainnet (chain ID: 1135)
- [x] DripCore proxy deployment on Lisk mainnet
- [x] SubscriptionManager deployment on Lisk mainnet
- [x] ProxyAdmin contract deployment
- [x] Frontend config updated with Lisk contract addresses
- [x] Deployment documentation and addresses recorded
- [ ] Contract verification on Blockscout (if supported)

### Technical Requirements
- Lisk RPC: `https://rpc.api.lisk.com`
- Chain ID: 1135
- Native currency: ETH (not LSK)
- Block explorer: https://blockscout.lisk.com
- OpenZeppelin TransparentUpgradeableProxy pattern

### Acceptance Criteria
- Contracts successfully deployed to Lisk mainnet
- Proxy address configured in frontend
- Contracts are upgradeable (proxy pattern working)
- Deployment addresses documented
- Network switching works in frontend

---

## Milestone 2: Token Configuration & Multi-Token Support
**Status:** ✅ Complete  
**Estimated Time:** 1 day

### Description
This milestone configures all supported tokens for the Lisk network, enabling users to create streams and subscriptions with native ETH, LSK token, and bridged stablecoins (USDC, USDT). It ensures the token selector dynamically shows the correct tokens based on the selected network, providing a seamless experience when switching between Celo and Lisk. Proper token configuration is essential for users to interact with Drip using their preferred assets.

### Objectives
- Configure native ETH and ERC20 tokens for Lisk mainnet
- Add LSK token support (ERC20)
- Configure USDC and USDT bridged tokens
- Update token selector to show Lisk-specific tokens
- Ensure token balances display correctly

### Deliverables
- [x] Native ETH token configuration (zero address)
- [x] LSK ERC20 token added (0xac485391EB2d7D88253a7F1eF18C37f4242D1A24)
- [x] USDC bridged token configured (0xF242275d3a6527d877f2c927a82D9b057609cc71)
- [x] USDT token configured (0x05D032ac25d322df992303dCa074EE7392C117b9)
- [x] Token selector shows correct tokens based on network
- [x] Balance display shows ETH for native currency

### Technical Requirements
- Token addresses verified from official Lisk documentation
- Network-aware token configuration
- Support for 18-decimal (ETH, LSK) and 6-decimal (USDC, USDT) tokens
- Token metadata (symbol, name, decimals) correctly configured

### Acceptance Criteria
- Users can select ETH, LSK, USDC, USDT when on Lisk network
- Token balances display correctly
- Token selector switches automatically when network changes
- All token addresses are verified and correct

---

## Milestone 3: Network Switching & Wallet Integration
**Status:** ✅ Complete  
**Estimated Time:** 1 day

### Description
This milestone enables seamless network switching between Celo and Lisk mainnets, allowing users to access Drip on both networks from a single interface. It integrates Lisk mainnet into the wallet provider configuration, updates the UI to display the correct native currency (ETH on Lisk vs CELO on Celo), and ensures all wallet operations work correctly on Lisk. This creates a unified cross-chain experience for Drip users.

### Objectives
- Add Lisk mainnet to wallet provider configuration
- Enable seamless network switching between Celo and Lisk
- Update wallet button to show correct native currency (ETH vs CELO)
- Ensure all wallet interactions work on Lisk

### Deliverables
- [x] Lisk mainnet added to wagmi chains configuration
- [x] Network switcher includes Lisk Mainnet option
- [x] Wallet balance displays ETH when on Lisk
- [x] Network switching works seamlessly
- [x] Wallet connection works on Lisk mainnet
- [x] Transaction signing works correctly

### Technical Requirements
- wagmi chain configuration for Lisk
- RainbowKit network support
- Network-aware balance display
- Proper RPC endpoint configuration

### Acceptance Criteria
- Users can switch to Lisk mainnet from wallet dropdown
- Balance shows correct currency (ETH on Lisk, CELO on Celo)
- All wallet operations work on Lisk
- Network switching is smooth and intuitive

---

## Milestone 4: Payment Streaming on Lisk
**Status:** 🟡 In Progress  
**Estimated Time:** 2-3 days

### Description
This milestone brings Drip's core payment streaming functionality to Lisk mainnet, enabling users to create real-time payment streams that accrue per second. It involves testing stream creation, per-second rate calculations, real-time balance accrual, and withdrawal functionality with both native ETH and ERC20 tokens (LSK, USDC, USDT). This milestone ensures the flagship feature works flawlessly on Lisk, matching the experience users have on Celo mainnet.

### Objectives
- Enable payment stream creation on Lisk mainnet
- Test per-second rate calculation on Lisk
- Verify real-time balance accrual works correctly
- Ensure withdrawals work with ETH and ERC20 tokens
- Test stream management (pause, resume, cancel)

### Deliverables
- [ ] Stream creation form works on Lisk network
- [ ] Per-second rate calculation verified on Lisk
- [ ] Real-time balance updates working
- [ ] Withdrawal functionality tested with ETH
- [ ] Withdrawal functionality tested with LSK, USDC, USDT
- [ ] Stream pause/resume/cancel tested
- [ ] Stream extension tested (if implemented)
- [ ] Multiple recipient streams tested

### Technical Requirements
- Contract interactions work on Lisk
- Gas estimation accurate for Lisk network
- Token approvals work correctly
- Event listening works for stream updates

### Acceptance Criteria
- Users can create streams on Lisk mainnet
- Streams accrue balance correctly per second
- Recipients can withdraw accrued balances
- All stream management functions work
- Gas costs are acceptable on Lisk

---

## Milestone 5: Recurring Subscriptions on Lisk
**Status:** 🟡 Pending  
**Estimated Time:** 2-3 days

### Description
This milestone enables automated recurring subscriptions on Lisk mainnet, allowing users to set up periodic payments (hourly, daily, weekly, monthly) that execute automatically without manual intervention. It involves testing subscription creation, automatic payment execution, subscription management (modify, cancel), and payment history tracking. This feature is crucial for DAOs, service platforms, and organizations that need automated recurring payments.

### Objectives
- Enable subscription creation on Lisk mainnet
- Test automatic payment execution on Lisk
- Verify subscription management (modify, cancel)
- Test various cadences (hourly, daily, weekly, monthly)
- Ensure payment history tracking works

### Deliverables
- [ ] Subscription creation form works on Lisk
- [ ] Automatic payment execution tested
- [ ] Subscription modification tested
- [ ] Subscription cancellation tested
- [ ] Payment history displays correctly
- [ ] Multiple cadences tested (hourly, daily, weekly, monthly)
- [ ] Subscription analytics working

### Technical Requirements
- SubscriptionManager contract interactions
- Automatic payment execution monitoring
- Payment history queries
- Subscription status tracking

### Acceptance Criteria
- Users can create subscriptions on Lisk
- Automatic payments execute correctly
- Subscription management functions work
- Payment history is accurate
- All cadences work as expected

---

## Milestone 6: Treasury Management Dashboard on Lisk
**Status:** 🟡 Pending  
**Estimated Time:** 3-4 days

### Description
This milestone delivers comprehensive treasury management capabilities for Lisk, providing treasury managers with a unified dashboard to view all active streams and subscriptions, monitor multi-token balances (ETH, LSK, USDC, USDT), perform bulk operations, and access analytics. This feature is essential for organizations managing multiple payment streams and subscriptions, enabling efficient treasury oversight and operations on the Lisk network.

### Objectives
- Enable treasury dashboard for Lisk network
- Display multi-token balances (ETH, LSK, USDC, USDT)
- Show active streams and subscriptions on Lisk
- Enable bulk operations for Lisk network
- Implement analytics for Lisk treasury

### Deliverables
- [ ] Treasury dashboard shows Lisk network data
- [ ] Multi-token balance display (ETH, LSK, USDC, USDT)
- [ ] Active streams list for Lisk
- [ ] Active subscriptions list for Lisk
- [ ] Bulk stream creation on Lisk
- [ ] Bulk subscription management on Lisk
- [ ] Treasury analytics for Lisk network
- [ ] Activity log for Lisk transactions

### Technical Requirements
- Network-aware data fetching
- Aggregate data from Lisk contracts
- Multi-token balance queries
- Analytics calculations for Lisk

### Acceptance Criteria
- Treasury managers can view Lisk treasury status
- Multi-token balances display correctly
- Bulk operations work on Lisk
- Analytics provide accurate insights
- Activity log shows Lisk transactions

---

## Milestone 7: Analytics & Export Features on Lisk
**Status:** 🟡 Pending  
**Estimated Time:** 2-3 days

### Description
This milestone enables comprehensive analytics and data export functionality for Lisk, allowing users to analyze stream performance, export transaction data in CSV/JSON formats for accounting and reconciliation, and filter analytics by network. It provides insights into payment patterns, total outflow, active payments, and spending trends specific to Lisk operations. This feature is critical for financial reporting and treasury management.

### Objectives
- Enable stream analytics dashboard for Lisk
- Implement CSV/JSON export for Lisk data
- Add network filtering in analytics
- Create Lisk-specific analytics views
- Enable data reconciliation exports

### Deliverables
- [ ] Stream analytics dashboard works for Lisk
- [ ] CSV export includes Lisk network data
- [ ] JSON export includes Lisk network data
- [ ] Network filter in analytics dashboard
- [ ] Lisk-specific analytics metrics
- [ ] Export includes network identifier
- [ ] Data reconciliation tools work for Lisk

### Technical Requirements
- Network-aware analytics calculations
- Export format includes network info
- Filtering by network in UI
- Data aggregation across networks

### Acceptance Criteria
- Analytics show accurate Lisk data
- Exports include network information
- Users can filter by network
- Export formats are correct
- Reconciliation tools work

---

## Milestone 8: Leaderboard & Community Features
**Status:** 🟡 Pending  
**Estimated Time:** 3-4 days

### Description
This milestone builds community engagement features for Lisk, including leaderboards that showcase top users, streams, and activity on the Lisk network. It enables cross-network leaderboard views, tracks Lisk-specific community metrics, and provides campaign tracking for the Karmagap initiative. These features help build community, showcase adoption, and create social proof for Drip's presence on Lisk.

### Objectives
- Deploy leaderboard sync API for Lisk network
- Display Lisk-specific leaderboards
- Enable cross-network leaderboard views
- Add Lisk community metrics
- Create Lisk campaign tracking

### Deliverables
- [ ] Leaderboard sync API supports Lisk network
- [ ] Lisk leaderboard displays correctly
- [ ] Cross-network leaderboard view
- [ ] Lisk community metrics dashboard
- [ ] Campaign tracking for Lisk
- [ ] Top users/streams on Lisk displayed

### Technical Requirements
- API route for Lisk network sync
- Database schema for Lisk data
- Leaderboard aggregation for Lisk
- Cross-network queries

### Acceptance Criteria
- Leaderboard syncs Lisk data correctly
- Lisk leaderboard displays accurately
- Cross-network views work
- Community metrics are tracked
- Campaign progress is visible

---

## Milestone 9: Documentation & Community Onboarding
**Status:** 🟡 Pending  
**Estimated Time:** 2-3 days

### Description
This milestone creates comprehensive documentation and community resources for Lisk users, including deployment guides, user tutorials, network switching instructions, and Lisk-specific FAQs. It also sets up community channels and prepares marketing materials for the Lisk launch. Good documentation is essential for user adoption and helps onboard new users to Drip on Lisk effectively.

### Objectives
- Create Lisk-specific documentation
- Write deployment guide for Lisk
- Create user guides for Lisk network
- Set up community resources
- Prepare marketing materials for Lisk

### Deliverables
- [ ] Lisk deployment documentation
- [ ] User guide for Lisk network
- [ ] Token configuration guide for Lisk
- [ ] Network switching guide
- [ ] Lisk-specific FAQ
- [ ] Community resources (Discord, Twitter)
- [ ] Marketing materials for Lisk launch

### Technical Requirements
- Clear documentation structure
- Step-by-step guides
- Visual aids and screenshots
- Community platform setup

### Acceptance Criteria
- Documentation is complete and clear
- Users can follow guides successfully
- Community resources are accessible
- Marketing materials are ready

---

## Milestone 10: Production Launch & Community Growth
**Status:** 🟡 Pending  
**Estimated Time:** 3-5 days

### Description
This milestone marks the official production launch of Drip on Lisk mainnet, transitioning from development to public beta. It involves comprehensive testing, onboarding the first users, monitoring system performance, collecting feedback, and achieving initial adoption metrics. This milestone represents the culmination of the Karmagap campaign, establishing Drip as a fully functional payment platform on Lisk with an active user base and growing community.

### Objectives
- Complete all testing on Lisk mainnet
- Launch public beta on Lisk
- Onboard first Lisk users
- Monitor and fix any issues
- Achieve initial adoption metrics

### Deliverables
- [ ] All features tested and working on Lisk
- [ ] Public beta launched on Lisk
- [ ] First 10 users onboarded
- [ ] First 5 streams created on Lisk
- [ ] First 3 subscriptions created on Lisk
- [ ] Community feedback collected
- [ ] Bug fixes and improvements deployed
- [ ] Success metrics tracked

### Technical Requirements
- Production-ready deployment
- Monitoring and analytics
- Error tracking
- User feedback collection

### Acceptance Criteria
- All features work in production
- Users can successfully use Drip on Lisk
- Initial adoption targets met
- Community is engaged
- No critical bugs in production

---

## Campaign Timeline Summary

| Milestone | Status | Duration | Dependencies |
|-----------|--------|----------|-------------|
| 1. Network Integration | ✅ Complete | 1-2 days | None |
| 2. Token Configuration | ✅ Complete | 1 day | Milestone 1 |
| 3. Network Switching | ✅ Complete | 1 day | Milestone 1, 2 |
| 4. Payment Streaming | 🟡 In Progress | 2-3 days | Milestone 3 |
| 5. Recurring Subscriptions | 🟡 Pending | 2-3 days | Milestone 4 |
| 6. Treasury Management | 🟡 Pending | 3-4 days | Milestone 4, 5 |
| 7. Analytics & Export | 🟡 Pending | 2-3 days | Milestone 6 |
| 8. Leaderboard & Community | 🟡 Pending | 3-4 days | Milestone 6 |
| 9. Documentation | 🟡 Pending | 2-3 days | Milestone 4, 5 |
| 10. Production Launch | 🟡 Pending | 3-5 days | All previous |

**Total Estimated Duration:** 20-30 days (~3-4 weeks)

---

## Success Metrics

### Technical Metrics
- ✅ Contracts deployed and verified on Lisk
- ✅ All Celo features working on Lisk
- ✅ Network switching seamless
- ✅ Gas costs optimized for Lisk
- ✅ Zero critical bugs

### Adoption Metrics
- 🎯 10+ active users on Lisk
- 🎯 5+ active streams on Lisk
- 🎯 3+ active subscriptions on Lisk
- 🎯 $1,000+ total volume on Lisk
- 🎯 Community engagement (Discord, Twitter)

### Feature Parity Metrics
- ✅ Payment streaming: 100% parity
- ✅ Recurring subscriptions: 100% parity
- ✅ Treasury management: 100% parity
- ✅ Analytics & export: 100% parity
- ✅ Leaderboard: 100% parity

---

## Notes

- All milestones build on Celo mainnet features
- Focus on feature parity first, then Lisk-specific optimizations
- Community feedback should be incorporated throughout
- Gas optimization is important for Lisk's low-cost environment
- Security considerations apply to all deployments
- Documentation should be updated as features are completed

---

## Campaign Goals

**Primary Goal:** Achieve 100% feature parity with Celo mainnet on Lisk mainnet

**Secondary Goals:**
- Build active community on Lisk
- Onboard 10+ active users
- Process $1,000+ in payment volume
- Establish Drip as leading payment platform on Lisk

**Long-term Vision:**
- Become the go-to payment streaming platform on Lisk
- Enable cross-chain payment workflows (Celo ↔ Lisk)
- Build partnerships with Lisk ecosystem projects
- Expand to additional Lisk Layer 2 networks
