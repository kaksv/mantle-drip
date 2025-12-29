import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { deployDripFixture } from "./fixtures/DripFixture";
import { ethers } from "hardhat";

describe("SubscriptionManager", function () {
  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { subscriptionManager, dripCore, platformFeeRecipient } = await loadFixture(deployDripFixture);
      
      expect(subscriptionManager.target).to.be.a("string");
      expect(subscriptionManager.target).to.not.equal(ethers.ZeroAddress);
      expect(await subscriptionManager.dripCore()).to.equal(dripCore.target);
      expect(await subscriptionManager.platformFeeRecipient()).to.equal(platformFeeRecipient.address);
      expect(await subscriptionManager.platformFeeBps()).to.equal(50n); // 0.5%
    });

    it("Should reject zero address for DripCore", async function () {
      const { platformFeeRecipient } = await loadFixture(deployDripFixture);
      const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
      await expect(
        SubscriptionManager.deploy(ethers.ZeroAddress, platformFeeRecipient.address)
      ).to.be.rejectedWith("SubscriptionManager: Invalid DripCore address");
    });
  });

  describe("Subscription Creation", function () {
    it("Should create a subscription with native CELO", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      const tx = await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress, // Native token
        ethers.parseEther("100"),
        0, // Daily
        0,
        0, // First payment time (now + interval)
        "Monthly Subscription",
        "Monthly payment subscription"
      );

      await expect(tx).to.emit(subscriptionManager, "SubscriptionCreated");

      const subscriptionId = 1;
      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.subscriber).to.equal(sender.address);
      expect(subscription.recipient).to.equal(recipient1.address);
      expect(subscription.token).to.equal(ethers.ZeroAddress);
      expect(subscription.amount).to.equal(ethers.parseEther("100") - (ethers.parseEther("100") * 50n / 10000n));
      expect(subscription.cadence).to.equal(0n); // Daily
      expect(subscription.balance).to.equal(0n); // Escrow starts at 0
      expect(subscription.status).to.equal(0n); // Active
      expect(subscription.title).to.equal("Monthly Subscription");
      expect(subscription.description).to.equal("Monthly payment subscription");
    });

    it("Should create a subscription with ERC20 token (cUSD)", async function () {
      const { subscriptionManager, sender, recipient1, mockCUSD } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        mockCUSD.target,
        ethers.parseEther("50"),
        1, // Weekly
        0,
        0,
        "Weekly cUSD",
        ""
      );

      const subscriptionId = 1;
      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.token).to.equal(mockCUSD.target);
      expect(subscription.cadence).to.equal(1n); // Weekly
      expect(subscription.interval).to.equal(7 * 24 * 60 * 60); // 7 days
    });

    it("Should create a subscription with monthly cadence", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("200"),
        2, // Monthly
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.cadence).to.equal(2n); // Monthly
      expect(subscription.interval).to.equal(30 * 24 * 60 * 60); // 30 days
    });

    it("Should create a subscription with custom interval", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      const customInterval = 14 * 24 * 60 * 60; // 14 days
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("150"),
        3, // Custom
        customInterval,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.cadence).to.equal(3n); // Custom
      expect(subscription.interval).to.equal(customInterval);
    });

    it("Should reject subscription with invalid recipient", async function () {
      const { subscriptionManager, sender } = await loadFixture(deployDripFixture);
      await expect(
        subscriptionManager.connect(sender).createSubscription(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          ethers.parseEther("100"),
          0,
          0,
          0,
          "",
          ""
        )
      ).to.be.rejectedWith("SubscriptionManager: Invalid recipient");
    });

    it("Should reject subscription to self", async function () {
      const { subscriptionManager, sender } = await loadFixture(deployDripFixture);
      await expect(
        subscriptionManager.connect(sender).createSubscription(
          sender.address,
          ethers.ZeroAddress,
          ethers.parseEther("100"),
          0,
          0,
          0,
          "",
          ""
        )
      ).to.be.rejectedWith("SubscriptionManager: Cannot subscribe to self");
    });

    it("Should reject subscription with amount too small", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      await expect(
        subscriptionManager.connect(sender).createSubscription(
          recipient1.address,
          ethers.ZeroAddress,
          ethers.parseEther("0.0001"), // Too small
          0,
          0,
          0,
          "",
          ""
        )
      ).to.be.rejectedWith("SubscriptionManager: Amount too small");
    });
  });

  describe("Escrow Deposits", function () {
    it("Should deposit native CELO to subscription", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      const depositAmount = ethers.parseEther("500");

      await expect(
        subscriptionManager.connect(sender).depositToSubscription(subscriptionId, 0, { value: depositAmount })
      ).to.emit(subscriptionManager, "SubscriptionDeposited");

      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.balance).to.equal(depositAmount);
    });

    it("Should deposit ERC20 tokens to subscription", async function () {
      const { subscriptionManager, sender, recipient1, mockCUSD } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        mockCUSD.target,
        ethers.parseEther("50"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      const depositAmount = ethers.parseEther("1000");

      // Approve and deposit
      await mockCUSD.connect(sender).approve(subscriptionManager.target, depositAmount);
      
      await expect(
        subscriptionManager.connect(sender).depositToSubscription(subscriptionId, depositAmount)
      ).to.emit(subscriptionManager, "SubscriptionDeposited");

      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.balance).to.equal(depositAmount);
    });

    it("Should allow multiple deposits", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, 0, { value: ethers.parseEther("200") });
      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, 0, { value: ethers.parseEther("300") });

      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.balance).to.equal(ethers.parseEther("500"));
    });

    it("Should reject deposit by non-subscriber", async function () {
      const { subscriptionManager, sender, recipient1, recipient2 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      await expect(
        subscriptionManager.connect(recipient2).depositToSubscription(subscriptionId, 0, { value: ethers.parseEther("100") })
      ).to.be.rejectedWith("SubscriptionManager: Only subscriber can deposit");
    });
  });

  describe("Payment Execution", function () {
    it("Should execute payment for native CELO subscription", async function () {
      const { subscriptionManager, sender, recipient1, platformFeeRecipient } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0, // Daily
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      const paymentAmount = subscription.amount;
      const fee = (paymentAmount * 50n) / 10000n;
      const totalRequired = paymentAmount + fee;

      // Deposit funds
      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, 0, { value: totalRequired * 2n });

      // Advance time to payment due date
      await time.increase(24 * 60 * 60 + 1);

      const balanceBefore = await ethers.provider.getBalance(recipient1.address);
      
      const tx = await subscriptionManager.executePayment(subscriptionId);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(recipient1.address);
      const received = balanceAfter - balanceBefore + gasUsed;
      const diff = received > paymentAmount ? received - paymentAmount : paymentAmount - received;
      expect(diff).to.be.lte(ethers.parseEther("0.001"));

      const updatedSubscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(updatedSubscription.balance).to.equal(totalRequired); // Remaining after payment
      expect(updatedSubscription.paymentCount).to.equal(1n);
      expect(updatedSubscription.totalPaid).to.equal(paymentAmount);
    });

    it("Should execute payment for ERC20 subscription", async function () {
      const { subscriptionManager, sender, recipient1, mockCUSD } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        mockCUSD.target,
        ethers.parseEther("50"),
        1, // Weekly
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      const paymentAmount = subscription.amount;
      const fee = (paymentAmount * 50n) / 10000n;
      const totalRequired = paymentAmount + fee;

      // Deposit funds
      await mockCUSD.connect(sender).approve(subscriptionManager.target, totalRequired * 2n);
      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, totalRequired * 2n);

      // Advance time
      await time.increase(7 * 24 * 60 * 60 + 1);

      const balanceBefore = await mockCUSD.balanceOf(recipient1.address);
      
      await subscriptionManager.executePayment(subscriptionId);

      const balanceAfter = await mockCUSD.balanceOf(recipient1.address);
      expect(balanceAfter - balanceBefore).to.equal(paymentAmount);
    });

    it("Should handle backlog (multiple missed payments)", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0, // Daily
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      const paymentAmount = subscription.amount;
      const fee = (paymentAmount * 50n) / 10000n;
      const totalRequired = paymentAmount + fee;

      // Deposit enough for 5 payments
      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, 0, { value: totalRequired * 5n });

      // Advance time by 3 days (3 payments due)
      await time.increase(3 * 24 * 60 * 60 + 1);

      const balanceBefore = await ethers.provider.getBalance(recipient1.address);
      
      const tx = await subscriptionManager.executePayment(subscriptionId);
      const receipt = await tx.wait();
      // Get the return value from the transaction
      const result = await subscriptionManager.executePayment.staticCall(subscriptionId);
      const intervalsPaid = result[2]; // Third return value

      expect(intervalsPaid).to.equal(3n);

      const balanceAfter = await ethers.provider.getBalance(recipient1.address);
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      expect(balanceAfter - balanceBefore + gasUsed).to.be.closeTo(paymentAmount * 3n, ethers.parseEther("0.001"));

      const updatedSubscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(updatedSubscription.paymentCount).to.equal(3n);
      expect(updatedSubscription.totalPaid).to.equal(paymentAmount * 3n);
    });

    it("Should reject payment execution when not due", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, 0, { value: ethers.parseEther("1000") });

      // Don't advance time - payment not due yet
      await expect(
        subscriptionManager.executePayment(subscriptionId)
      ).to.be.rejectedWith("SubscriptionManager: Payment not due");
    });

    it("Should reject payment execution with insufficient balance", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      // Don't deposit enough
      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, 0, { value: ethers.parseEther("10") });

      await time.increase(24 * 60 * 60 + 1);

      await expect(
        subscriptionManager.executePayment(subscriptionId)
      ).to.be.rejectedWith("SubscriptionManager: Insufficient balance");
    });
  });

  describe("Batch Payment Execution", function () {
    it("Should execute multiple payments in batch", async function () {
      const { subscriptionManager, sender, recipient1, recipient2 } = await loadFixture(deployDripFixture);
      
      // Create two subscriptions
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      await subscriptionManager.connect(sender).createSubscription(
        recipient2.address,
        ethers.ZeroAddress,
        ethers.parseEther("50"),
        0,
        0,
        0,
        "",
        ""
      );

      // Deposit to both
      const subscription1 = await subscriptionManager.getSubscription(1);
      const subscription2 = await subscriptionManager.getSubscription(2);
      const total1 = subscription1.amount + (subscription1.amount * 50n / 10000n);
      const total2 = subscription2.amount + (subscription2.amount * 50n / 10000n);

      await subscriptionManager.connect(sender).depositToSubscription(1, 0, { value: total1 * 2n });
      await subscriptionManager.connect(sender).depositToSubscription(2, 0, { value: total2 * 2n });

      await time.increase(24 * 60 * 60 + 1);

      const tx = await subscriptionManager.executeBatchPayments([1, 2]);
      await tx.wait();
      // Get the return value
      const successCount = await subscriptionManager.executeBatchPayments.staticCall([1, 2]);
      expect(successCount).to.equal(2n);
    });
  });

  describe("Subscription Management", function () {
    it("Should pause an active subscription", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      await expect(
        subscriptionManager.connect(sender).pauseSubscription(subscriptionId)
      ).to.emit(subscriptionManager, "SubscriptionPaused");

      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.status).to.equal(1n); // Paused
    });

    it("Should resume a paused subscription", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      await subscriptionManager.connect(sender).pauseSubscription(subscriptionId);
      
      await expect(
        subscriptionManager.connect(sender).resumeSubscription(subscriptionId)
      ).to.emit(subscriptionManager, "SubscriptionResumed");

      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.status).to.equal(0n); // Active
    });

    it("Should cancel subscription and refund balance", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      const depositAmount = ethers.parseEther("500");
      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, 0, { value: depositAmount });

      const balanceBefore = await ethers.provider.getBalance(sender.address);
      
      const tx = await subscriptionManager.connect(sender).cancelSubscription(subscriptionId);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(sender.address);
      expect(balanceAfter - balanceBefore + gasUsed).to.be.closeTo(depositAmount, ethers.parseEther("0.001"));

      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.status).to.equal(2n); // Cancelled
      expect(subscription.balance).to.equal(0n);
    });

    it("Should modify subscription", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      await subscriptionManager.connect(sender).modifySubscription(
        subscriptionId,
        ethers.parseEther("200"),
        1, // Weekly
        0
      );

      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.amount).to.equal(ethers.parseEther("200") - (ethers.parseEther("200") * 50n / 10000n));
      expect(subscription.cadence).to.equal(1n); // Weekly
      expect(subscription.interval).to.equal(7 * 24 * 60 * 60);
    });
  });

  describe("Query Functions", function () {
    it("Should return payment history", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      const totalRequired = subscription.amount + (subscription.amount * 50n / 10000n);

      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, 0, { value: totalRequired * 3n });

      // Execute 2 payments
      await time.increase(24 * 60 * 60 + 1);
      await subscriptionManager.executePayment(subscriptionId);
      
      await time.increase(24 * 60 * 60);
      await subscriptionManager.executePayment(subscriptionId);

      const [payments, total] = await subscriptionManager.getPaymentHistory(subscriptionId, 0, 10);
      expect(total).to.equal(2n);
      expect(payments.length).to.equal(2);
      expect(payments[0].success).to.be.true;
      expect(payments[1].success).to.be.true;
    });

    it("Should return user subscriptions", async function () {
      const { subscriptionManager, sender, recipient1, recipient2 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      await subscriptionManager.connect(sender).createSubscription(
        recipient2.address,
        ethers.ZeroAddress,
        ethers.parseEther("50"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptions = await subscriptionManager.getUserSubscriptions(sender.address);
      expect(subscriptions.length).to.equal(2);
    });

    it("Should return user received subscriptions", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptions = await subscriptionManager.getUserReceivedSubscriptions(recipient1.address);
      expect(subscriptions.length).to.equal(1);
    });

    it("Should check if payment is due", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      let [isDue, nextPaymentTime] = await subscriptionManager.isPaymentDue(subscriptionId);
      expect(isDue).to.be.false;

      await time.increase(24 * 60 * 60 + 1);

      [isDue, nextPaymentTime] = await subscriptionManager.isPaymentDue(subscriptionId);
      expect(isDue).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle USDC with 6 decimals", async function () {
      const { subscriptionManager, sender, recipient1, mockUSDC } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        await mockUSDC.getAddress(),
        ethers.parseUnits("1000000", 6), // Large amount: MIN_AMOUNT is 1e15, for 6 decimals that's 1e15/1e6 = 1e9 = 1 billion units
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockUSDC.connect(sender).approve(subscriptionManager.target, depositAmount);
      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, depositAmount);

      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.balance).to.equal(depositAmount);
    });

    it("Should handle very small subscription amounts", async function () {
      const { subscriptionManager, sender, recipient1 } = await loadFixture(deployDripFixture);
      
      await subscriptionManager.connect(sender).createSubscription(
        recipient1.address,
        ethers.ZeroAddress,
        ethers.parseEther("0.001"),
        0,
        0,
        0,
        "",
        ""
      );

      const subscriptionId = 1;
      await subscriptionManager.connect(sender).depositToSubscription(subscriptionId, 0, { value: ethers.parseEther("0.01") });

      await time.increase(24 * 60 * 60 + 1);
      await subscriptionManager.executePayment(subscriptionId);

      const subscription = await subscriptionManager.getSubscription(subscriptionId);
      expect(subscription.paymentCount).to.equal(1n);
    });
  });
});

