import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { deployDripFixture } from "./fixtures/DripFixture";
import { ethers } from "hardhat";

describe("DripCore", function () {
  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { dripCore, platformFeeRecipient } = await loadFixture(deployDripFixture);
      
      expect(dripCore.target).to.be.a("string");
      expect(dripCore.target).to.not.equal(ethers.ZeroAddress);
      expect(await dripCore.platformFeeRecipient()).to.equal(platformFeeRecipient.address);
      expect(await dripCore.platformFeeBps()).to.equal(50n); // 0.5%
    });

    it("Should reject zero address for platform fee recipient", async function () {
      const DripCore = await ethers.getContractFactory("DripCore");
      await expect(
        DripCore.deploy(ethers.ZeroAddress)
      ).to.be.rejectedWith("DripCore: Invalid fee recipient");
    });
  });

  describe("Stream Creation", function () {
    describe("Single Recipient Streams", function () {
      it("Should create a stream with native CELO", async function () {
        const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
        const deposit = ethers.parseEther("100");
        const periodSeconds = 7 * 24 * 60 * 60; // 7 days
        const amountPerPeriod = ethers.parseEther("100");

        await expect(
          dripCore.connect(sender).createStream(
            [recipient1.address],
            ethers.ZeroAddress, // Native token
            [amountPerPeriod],
            periodSeconds,
            deposit,
            "Test Stream",
            "Test Description"
          , { value: deposit })
        ).to.emit(dripCore, "StreamCreated");

        const streamId = 1;
        const stream = await dripCore.getStream(streamId);
        expect(stream.sender).to.equal(sender.address);
        expect(stream.recipients.length).to.equal(1n);
        expect(stream.recipients[0]).to.equal(recipient1.address);
        expect(stream.token).to.equal(ethers.ZeroAddress);
        expect(stream.deposit).to.equal(deposit - (deposit * 50n / 10000n)); // Minus fee
        expect(stream.status).to.equal(0n); // Active
        expect(stream.title).to.equal("Test Stream");
        expect(stream.description).to.equal("Test Description");
      });

      it("Should create a stream with ERC20 token (cUSD)", async function () {
        const { dripCore, sender, recipient1, mockCUSD } = await loadFixture(deployDripFixture);
        const deposit = ethers.parseEther("1000");
        const periodSeconds = 30 * 24 * 60 * 60; // 30 days
        const amountPerPeriod = ethers.parseEther("1000");

        // Approve tokens
        await mockCUSD.connect(sender).approve(dripCore.target, deposit);

        await expect(
          dripCore.connect(sender).createStream(
            [recipient1.address],
            mockCUSD.target,
            [amountPerPeriod],
            periodSeconds,
            deposit,
            "cUSD Stream",
            "Monthly cUSD stream"
          )
        ).to.emit(dripCore, "StreamCreated");

        const streamId = 1;
        const stream = await dripCore.getStream(streamId);
        expect(stream.token).to.equal(mockCUSD.target);
        expect(stream.deposit).to.equal(deposit - (deposit * 50n / 10000n));
      });

      it("Should create a stream with USDC (6 decimals)", async function () {
        const { dripCore, sender, recipient1, mockUSDC } = await loadFixture(deployDripFixture);
        const deposit = ethers.parseUnits("1000", 6);
        const periodSeconds = 7 * 24 * 60 * 60;
        const amountPerPeriod = ethers.parseUnits("1000", 6);

        await mockUSDC.connect(sender).approve(dripCore.target, deposit);

        await expect(
          dripCore.connect(sender).createStream(
            [recipient1.address],
            mockUSDC.target,
            [amountPerPeriod],
            periodSeconds,
            deposit,
            "USDC Stream",
            ""
          )
        ).to.emit(dripCore, "StreamCreated");
      });
    });

    describe("Multiple Recipients Streams", function () {
      it("Should create a stream with multiple recipients", async function () {
        const { dripCore, sender, recipient1, recipient2, recipient3 } = await loadFixture(deployDripFixture);
        const deposit = ethers.parseEther("300");
        const periodSeconds = 7 * 24 * 60 * 60;
        const recipients = [
          recipient1.address,
          recipient2.address,
          recipient3.address
        ];
        const amountsPerPeriod = [
          ethers.parseEther("100"),
          ethers.parseEther("100"),
          ethers.parseEther("100")
        ];

        await expect(
          dripCore.connect(sender).createStream(
            recipients,
            ethers.ZeroAddress,
            amountsPerPeriod,
            periodSeconds,
            deposit,
            "Multi-Recipient Stream",
            "Streaming to 3 recipients"
          , { value: deposit })
        ).to.emit(dripCore, "StreamCreated");

        const streamId = 1;
        const stream = await dripCore.getStream(streamId);
        expect(stream.recipients.length).to.equal(3n);
        expect(stream.recipients[0]).to.equal(recipient1.address);
        expect(stream.recipients[1]).to.equal(recipient2.address);
        expect(stream.recipients[2]).to.equal(recipient3.address);
      });

      it("Should create a stream with different amounts per recipient", async function () {
        const { dripCore, sender, recipient1, recipient2 } = await loadFixture(deployDripFixture);
        const deposit = ethers.parseEther("150");
        const periodSeconds = 7 * 24 * 60 * 60;
        const recipients = [
          recipient1.address,
          recipient2.address
        ];
        const amountsPerPeriod = [
          ethers.parseEther("100"), // Recipient 1 gets 100
          ethers.parseEther("50")   // Recipient 2 gets 50
        ];

        await dripCore.connect(sender).createStream(
          recipients,
          ethers.ZeroAddress,
          amountsPerPeriod,
          periodSeconds,
          deposit,
          "",
          ""
        , { value: deposit });

        const streamId = 1;
        const recipient1Info = await dripCore.getRecipientInfo(streamId, recipient1.address);
        const recipient2Info = await dripCore.getRecipientInfo(streamId, recipient2.address);
        
        // Recipient 1 should have higher rate
        expect(recipient1Info.ratePerSecond > recipient2Info.ratePerSecond).to.be.true;
      });
    });

    describe("Stream Creation Validations", function () {
      it("Should reject stream with zero recipients", async function () {
        const { dripCore, sender } = await loadFixture(deployDripFixture);
        await expect(
          dripCore.connect(sender).createStream(
            [],
            ethers.ZeroAddress,
            [],
            3600,
            ethers.parseEther("100"),
            "",
            ""
          )
        ).to.be.rejectedWith("DripCore: At least one recipient required");
      });

      it("Should reject stream with mismatched arrays", async function () {
        const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
        await expect(
          dripCore.connect(sender).createStream(
            [recipient1.address],
            ethers.ZeroAddress,
            [ethers.parseEther("100"), ethers.parseEther("50")], // Wrong length
            3600,
            ethers.parseEther("100"),
            "",
            ""
          )
        ).to.be.rejectedWith("DripCore: Mismatched arrays");
      });

      it("Should reject stream with zero deposit", async function () {
        const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
        await expect(
          dripCore.connect(sender).createStream(
            [recipient1.address],
            ethers.ZeroAddress,
            [ethers.parseEther("100")],
            3600,
            0,
            "",
            ""
          )
        ).to.be.rejectedWith("DripCore: Invalid deposit");
      });

      it("Should reject stream with period too short", async function () {
        const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
        await expect(
          dripCore.connect(sender).createStream(
            [recipient1.address],
            ethers.ZeroAddress,
            [ethers.parseEther("100")],
            3599, // Less than MIN_DURATION (3600)
            ethers.parseEther("100"),
            "",
            ""
          )
        ).to.be.rejectedWith("DripCore: Period too short");
      });

      it("Should reject stream with duplicate recipients", async function () {
        const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
        await expect(
          dripCore.connect(sender).createStream(
            [recipient1.address, recipient1.address],
            ethers.ZeroAddress,
            [ethers.parseEther("50"), ethers.parseEther("50")],
            3600,
            ethers.parseEther("100"),
            "",
            ""
          )
        ).to.be.rejectedWith("DripCore: Duplicate recipient");
      });

      it("Should reject stream to self", async function () {
        const { dripCore, sender } = await loadFixture(deployDripFixture);
        await expect(
          dripCore.connect(sender).createStream(
            [sender.address],
            ethers.ZeroAddress,
            [ethers.parseEther("100")],
            3600,
            ethers.parseEther("100"),
            "",
            ""
          )
        ).to.be.rejectedWith("DripCore: Cannot stream to self");
      });

      it("Should reject incorrect native amount", async function () {
        const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
        await expect(
          dripCore.connect(sender).createStream(
            [recipient1.address],
            ethers.ZeroAddress,
            [ethers.parseEther("100")],
            3600,
            ethers.parseEther("100"),
            "",
            ""
          , { value: ethers.parseEther("50") }) // Wrong amount
        ).to.be.rejectedWith("DripCore: Incorrect native amount");
      });

      it("Should reject title too long", async function () {
        const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
        const longTitle = "a".repeat(121); // 121 chars
        await expect(
          dripCore.connect(sender).createStream(
            [recipient1.address],
            ethers.ZeroAddress,
            [ethers.parseEther("100")],
            3600,
            ethers.parseEther("100"),
            longTitle,
            ""
          , { value: ethers.parseEther("100") })
        ).to.be.rejectedWith("DripCore: Title too long");
      });
    });

    describe("Platform Fees", function () {
      it("Should deduct platform fee from deposit", async function () {
        const { dripCore, sender, recipient1, platformFeeRecipient } = await loadFixture(deployDripFixture);
        const deposit = ethers.parseEther("1000");
        const fee = deposit * 50n / 10000n; // 0.5%
        const expectedDeposit = deposit - fee;

        const balanceBefore = await ethers.provider.getBalance(platformFeeRecipient.address);

        await dripCore.connect(sender).createStream(
          [recipient1.address],
          ethers.ZeroAddress,
          [ethers.parseEther("1000")],
          7 * 24 * 60 * 60,
          deposit,
          "",
          ""
        , { value: deposit });

        const balanceAfter = await ethers.provider.getBalance(platformFeeRecipient.address);
        expect(balanceAfter - balanceBefore).to.equal(fee);

        const stream = await dripCore.getStream(1);
        expect(stream.deposit).to.equal(expectedDeposit);
      });
    });
  });

  describe("Balance Accrual", function () {
    it("Should accrue balance correctly over time", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60; // 7 days
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      
      // Check balance immediately (should be 0 or very small)
      const balance0 = await dripCore.getRecipientBalance(streamId, recipient1.address);
      expect(balance0).to.equal(0n);

      // Advance time by 1 day
      await time.increase(24 * 60 * 60);
      
      const balance1Day = await dripCore.getRecipientBalance(streamId, recipient1.address);
      const expectedBalance = (ethers.parseEther("100") * BigInt(24 * 60 * 60)) / BigInt(7 * 24 * 60 * 60);
      expect(balance1Day).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));

      // Advance time by another day
      await time.increase(24 * 60 * 60);
      
      const balance2Days = await dripCore.getRecipientBalance(streamId, recipient1.address);
      const expectedBalance2 = (ethers.parseEther("100") * BigInt(2 * 24 * 60 * 60)) / BigInt(7 * 24 * 60 * 60);
      expect(balance2Days).to.be.closeTo(expectedBalance2, ethers.parseEther("0.01"));
    });

    it("Should cap balance at total deposit", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      const stream = await dripCore.getStream(streamId);
      const maxBalance = stream.deposit;

      // Advance time beyond stream duration
      await time.increase(10 * 24 * 60 * 60);

      const balance = await dripCore.getRecipientBalance(streamId, recipient1.address);
      expect(balance <= maxBalance).to.be.true;
    });

    it("Should calculate balance correctly for multiple recipients", async function () {
      const { dripCore, sender, recipient1, recipient2 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("300");
      const periodSeconds = 7 * 24 * 60 * 60;
      const recipients = [
        recipient1.address,
        recipient2.address
      ];
      const amountsPerPeriod = [
        ethers.parseEther("200"), // 2/3 of total
        ethers.parseEther("100")  // 1/3 of total
      ];

      await dripCore.connect(sender).createStream(
        recipients,
        ethers.ZeroAddress,
        amountsPerPeriod,
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await time.increase(24 * 60 * 60); // 1 day

      const balance1 = await dripCore.getRecipientBalance(streamId, recipient1.address);
      const balance2 = await dripCore.getRecipientBalance(streamId, recipient2.address);

      // Recipient 1 should have approximately 2x the balance of recipient 2
      expect(balance1 > balance2).to.be.true;
      const diff = balance1 > balance2 * 2n ? balance1 - balance2 * 2n : balance2 * 2n - balance1;
      expect(diff).to.be.lte(ethers.parseEther("0.01"));
    });
  });

  describe("Withdrawals", function () {
    it("Should allow recipient to withdraw accrued balance", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await time.increase(24 * 60 * 60); // 1 day

      const balanceBefore = await ethers.provider.getBalance(recipient1.address);
      const availableBalance = await dripCore.getRecipientBalance(streamId, recipient1.address);
      
      const tx = await dripCore.connect(recipient1).withdrawFromStream(streamId, recipient1.address, 0);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(recipient1.address);
      const received = balanceAfter - balanceBefore + gasUsed;
      const diff = received > availableBalance ? received - availableBalance : availableBalance - received;
      expect(diff).to.be.lte(ethers.parseEther("0.001"));
    });

    it("Should allow partial withdrawal", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await time.increase(24 * 60 * 60);

      const availableBalance = await dripCore.getRecipientBalance(streamId, recipient1.address);
      const withdrawAmount = availableBalance / 2n;

      await dripCore.connect(recipient1).withdrawFromStream(streamId, recipient1.address, withdrawAmount);

      const remainingBalance = await dripCore.getRecipientBalance(streamId, recipient1.address);
      const expected = availableBalance - withdrawAmount;
      const diff = remainingBalance > expected ? remainingBalance - expected : expected - remainingBalance;
      expect(diff).to.be.lte(ethers.parseEther("0.001"));
    });

    it("Should reject withdrawal by non-recipient", async function () {
      const { dripCore, sender, recipient1, recipient2 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await time.increase(24 * 60 * 60);

      await expect(
        dripCore.connect(recipient2).withdrawFromStream(streamId, recipient1.address, 0)
      ).to.be.rejectedWith("DripCore: Only recipient can withdraw");
    });

    it("Should reject withdrawal from inactive stream", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await dripCore.connect(sender).cancelStream(streamId);

      await expect(
        dripCore.connect(recipient1).withdrawFromStream(streamId, recipient1.address, 0)
      ).to.be.rejectedWith("DripCore: Stream not active");
    });

    it("Should mark stream as completed when fully withdrawn", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      // Advance time to complete stream
      await time.increase(8 * 24 * 60 * 60);

      await dripCore.connect(recipient1).withdrawFromStream(streamId, recipient1.address, 0);

      const stream = await dripCore.getStream(streamId);
      expect(stream.status).to.equal(3n); // Completed
    });
  });

  describe("Pause and Resume", function () {
    it("Should pause an active stream", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await time.increase(24 * 60 * 60);
      const balanceBeforePause = await dripCore.getRecipientBalance(streamId, recipient1.address);

      await expect(dripCore.connect(sender).pauseStream(streamId))
        .to.emit(dripCore, "StreamPaused");

      const stream = await dripCore.getStream(streamId);
      expect(stream.status).to.equal(2n); // Paused

      // Advance time - balance should not increase
      await time.increase(24 * 60 * 60);
      const balanceAfterPause = await dripCore.getRecipientBalance(streamId, recipient1.address);
      expect(balanceAfterPause).to.equal(balanceBeforePause);
    });

    it("Should resume a paused stream", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await dripCore.connect(sender).pauseStream(streamId);
      await time.increase(24 * 60 * 60);

      await expect(dripCore.connect(sender).resumeStream(streamId))
        .to.emit(dripCore, "StreamResumed");

      const stream = await dripCore.getStream(streamId);
      expect(stream.status).to.equal(0n); // Active

      // Balance should start accruing again
      await time.increase(24 * 60 * 60);
      const balance = await dripCore.getRecipientBalance(streamId, recipient1.address);
      expect(balance).to.be.gt(0);
    });

    it("Should extend end time by paused duration", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      const streamBefore = await dripCore.getStream(streamId);
      const originalEndTime = streamBefore.endTime;

      await dripCore.connect(sender).pauseStream(streamId);
      await time.increase(24 * 60 * 60); // Pause for 1 day
      await dripCore.connect(sender).resumeStream(streamId);

      const streamAfter = await dripCore.getStream(streamId);
      // End time should be extended (approximately)
      expect(streamAfter.endTime >= originalEndTime).to.be.true;
    });
  });

  describe("Stream Cancellation", function () {
    it("Should cancel stream and refund remaining balance", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await time.increase(24 * 60 * 60); // 1 day elapsed

      const balanceBefore = await ethers.provider.getBalance(sender.address);
      const availableBalance = await dripCore.getRecipientBalance(streamId, recipient1.address);

      const tx = await dripCore.connect(sender).cancelStream(streamId);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(sender.address);
      const stream = await dripCore.getStream(streamId);
      const expectedRefund = stream.deposit - availableBalance;

      const received = balanceAfter - balanceBefore + gasUsed;
      const diff = received > expectedRefund ? received - expectedRefund : expectedRefund - received;
      expect(diff).to.be.lte(ethers.parseEther("0.001"));
      expect(stream.status).to.equal(1n); // Cancelled
    });

    it("Should reject cancellation by non-sender", async function () {
      const { dripCore, sender, recipient1, recipient2 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await expect(
        dripCore.connect(recipient2).cancelStream(streamId)
      ).to.be.rejectedWith("DripCore: Unauthorized");
    });
  });

  describe("Query Functions", function () {
    it("Should return recipient info correctly", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await time.increase(24 * 60 * 60);

      const info = await dripCore.getRecipientInfo(streamId, recipient1.address);
      expect(info.recipient).to.equal(recipient1.address);
      expect(info.ratePerSecond).to.be.gt(0);
      expect(info.currentAccrued).to.be.gt(0);
      expect(info.totalWithdrawn).to.equal(0n);
    });

    it("Should return all recipients info", async function () {
      const { dripCore, sender, recipient1, recipient2 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("200");
      const periodSeconds = 7 * 24 * 60 * 60;
      const recipients = [
        recipient1.address,
        recipient2.address
      ];
      const amountsPerPeriod = [
        ethers.parseEther("100"),
        ethers.parseEther("100")
      ];

      await dripCore.connect(sender).createStream(
        recipients,
        ethers.ZeroAddress,
        amountsPerPeriod,
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await time.increase(24 * 60 * 60);

      const allRecipients = await dripCore.getAllRecipientsInfo(streamId);
      expect(allRecipients.length).to.equal(2n);
      expect(allRecipients[0].recipient).to.equal(recipient1.address);
      expect(allRecipients[1].recipient).to.equal(recipient2.address);
    });

    it("Should return user's sent streams", async function () {
      const { dripCore, sender, recipient1, recipient2 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      await dripCore.connect(sender).createStream(
        [recipient2.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streams = await dripCore.getUserSentStreams(sender.address);
      expect(streams.length).to.equal(2n);
    });

    it("Should return user's received streams", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streams = await dripCore.getUserReceivedStreams(recipient1.address);
      expect(streams.length).to.equal(1n);
      expect(streams[0].recipients[0]).to.equal(recipient1.address);
    });
  });

  describe("Platform Fee Management", function () {
    it("Should allow owner to update platform fee", async function () {
      const { dripCore, deployer } = await loadFixture(deployDripFixture);
      await dripCore.connect(deployer).setPlatformFee(100); // 1%
      expect(await dripCore.platformFeeBps()).to.equal(100n);
    });

    it("Should reject fee update above 10%", async function () {
      const { dripCore, deployer } = await loadFixture(deployDripFixture);
      await expect(
        dripCore.connect(deployer).setPlatformFee(1001)
      ).to.be.rejectedWith("DripCore: Fee too high");
    });

    it("Should reject fee update by non-owner", async function () {
      const { dripCore, sender } = await loadFixture(deployDripFixture);
      await expect(
        dripCore.connect(sender).setPlatformFee(100)
      ).to.be.rejected;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small amounts", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("0.001");
      const periodSeconds = 3600; // 1 hour
      const amountPerPeriod = ethers.parseEther("0.001");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await time.increase(1800); // 30 minutes

      const balance = await dripCore.getRecipientBalance(streamId, recipient1.address);
      expect(balance).to.be.gt(0);
    });

    it("Should handle multiple withdrawals correctly", async function () {
      const { dripCore, sender, recipient1 } = await loadFixture(deployDripFixture);
      const deposit = ethers.parseEther("100");
      const periodSeconds = 7 * 24 * 60 * 60;
      const amountPerPeriod = ethers.parseEther("100");

      await dripCore.connect(sender).createStream(
        [recipient1.address],
        ethers.ZeroAddress,
        [amountPerPeriod],
        periodSeconds,
        deposit,
        "",
        ""
      , { value: deposit });

      const streamId = 1;
      await time.increase(24 * 60 * 60);

      // First withdrawal
      const balance1 = await dripCore.getRecipientBalance(streamId, recipient1.address);
      await dripCore.connect(recipient1).withdrawFromStream(streamId, recipient1.address, balance1 / 2n);

      // Advance time and withdraw again
      await time.increase(24 * 60 * 60);
      const balance2 = await dripCore.getRecipientBalance(streamId, recipient1.address);
      expect(balance2).to.be.gt(0);

      const info = await dripCore.getRecipientInfo(streamId, recipient1.address);
      expect(info.totalWithdrawn).to.be.gt(0);
    });
  });
});

