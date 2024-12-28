import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from "@coral-xyz/anchor";
import { Crudapp } from "../target/types/crudapp";
const IDL = require('../target/idl/crudapp.json');
const programId = new PublicKey('DEm6215DnsbbS4EGKzApXRVBabQTZHGvQ6gP25iZWCSq');

describe('crudapp', () => {
  let provider: BankrunProvider;
  let program: Program<Crudapp>;
  let context;

  beforeAll(async () => {
    context = await startAnchor("", [{name:"crudapp", programId: programId}],[]);
    provider = new BankrunProvider(context);
    program = new anchor.Program(IDL, provider);
  });

  const title = 'bootcamp';
  it('should create a new record', async () => {
    const record = {
      title: title,
      message: 'hello world',
    };
    const tx = await program.methods.createJournalEntry(
      record.title, record.message,
    ).rpc();
    expect(tx).toBeDefined();
    // get program signer's publickey
    const programSigner = provider.publicKey;
    console.log('Program signer public key:', programSigner.toBase58());

    const [addr] = PublicKey.findProgramAddressSync(
      [Buffer.from(record.title), programSigner.toBuffer()],
      program.programId
    );
    const entry = await program.account.journalEntry.fetch(addr);
    expect(entry.title).toEqual(record.title);
    expect(entry.message).toEqual(record.message);
  });

  it('should update a record', async () => {
    const updatedRecord = {
      title: title,
      message: 'hello world updated',
    };
    const tx = await program.methods.updateJournalEntry(
      updatedRecord.title, updatedRecord.message,
    ).rpc();
    expect(tx).toBeDefined();

    const [addr] = PublicKey.findProgramAddressSync(
      [Buffer.from(title), provider.publicKey.toBuffer()],
      program.programId
    );
    console.log('addr:', addr.toBase58());
    const entry = await program.account.journalEntry.fetch(addr);
    expect(entry.title).toEqual(updatedRecord.title);
    expect(entry.message).toEqual(updatedRecord.message);
  });

  it('should delete a record', async () => {
    const [addr] = PublicKey.findProgramAddressSync(
      [Buffer.from(title), provider.publicKey.toBuffer()],
      program.programId
    );
    // console.log('addr:', addr.toBase58());

    const tx2 = await program.methods.deleteJournalEntry(
      title,
    ).rpc();
    expect(tx2).toBeDefined();
    
    const entry = await program.account.journalEntry.fetchNullable(addr);
    console.log('entry:', entry);
    expect(entry).toBeNull();
  });
});