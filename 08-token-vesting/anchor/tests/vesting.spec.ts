// No imports needed: web3, anchor, pg and more are globally available
import * as anchor from "@coral-xyz/anchor";
import { BankrunProvider } from "anchor-bankrun";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { BN, Program } from "@coral-xyz/anchor";

import {
  startAnchor,
  Clock,
  BanksClient,
  ProgramTestContext,
} from "solana-bankrun";

import { createMint, mintTo } from "spl-token-bankrun";
import { PublicKey, Keypair } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import IDL from "../target/idl/vesting.json";
import { Vesting } from "../target/types/vesting";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

describe("Vesting Smart Contract Tests", () => {
  const companyName = "Company";
  let beneficiary: Keypair;
  let vestingAccountKey: PublicKey;
  let treasuryTokenAccountKey: PublicKey;
  let employeeAccount: PublicKey;
  let provider: BankrunProvider;
  let program: Program<Vesting>;
  let banksClient: BanksClient;
  let employer: Keypair;
  let mint: PublicKey;
  let beneficiaryProvider: BankrunProvider;
  let program2: Program<Vesting>;
  let context: ProgramTestContext;

  beforeAll(async () => {
    beneficiary = new anchor.web3.Keypair();

    // set up bankrun
    context = await startAnchor(
      "",
      [{ name: "vesting", programId: new PublicKey(IDL.address) }],
      [
        {
          address: beneficiary.publicKey,
          info: {
            lamports: 1_000_000_000,
            data: Buffer.alloc(0),
            owner: SYSTEM_PROGRAM_ID,
            executable: false,
          },
        },
      ]
    );
    provider = new BankrunProvider(context);

    anchor.setProvider(provider);

    program = new Program<Vesting>(IDL as Vesting, provider);

    banksClient = context.banksClient;

    employer = provider.wallet.payer;

    // Create a new mint
    // @ts-ignore
    mint = await createMint(banksClient, employer, employer.publicKey, null, 2);

    // Generate a new keypair for the beneficiary
    beneficiaryProvider = new BankrunProvider(context);
    beneficiaryProvider.wallet = new NodeWallet(beneficiary);

    program2 = new Program<Vesting>(IDL as Vesting, beneficiaryProvider);

    // Derive PDAs
    [vestingAccountKey] = PublicKey.findProgramAddressSync(
      [Buffer.from(companyName)],
      program.programId
    );

    [treasuryTokenAccountKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("vesting_treasury"), Buffer.from(companyName)],
      program.programId
    );

    [employeeAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("employee_vesting"),
        beneficiary.publicKey.toBuffer(),
        vestingAccountKey.toBuffer(),
      ],
      program.programId
    );
    console.log('vesting account pda:', vestingAccountKey);
    console.log('treasury account pda:', treasuryTokenAccountKey);
  });

  it("should create a vesting account", async () => {
    const tx = await program.methods
      .createVestingAccount(companyName)
      .accounts({
        owner: employer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    const vestingAccountData = await program.account.vestingData.fetch(
      vestingAccountKey,
      "confirmed"
    );
    console.log(
      "Vesting Account Data:",vestingAccountData
    );

    console.log("Create Vesting Account Transaction Signature:", tx);

  });

  it("should fund the treasury token account", async () => {
    const amount = 10_000 * 10 ** 9;
    const mintTx = await mintTo(
      // @ts-ignores
      banksClient,
      employer,
      mint,
      treasuryTokenAccountKey,
      employer,
      amount
    );

    console.log("Mint to Treasury Transaction Signature:", mintTx);
  });

  it("should create an employee vesting account", async () => {
    const tx2 = await program.methods
      .createEmployeeAccount(new BN(0), new BN(100), new BN(100 * 10 ** 9), new BN(0))
      .accounts({
        beneficiary: beneficiary.publicKey,
        vestingAccount: vestingAccountKey,
      })
      .rpc({ commitment: "confirmed", skipPreflight: true });

    console.log("Create Employee Account Transaction Signature:", tx2);
    console.log("Employee account", employeeAccount.toBase58());
  });

  it("should claim tokens", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const currentClock = await banksClient.getClock();
    context.setClock(
      new Clock(
        currentClock.slot,
        currentClock.epochStartTimestamp,
        currentClock.epoch,
        currentClock.leaderScheduleEpoch,
        BigInt(1000)
      )
    );

    console.log("Employee account", employeeAccount.toBase58());

    const tx3 = await program2.methods
      .claimTokens(companyName)
      .accounts({
        // todo: why other fields don't need to pass
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Claim Tokens transaction signature", tx3);

    // check that the ATA account hold all the treasury
    const associatedTokenAddress = await getAssociatedTokenAddress(
        mint,           // Token mint address
        beneficiary.publicKey,          // Owner's public key
        false,                   // Whether the account should be associated or not (usually false)
        TOKEN_PROGRAM_ID,        // The Token Program ID (SPL Token Program)
    );
    console.log('ata:', associatedTokenAddress);
    // get spl token account
    const tokenAccountInfo = await getAccount(provider.connection, associatedTokenAddress);
    console.log('token account:', tokenAccountInfo);

    const employeeData = await program.account.employeeData.fetch(
        employeeAccount
    );
    expect(employeeData.totalAmount.toNumber()).toEqual(employeeData.totalWithdrawn.toNumber());
    expect(tokenAccountInfo.amount).toEqual(BigInt(employeeData.totalWithdrawn.toString()));
  });
});
